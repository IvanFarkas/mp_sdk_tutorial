import * as THREE from 'three';
import { Pathfinding, PathfindingHelper } from './pathfinding';

const ZONE = 'level';
const SPEED = 50;

export default class NavigationSystem {
  groupID: any;
  path: any;
  playerPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  pathfinder: Pathfinding;
  helper: PathfindingHelper;
  clock: THREE.Clock;
  intersectPoint: THREE.Vector3;
  scene: THREE.Scene;
  playerNode: any;

  constructor(clock: THREE.Clock, intersectPoint: THREE.Vector3, threeScene: THREE.Scene, navMesh: THREE.Mesh, playerNode: any, showcaseElement: HTMLIFrameElement) {
    this.playerPosition = new THREE.Vector3(0.1519576176984144, -1.6576147965629167, 0.8018497944956335);
    this.targetPosition = new THREE.Vector3(0.1519576176984144, -1.6576147965629167, 0.8018497944956335);
    this.pathfinder = new Pathfinding();
    this.helper = new PathfindingHelper();

    threeScene.add(this.helper);

    this.clock = clock;
    this.intersectPoint = intersectPoint;

    const zone = Pathfinding.createZone(navMesh.geometry);
    this.pathfinder.setZoneData(ZONE, zone);
    this.groupID = this.pathfinder.getGroup(ZONE, this.playerPosition);
    this.helper.setPlayerPosition(new THREE.Vector3(0.1519576176984144, -1.6576147965629167, 0.8018497944956335));
    this.helper.setTargetPosition(new THREE.Vector3(0.1519576176984144, -1.6576147965629167, 0.8018497944956335));

    showcaseElement.contentDocument.body.addEventListener('click', this.onClick.bind(this), false);

    this.playerNode = playerNode;
    this.animate();
  }

  private onClick(event: any) {
    this.targetPosition.copy(this.intersectPoint);
    this.helper.reset().setPlayerPosition(this.playerPosition);

    // Teleport on ctrl/cmd click or RMB.
    if (event.ctrlKey) {
      this.playerNode.position.set(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);
      this.path = null;
      this.groupID = this.pathfinder.getGroup(ZONE, this.targetPosition, true);
      const closestNode: any = this.pathfinder.getClosestNode(this.playerPosition, ZONE, this.groupID, true);
      this.helper.setPlayerPosition(this.playerPosition.copy(this.targetPosition));
      if (closestNode) {
        this.helper.setNodePosition(closestNode.centroid);
      }
      return;
    }

    const targetGroupID = this.pathfinder.getGroup(ZONE, this.targetPosition, true);
    const closestTargetNode: any = this.pathfinder.getClosestNode(this.targetPosition, ZONE, targetGroupID, true);

    this.helper.setTargetPosition(this.targetPosition);
    if (closestTargetNode) {
      this.helper.setNodePosition(closestTargetNode.centroid);
    }

    // Calculate a path to the target and store it
    this.path = this.pathfinder.findPath(this.playerPosition, this.targetPosition, ZONE, this.groupID);

    if (this.path && this.path.length) {
      this.helper.setPath(this.path);
    } else {
      const closestPlayerNode = this.pathfinder.getClosestNode(this.playerPosition, ZONE, this.groupID);
      const clamped = new THREE.Vector3();

      // TODO(donmccurdy): Don't clone targetPosition, fix the bug.
      this.pathfinder.clampStep(this.playerPosition, this.targetPosition.clone(), closestPlayerNode, ZONE, this.groupID, clamped);

      this.helper.setStepPosition(clamped);
    }
  }

  public animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    if (!(this.path || []).length) {
      return;
    }

    let targetPosition = this.path[0];
    const velocity = targetPosition.clone().sub(this.playerPosition);
    if (velocity.lengthSq() > 0.05 * 0.05) {
      velocity.normalize();

      // Move player to target
      this.playerPosition.add(velocity.multiplyScalar(this.clock.getDelta() * SPEED));
      this.helper.setPlayerPosition(this.playerPosition);

      // Follow helper
      this.playerNode.position.set(this.playerPosition.x, this.playerPosition.y, this.playerPosition.z);
      // this.playerNode.quaternion.set(this.helper.quaternion.x, this.helper.quaternion.y, this.helper.quaternion.z, this.helper.quaternion.w);
    } else {
      // Remove node from the path calculated
      this.path.shift();
    }
  }
}
