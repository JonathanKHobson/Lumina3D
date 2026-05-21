import {
  BARRIER_COLUMN_HALF_TARGET,
  FLOOR_TARGET,
  TILE
} from "./constants.js";

export const ASSETS = {
  frog: { type: "obj", base: "/assets/voxel/frog/", stem: "frog.vox", targetFootprint: TILE * 0.62 },
  elephant: { type: "obj", base: "/assets/voxel/elephant/", stem: "elephant.vox", targetFootprint: TILE * 0.82 },
  groundTile: {
    type: "obj",
    base: "/assets/kaykit/blockbits/ground/",
    stem: "sand_with_grass",
    targetFootprint: FLOOR_TARGET
  },
  pathTile: {
    type: "obj",
    base: "/assets/kaykit/blockbits/path/",
    stem: "sand_A",
    targetFootprint: FLOOR_TARGET
  },
  waterTile: {
    type: "obj",
    base: "/assets/kaykit/blockbits/water/",
    stem: "water",
    targetFootprint: FLOOR_TARGET
  },
  homeBlue: {
    type: "obj",
    base: "/assets/kaykit/medieval/home-blue/",
    stem: "building_home_A_blue",
    targetFootprint: TILE * 3.9
  },
  forestTreeA: {
    type: "obj",
    base: "/assets/kaykit/forest/",
    stem: "Tree_1_A_Color1",
    targetFootprint: TILE * 1.5
  },
  forestTreeB: {
    type: "obj",
    base: "/assets/kaykit/forest/",
    stem: "Tree_2_A_Color1",
    targetFootprint: TILE * 1.5
  },
  forestBush: {
    type: "obj",
    base: "/assets/kaykit/forest/",
    stem: "Bush_1_A_Color1",
    targetFootprint: TILE * 0.8
  },
  forestRock: {
    type: "obj",
    base: "/assets/kaykit/forest/",
    stem: "Rock_1_A_Color1",
    targetFootprint: TILE * 0.7
  },
  forestGrass: {
    type: "obj",
    base: "/assets/kaykit/forest/",
    stem: "Grass_1_B_Color1",
    targetFootprint: TILE * 0.55
  },
  bridgeModular: {
    type: "obj",
    base: "/assets/kaykit/platformer/bridge/",
    stem: "Bridge_Modular",
    targetFootprint: TILE * 1.12
  },
  bridgeCenter: {
    type: "obj",
    base: "/assets/kaykit/platformer/bridge/",
    stem: "Bridge_Modular_Center",
    targetFootprint: TILE * 1.12
  },
  bridgeSmall: {
    type: "obj",
    base: "/assets/kaykit/platformer/bridge/",
    stem: "Bridge_Small",
    targetFootprint: TILE * 2.25
  },
  barrier: { type: "obj", base: "/assets/kaykit/dungeon/barrier/", stem: "barrier", targetFootprint: TILE * 1.04 },
  tutorialBarrierBlue: {
    type: "obj",
    base: "/assets/kaykit/platformer/barrier-blue-1x1x1/",
    stem: "barrier_1x1x1_blue",
    targetFootprint: TILE * 1.04
  },
  barrierHalf: {
    type: "obj",
    base: "/assets/kaykit/dungeon/barrier_half/",
    stem: "barrier_half",
    targetFootprint: TILE * 0.78
  },
  barrierColumnHalf: {
    type: "obj",
    base: "/assets/kaykit/dungeon/barrier_colum_half/",
    stem: "barrier_colum_half",
    targetFootprint: BARRIER_COLUMN_HALF_TARGET
  },
  spellbookClosed: {
    type: "obj",
    base: "/assets/kaykit/adventurers/spellbook/",
    stem: "spellbook_closed",
    targetFootprint: 0.72
  },
  spellbookOpen: {
    type: "obj",
    base: "/assets/kaykit/adventurers/spellbook/",
    stem: "spellbook_open",
    targetFootprint: 0.92
  },
  buttonBaseBlue: {
    type: "obj",
    base: "/assets/kaykit/platformer/button-blue/",
    stem: "button_base_blue",
    targetFootprint: 1.22
  },
  buttonTopBlue: {
    type: "obj",
    base: "/assets/kaykit/platformer/button-blue/",
    stem: "button_base_blue_button_blue",
    targetFootprint: 0.92
  },
  buttonBaseRed: {
    type: "obj",
    base: "/assets/kaykit/platformer/button-red/",
    stem: "button_base_red",
    targetFootprint: 1.22
  },
  buttonTopRed: {
    type: "obj",
    base: "/assets/kaykit/platformer/button-red/",
    stem: "button_base_red_button_red",
    targetFootprint: 0.92
  },
  blueRamp: {
    type: "obj",
    base: "/assets/kaykit/platformer/blue-ramp/",
    stem: "platform_slope_6x6x4_blue",
    targetFootprint: TILE * 3.0
  },
  redPlatform4x4: {
    type: "obj",
    base: "/assets/kaykit/platformer/red-platform/",
    stem: "platform_4x4x1_red",
    targetFootprint: TILE * 2.35
  },
  heartRed: {
    type: "obj",
    base: "/assets/kaykit/platformer/heart-red/",
    stem: "heart_red",
    targetFootprint: 0.46
  },
  player: { type: "gltf", url: "/assets/kaykit/platformer/character/Character.gltf", targetHeight: 1.72 }
};
