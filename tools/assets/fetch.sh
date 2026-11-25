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
echo "KayKit packs in .cache/assets"
