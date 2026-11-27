#!/bin/sh
# Fetches the CC0 KayKit packs the item models / icons are baked from (pinned commits) into .cache/assets/.
# The Quaternius and Kenney models used are small and kept in tools/assets/src/ (their source mirror is 1.4 GB).
set -e
cd "$(dirname "$0")/../.."
mkdir -p .cache/assets
get() { # dir repo sha
  [ -d ".cache/assets/$1" ] && return
  git init -q ".cache/assets/$1"
  git -C ".cache/assets/$1" fetch -q --depth 1 "https://github.com/KayKit-Game-Assets/$2" "$3"
  git -C ".cache/assets/$1" checkout -q FETCH_HEAD
}
get kaykit-adventurers KayKit-Character-Pack-Adventures-1.0 672074b73ba276876a19e8816ecdc5241817ab47
get kaykit-dungeon KayKit-Dungeon-Remastered-1.0 b0ca9bd96a8072ab36a3a5464f00ed1e06a16d07
get kaykit-hexagon KayKit-Medieval-Hexagon-Pack-1.0 84fa4e91af6a88989be7c99e0891cede11f2ca38
# Animals (CC0): Quaternius "Ultimate Animated Animals" (glTF, as published), and two OpenGameArt models (bear, rabbit)
# from a CC0 catalogue repository. Only the files used are checked out.
part() { # dir repo sha files...
  d="$1"; r="$2"; s="$3"; shift 3
  [ -d ".cache/assets/$d" ] && return
  git init -q ".cache/assets/$d"
  git -C ".cache/assets/$d" remote add origin "https://github.com/$r"
  git -C ".cache/assets/$d" fetch -q --depth 1 --filter=blob:none origin "$s"
  git -C ".cache/assets/$d" checkout -q FETCH_HEAD -- "$@"
}
part quaternius-animals benjaminpjones/catch-the-animal cf8e52eeb64429a210cebb4b12fe62b3ab06af2b models/glTF/Wolf.gltf models/glTF/Deer.gltf models/glTF/Stag.gltf
part oga-animals oosawak/cc0-monsters 2e7d7170f86916bacc5e4198728c406f4210c9ce files/converted/white-bear-low-poly/bear.glb files/converted/rabbit-0/rabbit.glb
echo "KayKit packs and animal models in .cache/assets"
