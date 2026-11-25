// Which open-source (CC0) model each item is baked from, and how it is turned / sized.
// q/ = tools/assets/src/quaternius, k/ = tools/assets/src/kenney, adv/ dun/ hex/ = the KayKit packs in .cache/assets (tools/assets/fetch.sh).
// rot: degrees (x, y, z) applied first; size: longest side in metres after turning; anchor: grip (bottom centre = the hand,
// the item along +Y), center, bottom. icon: how the icon camera sees it (yaw / pitch degrees, zoom). world: also exported
// as a 3D model for the game (in hands, on heads...). pick: only meshes whose name matches. tint: colour multiply.
const ADV = 'adv/addons/kaykit_character_pack_adventures/Assets/gltf/';
const CHR = 'adv/addons/kaykit_character_pack_adventures/Characters/gltf/';
const DUN = 'dun/addons/kaykit_dungeon_remastered/Assets/gltf/';
const HEX = 'hex/addons/kaykit_medieval_hexagon_pack/Assets/gltf/';

export const ITEMS = [
  // weapons and tools (held: grip at the origin, the item pointing along +Y)
  { id: 'sword', src: 'q/Sword.fbx', rot: [0, 0, 0], size: 1.0, anchor: 'grip', world: true, icon: { yaw: 0, pitch: 0, roll: -45 } },
  { id: 'axe', src: 'q/Axe.fbx', rot: [0, 0, 0], size: 0.75, anchor: 'grip', world: true, icon: { yaw: 0, pitch: 0, roll: -40 } },
  { id: 'spear', src: 'q/Spear.fbx', rot: [0, 0, 0], size: 1.75, anchor: 'grip', world: true, icon: { yaw: 0, pitch: 0, roll: -45 } },
  { id: 'bow', src: 'q/Bow_Wooden.fbx', rot: [0, 0, 0], size: 1.1, anchor: 'center', world: true, icon: { yaw: 0, pitch: 0, roll: -45 } },
  { id: 'arrows', src: ADV + 'arrow_bundle.gltf', rot: [0, 0, 0], size: 0.7, anchor: 'grip', world: true, icon: { yaw: 30, pitch: 10, roll: -35 } },
  { id: 'hammer', src: 'q/Hammer_Small.fbx', rot: [0, 0, 0], size: 0.55, anchor: 'grip', world: true, icon: { yaw: 0, pitch: 0, roll: -40 } },
  { id: 'sledge', src: 'q/Hammer_Double.fbx', rot: [0, 0, 0], size: 0.85, anchor: 'grip', world: true, icon: { yaw: 0, pitch: 0, roll: -40 } },
  // worn
  { id: 'helmet', src: 'q/Helmet1.fbx', rot: [0, 0, 0], size: 0.42, anchor: 'center', world: true, icon: { yaw: 35, pitch: 15 } },
  { id: 'pads', src: 'q/ShoulderPads.fbx', rot: [0, 0, 0], size: 0.62, anchor: 'center', world: true, icon: { yaw: 20, pitch: 20 } },
  { id: 'armor', src: CHR + 'Knight.glb', pick: /Body/i, rot: [0, 0, 0], size: 0.8, anchor: 'center', icon: { yaw: 25, pitch: 10 } },
  { id: 'clothes', src: CHR + 'Barbarian.glb', pick: /Body/i, rot: [0, 0, 0], size: 0.8, anchor: 'center', icon: { yaw: 25, pitch: 10 } },
  // materials
  { id: 'wood', src: HEX + 'decoration/props/resource_lumber.gltf', rot: [0, 0, 0], size: 1, anchor: 'center', icon: { yaw: 30, pitch: 30 } },
  { id: 'stone', src: HEX + 'decoration/props/resource_stone.gltf', rot: [0, 0, 0], size: 1, anchor: 'center', icon: { yaw: 30, pitch: 30 } },
  { id: 'ore', parts: [
    { src: HEX + 'decoration/nature/rock_single_C.gltf', rot: [0, 0, 0], scale: 1, at: [0, 0, 0], tint: [0.8, 0.72, 0.68] },
    { src: 'q/Gems.fbx', rot: [0, 30, 0], scale: 0.8, at: [0.05, 0.35, 0.2], tint: [0.45, 0.75, 1.0] },
  ], rot: [0, 0, 0], size: 1, anchor: 'center', icon: { yaw: 30, pitch: 30 } },
  { id: 'scrap', src: DUN + 'sword_shield_broken.gltf.glb', rot: [0, 0, 0], size: 1, anchor: 'center', icon: { yaw: 20, pitch: 25 } },
  { id: 'brick', src: DUN + 'wall_half.gltf.glb', rot: [0, 0, 90], size: 1, anchor: 'center', icon: { yaw: 35, pitch: 25 } },
  { id: 'leather', src: 'q/Scroll.fbx', rot: [0, 0, 0], size: 1, anchor: 'center', tint: [0.75, 0.48, 0.28], icon: { yaw: 30, pitch: 30 } },
  { id: 'claw', src: 'q/Dagger_2.fbx', rot: [0, 0, 0], size: 1, anchor: 'center', tint: [1.0, 0.95, 0.8], icon: { yaw: 0, pitch: 0, roll: -45 } },
  { id: 'herb', parts: [
    { src: HEX + 'decoration/nature/waterplant_B.gltf', rot: [0, 0, 0], scale: 1, at: [0, 0, 0], tint: [0.7, 1.0, 0.6] },
    { src: HEX + 'decoration/nature/waterplant_A.gltf', rot: [0, 70, 0], scale: 1, at: [0.12, 0, 0.1], tint: [0.8, 1.0, 0.7] },
    { src: HEX + 'decoration/nature/waterplant_C.gltf', rot: [0, 150, 0], scale: 1, at: [-0.12, 0, 0.05], tint: [0.75, 1.0, 0.65] },
  ], rot: [0, 0, 0], size: 1, anchor: 'center', icon: { yaw: 30, pitch: 30 } },
  // healing
  { id: 'medkit', parts: [
    { src: DUN + 'box_small.gltf.glb', rot: [0, 0, 0], scale: 1, at: [0, 0, 0], tint: [1.0, 0.32, 0.3] },
    { src: DUN + 'bottle_A_labeled_green.gltf.glb', rot: [0, 20, 0], scale: 1.1, at: [0.55, 0, 0.45] },
  ], rot: [0, 0, 0], size: 1, anchor: 'center', icon: { yaw: 30, pitch: 28 } },
  // put down
  { id: 'palisade', src: HEX + 'buildings/neutral/fence_wood_straight.gltf', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 30, pitch: 25 } },
  { id: 'spikes', src: 'k/spikes.glb', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 30, pitch: 30 } },
  { id: 'stonewall', src: HEX + 'buildings/neutral/fence_stone_straight.gltf', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 30, pitch: 25 } },
  { id: 'door', src: 'k/door.glb', tint: [0.72, 0.5, 0.32], rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 110, pitch: 10 } },
  { id: 'window', src: DUN + 'wall_archedwindow_open.gltf.glb', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 25, pitch: 10 } },
  { id: 'bed', src: DUN + 'bed_floor.gltf.glb', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 35, pitch: 35 } },
  { id: 'lamp', src: DUN + 'torch_lit.gltf.glb', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 30, pitch: 15 } },
  { id: 'campfire', parts: [
    { src: HEX + 'decoration/props/resource_lumber.gltf', rot: [0, 35, 0], scale: 0.75, at: [0, 0, 0] },
    { src: HEX + 'decoration/props/resource_lumber.gltf', rot: [0, -55, 0], scale: 0.7, at: [0, 0.12, 0] },
    { src: HEX + 'decoration/nature/rock_single_A.gltf', rot: [0, 0, 0], scale: 0.35, at: [0.45, 0, 0.25] },
    { src: HEX + 'decoration/nature/rock_single_B.gltf', rot: [0, 120, 0], scale: 0.35, at: [-0.45, 0, -0.15] },
  ], rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 30, pitch: 35 } },
  { id: 'hut', src: HEX + 'buildings/blue/building_home_A_blue.gltf', rot: [0, 0, 0], size: 1, anchor: 'bottom', icon: { yaw: 30, pitch: 25 } },
];
