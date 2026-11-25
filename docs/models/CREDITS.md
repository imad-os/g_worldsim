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
