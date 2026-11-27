#!/usr/bin/env bash
# Fetch the open-licence recordings the game's sounds are cut from, at pinned commits, into .cache/audio/ (not in git).
# Then: python3 tools/audio/build.py   (needs ffmpeg + numpy) -> docs/audio/...
# Licences: see docs/audio/CREDITS.md. Only the files listed here are checked out (sparse, blobs on demand).
set -euo pipefail
cd "$(dirname "$0")/../.."
C=.cache/audio; mkdir -p "$C"
get() { # name url commit files...
  local n=$1 u=$2 c=$3; shift 3
  if [ ! -d "$C/$n/.git" ]; then git clone -q --filter=blob:none --no-checkout "$u" "$C/$n"; fi
  git -C "$C/$n" fetch -q --depth 1 origin "$c" 2>/dev/null || true
  git -C "$C/$n" -c advice.detachedHead=false checkout -q "$c" -- "$@"
}
# CC0 (Freesound recordings by felix.blume, richwise, Sheyvan; cut by funcoder)
get omarchy https://github.com/funcoder/omarchy-ambient 2686c861bff26bc7da55dd8e4e858f6d66d39a41 \
  CREDITS.md sounds/birds.ogg sounds/crickets.ogg sounds/rain.ogg sounds/wind.ogg sounds/storm.ogg
# CC BY 4.0 (Oculus Audio Pack, Meta)
O=corpora/oculus-audio-pack/ogg
get meta https://github.com/facebookincubator/Meta-open-sound 514c926efecdb3c7812bf00eedf8e5c8d61dd681 \
  corpora/oculus-audio-pack/LICENSE $O/AMBForst_Forest_LOOP_01.ogg $O/AMBForst_Night_LOOP_01.ogg $O/RAINVege_ForestRain_LOOP_01.ogg \
  $O/ANMLHors_HorseNeighAmbient_OS_01.ogg $O/ANMLHors_HorseNeigh_OS_01.ogg $O/ANMLFarm_PigSqueal_OS_01.ogg $O/ANMLFarm_PigSqueal_OS_02.ogg
# CC BY-SA 3.0 (0 A.D., Wildfire Games)
A=binaries/data/mods/public/audio
get zad https://github.com/0ad/0ad 61a3b9507d974084e6badb88a0826bd89a6d5b8b \
  $A/LICENSE.txt $A/actor/mounted/movement $A/attack/fire $A/ambient/weather/thunder_10.ogg $A/ambient/weather/thunder_11.ogg \
  $A/ambient/weather/windgust_11.ogg $A/ambient/weather/snowstorm_11.ogg \
  $A/actor/fauna/animal/horse_idle1.ogg $A/actor/fauna/animal/horse_idle2.ogg $A/actor/fauna/animal/horse_idle3.ogg \
  $A/actor/fauna/animal/horse_select1.ogg $A/actor/fauna/animal/horse_select2.ogg \
  $A/actor/fauna/animal/pig_10.ogg $A/actor/fauna/animal/pig_12.ogg $A/actor/fauna/animal/pig_squeal_move.ogg \
  $A/actor/fauna/attack/lion1.ogg $A/actor/fauna/attack/lion2.ogg $A/actor/fauna/attack/lion3.ogg
# CC0 (Freesound: breviceps owl hoot, MATRIXXX_ growl)
get freesfx https://github.com/EternityForest/Free-SFX f2fe53330c2cc6dc47c73750409c963219e997be \
  LICENSE "Freesound/Animals/465697__breviceps__owl-hoot.opus" "Freesound/Animals/516829__matrixxx__lion-growl.opus"
echo "sources in $C"
