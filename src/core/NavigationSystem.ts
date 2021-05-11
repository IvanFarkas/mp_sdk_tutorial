import * as THREE from 'three';
import { Pathfinding, PathfindingHelper } from './pathfinding';

const Color = {
  GROUND: new THREE.Color(0x606060).convertGammaToLinear(2.2).getHex(),
  NAVMESH: new THREE.Color(0xffffff).convertGammaToLinear(2.2).getHex()
};
const ZONE = 'level';
const SPEED = 5;
const OFFSET = 0.2;

export default class NavigationSystem {
  level: any;
  navmesh: any;
  groupID: any;
  path: any;
  playerPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  pathfinder: any;
  helper: any;
  clock: any;
  mouse: THREE.Vector2;
  scene: THREE.Scene;

  constructor() {}
}
