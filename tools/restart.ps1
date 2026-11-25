# (Re)starts the world server on this PC, whether it runs or not, hidden in the background: PowerShell can be closed after.
#   powershell -ExecutionPolicy Bypass -File D:\frb\g_worldsim\tools\restart.ps1          restart
#   powershell -ExecutionPolicy Bypass -File D:\frb\g_worldsim\tools\restart.ps1 -Pull    get the latest code from GitHub first
# The server compiles itself at start when the code changed (and runs npm install when the packages changed).
# Node: D:\node\node.exe (imad 2026-11-25), else the repo's .node\, else node on the PATH. Output: data\stdout.log / stderr.log.
param([switch]$Pull, [string]$Node = 'D:\node\node.exe')
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
if (-not (Test-Path $Node)) {
  $Node = Get-ChildItem (Join-Path $repo '.node') -Filter node.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
  if (-not $Node) { $Node = 'node' }
}
$data = Join-Path $repo 'data'
New-Item -ItemType Directory -Force $data | Out-Null
$pause = Join-Path $data 'watchdog.pause'
$cfg = @{}
try { $cfg = Get-Content (Join-Path $repo 'worldsim.config.json') -Raw | ConvertFrom-Json } catch { }
$port = if ($cfg.port) { $cfg.port } else { 8787 }
$health = "http://127.0.0.1:$port/health"
function Say($m) { Write-Host $m; Add-Content -Path (Join-Path $data 'watchdog.log') -Value ("{0}  restart.ps1: {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) }
function ServerPids { @(Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*packages/server/dist/main.js*' } | ForEach-Object { $_.ProcessId }) }
function Up { try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $health; return ($r.Content -match '"ok":true') } catch { return $false } }

Set-Content $pause (Get-Date -Format o)   # the watchdog leaves the server alone meanwhile
try {
  Say "node: $Node"
  if ($Pull) {
    Say 'getting the latest code (git pull)'
    git checkout -- docs 2>$null
    git pull --rebase --autostash
    if ($LASTEXITCODE -ne 0) { Say 'git pull failed: restarting with the code already here' }
  }
  $pids = ServerPids
  if ($pids.Count) {
    Say "stopping the server (pid $($pids -join ', ')): it saves the world first"
    & $Node tools/stop.mjs *> $null
    for ($i = 0; $i -lt 30 -and (ServerPids).Count; $i++) { Start-Sleep 1 }
    foreach ($p in ServerPids) { Say "still running, killing pid $p"; Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
    Start-Sleep 1
  } else { Say 'the server was not running' }
  # A leftover ngrok keeps the domain busy: stop the one this server uses (no server runs now).
  $ngrokBin = $cfg.tunnel.bin.ngrok
  if ($ngrokBin) { Get-Process ngrok -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $ngrokBin } | Stop-Process -Force -ErrorAction SilentlyContinue }
  # Hidden window of its own: not tied to this PowerShell, which can be closed.
  $p = Start-Process -PassThru -FilePath $Node -ArgumentList '--disable-warning=ExperimentalWarning', 'packages/server/dist/main.js' `
    -WorkingDirectory $repo -WindowStyle Hidden -RedirectStandardOutput (Join-Path $data 'stdout.log') -RedirectStandardError (Join-Path $data 'stderr.log')
  Say "server started in the background, pid $($p.Id); waiting for it (it compiles first when the code changed)"
  $ok = $false
  for ($i = 0; $i -lt 180 -and -not $ok; $i++) { Start-Sleep 1; $ok = Up; if ($p.HasExited) { break } }
  if ($ok) { Say "server is up: $health. You can close this window." }
  elseif ($p.HasExited) { Say "the server stopped at once (exit $($p.ExitCode)). Last lines of data\stderr.log:"; Get-Content (Join-Path $data 'stderr.log') -Tail 25 }
  else { Say 'no answer after 3 minutes: see data\stdout.log and data\stderr.log' }
} finally { Remove-Item $pause -Force -ErrorAction SilentlyContinue }
