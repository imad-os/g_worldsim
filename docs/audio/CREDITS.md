# Sound credits

Most sounds here are CC0 (public domain). Some are CC BY 4.0 or CC BY-SA 3.0: those need the credit below, and the CC BY-SA files
(and changes to them) stay CC BY-SA 3.0. Each sound's licence and source is also in manifest.json.

- Fantozzi's Footsteps (Grass/Sand & Stone): https://opengameart.org/content/fantozzis-footsteps-grasssand-stone (CC0)
- Fantasy Sound Effects (Tinysized SFX): https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx (CC0)
- Footsteps Leather, Cloth, Armor: https://opengameart.org/content/footsteps-leather-cloth-armor (CC0)
- 40 CC0 water / splash / slime SFX: https://opengameart.org/content/40-cc0-water-splash-slime-sfx (CC0)
- Swishes Sound Pack: https://opengameart.org/content/swishes-sound-pack (CC0)
- RPG Sound Pack: https://opengameart.org/content/rpg-sound-pack (CC0)
- 3 Melee sounds: https://opengameart.org/content/3-melee-sounds (CC0)
- 80 CC0 RPG SFX: https://opengameart.org/content/80-cc0-rpg-sfx (CC0)
- 7 Eating Crunches: https://opengameart.org/content/7-eating-crunches (CC0)
- tree chop fall thud: https://opengameart.org/content/tree-chop-fall-thud (CC0)
- Breaking Rock: https://opengameart.org/content/breaking-rock (CC0)
- Interface Sounds (Kenney): https://opengameart.org/content/interface-sounds (CC0)
- Zombies Sound Pack: https://opengameart.org/content/zombies-sound-pack (CC0)
- Rabbit Eating: https://opengameart.org/content/rabbit-eating (CC0)
- Boar: https://opengameart.org/content/boar-0 (CC0)
- Dog Snarl Grunt Grumble: https://opengameart.org/content/dog-snarl-grunt-grumble (CC0)
- Bear Growls: https://opengameart.org/content/bear-growls (CC0)
- Bird chirping sounds: https://opengameart.org/content/bird-chirping-sounds (CC0)
- Ambient Bird Sounds: https://opengameart.org/content/ambient-bird-sounds (CC0)
- wind1: https://opengameart.org/content/wind1 (CC0)

## Ambience, horses, animals, weather (2026-11-27)

CC0, from Freesound, cut by funcoder (https://github.com/funcoder/omarchy-ambient, CREDITS.md there):
- amb_day: "Forest quiet atmosphere with some birds" by felix.blume, https://freesound.org/s/414098/
- amb_night: "Crickets (close recording)" by felix.blume, https://freesound.org/s/476672/
- rain_loop: "Soft rain on a tile roof" by richwise, https://freesound.org/s/466241/
- wind_loop: "Wind on bushes with muffled gust of wind" by felix.blume, https://freesound.org/s/711106/
- owl: "owl hoot" by breviceps, https://freesound.org/s/465697/ (CC0, via https://github.com/EternityForest/Free-SFX)
- bear_roar 3: "lion growl" by MATRIXXX_, https://freesound.org/s/516829/ (CC0), pitched down

CC BY 4.0: **Oculus Audio Pack, by Meta** (https://github.com/facebookincubator/Meta-open-sound, corpora/oculus-audio-pack),
licence https://creativecommons.org/licenses/by/4.0/ : amb_woods (AMBForst_Forest_LOOP_01), amb_night_woods (AMBForst_Night_LOOP_01),
rain_heavy (RAINVege_ForestRain_LOOP_01), horse 1-2 (ANMLHors_HorseNeigh / HorseNeighAmbient), boar_attack 2 (ANMLFarm_PigSqueal_OS_01, pitched down).

CC BY-SA 3.0: **0 A.D., Copyright (C) Wildfire Games** (https://www.wildfiregames.com/, https://github.com/0ad/0ad,
binaries/data/mods/public/audio), licence https://creativecommons.org/licenses/by-sa/3.0/ : fire_loop (attack/fire/c_11-c_19 stitched),
fire_pop (attack/fire/sz11-15), thunder (ambient/weather/thunder_10, 11), wind_gust (windgust_11), blizzard_loop (snowstorm_11),
hoof and gallop (actor/mounted/movement/mstep110-115, cut into beats and strides), horse 3-4 (horse_select1, 2), horse_snort (horse_idle1-3),
boar 1-2 (pig_10, pig_12, pitched down), boar_attack 3 (pig_squeal_move), bear_roar 4-5 (attack/lion1, lion3, pitched down).
These files, as changed here, are shared under CC BY-SA 3.0 too.

Synthesised for this game (CC0): wolf_howl and deer (alarm snort, bleat), `tools/audio/build.py`.

How they were made: `tools/audio/fetch.sh` (sources at pinned commits) then `python3 -I tools/audio/build.py` (cut, levelled, crossfaded).
The game plays each loop with two players crossfading from random places (packages/client/src/audio.ts), so loops never gap or repeat.

- whistle (calling the horse): synthesised for this game by `tools/audio/whistle.mjs` (CC0, 2026-11-26)

Prepared for this game (2026-11-21): trimmed, levelled to -1 dBFS peak, Ogg Vorbis 44.1 kHz quality 5; one-shots mono, loops stereo with a crossfaded seam.

Not found yet as good free recordings: sleep (yawn/snore), talk_m, talk_f, baby_cry, laugh. Deer and wolf howls are synthesised for now.
