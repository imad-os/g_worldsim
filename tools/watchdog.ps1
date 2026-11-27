# Windows watchdog for the world server (run by Task Scheduler every 2 minutes and at logon, outside any terminal or
# assistant session, so the server it starts is never killed when such a session ends).
#   - data\watchdog.pause younger than 15 min: a deploy is running, do nothing (older = stale, removed).
#   - nothing answers http://127.0.0.1:<port>/health -> start the server hidden (it starts its tunnel itself).
#   - server ok but the public link fails 2 runs in a row -> clean restart (tools/stop.mjs saves a snapshot first).
# Never pulls or changes code. Port and public link come from worldsim.config.json at run time. Log: data\watchdog.log.
# Install: schtasks-style task running
#   powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File <repo>\tools\watchdog.ps1
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$node = if (Test-Path 'D:\node\node.exe') { 'D:\node\node.exe' } else { $null }   # imad 2026-11-25
if (-not $node) { $node = Get-ChildItem (Join-Path $repo '.node') -Filter node.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
if (-not $node) { $node = 'node' }
$data = Join-Path $repo 'data'
$log = Join-Path $data 'watchdog.log'
$state = Join-Path $data 'watchdog.fails'
$pause = Join-Path $data 'watchdog.pause'
$cfg = @{}
try { $cfg = Get-Content (Join-Path $repo 'worldsim.config.json') -Raw | ConvertFrom-Json } catch { }
$port = if ($cfg.port) { $cfg.port } else { 8787 }
$domain = $cfg.tunnel.ngrokDomain
$public = if ($domain) { "https://$domain/health" } else { $null }
$localUrl = "http://127.0.0.1:$port/health"

function Log($m) {
  if ((Test-Path $log) -and (Get-Item $log).Length -gt 1MB) { Move-Item $log "$log.old" -Force }
  Add-Content -Path $log -Value ("{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m)
}
function ServerPid { (Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'packages[\\/]server[\\/]dist[\\/]main\.js' } | Select-Object -First 1).ProcessId }
function Ok($url, $headers = @{}) {
  try { $r = Invoke-WebRequest -UseBasicParsing -Headers $headers -TimeoutSec 15 $url; return ($r.StatusCode -eq 200 -and $r.Content -match '"ok":true') } catch { return $false }
}
function StartServer($why) {
  # A leftover ngrok from a dead server keeps the domain busy: stop the one this server uses (no server runs now).
  $ngrokBin = $cfg.tunnel.bin.ngrok
  if ($ngrokBin) { Get-Process ngrok -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $ngrokBin } | Stop-Process -Force -ErrorAction SilentlyContinue }
  $p = Start-Process -PassThru -FilePath $node -ArgumentList '--disable-warning=ExperimentalWarning', 'packages/server/dist/main.js' `
    -WorkingDirectory $repo -WindowStyle Hidden -RedirectStandardOutput (Join-Path $data 'stdout.log') -RedirectStandardError (Join-Path $data 'stderr.log')
  Log "$why -> server started, pid $($p.Id)"
}

if (Test-Path $pause) {
  if (((Get-Date) - (Get-Item $pause).LastWriteTime).TotalMinutes -lt 15) { Log 'paused for deploy'; exit 0 }
  Remove-Item $pause -Force; Log 'stale pause flag removed'
}
$pidNow = ServerPid
if (-not (Ok $localUrl)) {
  if ($pidNow) {
    Start-Sleep 20   # maybe still starting
    if (Ok $localUrl) { exit 0 }
    Log "server pid $pidNow not answering locally, killing it"; Stop-Process -Id $pidNow -Force -ErrorAction SilentlyContinue; Start-Sleep 2
  }
  StartServer 'server was down'
  Set-Content $state 0
  exit 0
}
if (-not $public -or (Ok $public @{ 'ngrok-skip-browser-warning' = '1' })) { if ((Get-Content $state -ErrorAction SilentlyContinue) -ne '0') { Set-Content $state 0 }; exit 0 }
$fails = [int](Get-Content $state -ErrorAction SilentlyContinue) + 1
Set-Content $state $fails
Log "public link failed ($fails in a row), server ok locally (pid $pidNow)"
if ($fails -ge 2) {
  & $node tools/stop.mjs *> $null
  if ($pidNow) {
    for ($i = 0; $i -lt 30 -and (Get-Process -Id $pidNow -ErrorAction SilentlyContinue); $i++) { Start-Sleep 1 }
    if (Get-Process -Id $pidNow -ErrorAction SilentlyContinue) { Stop-Process -Id $pidNow -Force }
  } else { for ($i = 0; $i -lt 30 -and (Ok $localUrl); $i++) { Start-Sleep 1 } }
  StartServer 'public link down twice (tunnel)'
  Set-Content $state 0
}
