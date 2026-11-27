# Item models and icons: credits

Every item model (`docs/models/items.json`) and icon (`docs/icons/items.png`) is baked by `tools/assets/build-items.mjs`
from these free, open-source models. All are **CC0 1.0** (public domain): no attribution is required, it is given anyway.

| Items | Source | Author | License |
|---|---|---|---|
| sword, axe, spear, bow, hammer, heavy hammer, helmet, shoulder pads, claw (curved dagger), leather (scroll), ore gems | Medieval Weapons Pack, Knight Character, RPG Asset Pack | [Quaternius](https://quaternius.com) | CC0 1.0 |
| arrows, armour (knight body), clothes (barbarian body) | KayKit Adventurers Character Pack 1.0 | [Kay Lousberg](https://kaylousberg.com) | CC0 1.0 |
| wood, stone, ore rock, palisade, stone wall, campfire logs and stones, hut | KayKit Medieval Hexagon Pack 1.0 | [Kay Lousberg](https://kaylousberg.com) | CC0 1.0 |
| scrap (broken sword and shield), brick (wall block), window, bed, lamp (torch) | KayKit Dungeon Remastered 1.0 | [Kay Lousberg](https://kaylousberg.com) | CC0 1.0 |
| door, spikes | Platformer Kit 1.0 | [Kenney](https://kenney.nl) | CC0 1.0 |

The Quaternius and Kenney files used are kept in `tools/assets/src/` (with their license files); the KayKit packs are
fetched at pinned commits by `tools/assets/fetch.sh`. Colours come from the models' own materials and textures (no flat
placeholder colours); quality tints and glows are added by the game.

## Animated models


- `horse.glb`: Horse from "Ultimate Animated Animals" by Quaternius (https://quaternius.com, CC0 1.0). Kept animations:
  Idle, Idle_2, Eating, Walk, Gallop, Attack_Kick, Death. Prepared for this game (2026-11-25) with glTF-Transform: unused
  animations and constant tracks removed, keyframes resampled, mesh quantized (KHR_mesh_quantization), 280 KB.
  Coats, the saddle and the rare / legendary glow are added by the game (packages/client/src/gfx/horses.ts).

## Wild animals

Prepared by `tools/assets/build-animals.mjs` (sources fetched at pinned commits by `tools/assets/fetch.sh`): every part merged into
one skinned mesh with vertex colours, only the animations the game plays, keyframes resampled, mesh quantized
(KHR_mesh_quantization). Drawn by packages/client/src/gfx/beasts.ts.

- `wolf.glb`, `deer.glb` (doe), `stag.glb`: Wolf, Deer and Stag from "Ultimate Animated Animals" by Quaternius
  (https://quaternius.com, CC0 1.0), the same pack as the horse. Kept: Idle, Idle_2, Walk, Gallop, Eating, Attack (headbutt for
  deer), Hit, Death. The stag's antlers are moved onto its head bone.
- `rabbit.glb`: "Rabbit" by Snabisch (https://opengameart.org/content/rabbit-0, CC0). Wild-rabbit colours; the white body under
  the fur shell is pulled in a little so it no longer flickers through. Kept: Sitting (two idles), Running, Dying.
- `bear.glb`: "White Bear (Low poly)" by Phelippeau Rudy / STKudy85 (https://opengameart.org/content/white-bear-low-poly, CC0;
  texture in tools/assets/src/oga/). It had no skeleton: rigged for this game (hips, chest, head, four legs), its moves made here
  (Idle, Walk, Gallop, Eating, Attack = rears up and swipes), the fur texture turned brown.
