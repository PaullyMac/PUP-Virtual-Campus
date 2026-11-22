import * as THREE from 'three';
import { AABB } from '../campus/campusData';
import { getColliderDebugDescriptor } from '../campus/campusLogic';
import { InteractiveDoor } from './campusBuilder';

interface ColliderDebugEntry {
  id: string;
  isOBB: boolean;
  isDoor: boolean;
  fillMesh: THREE.Mesh;
  edgeLines: THREE.LineSegments;
  group: THREE.Group;
}

/**
 * Renders 1:1 world-space debug hit-boxes (AABB & rotated OBB), closed-door blockers,
 * and the player's real collision cylinder (r = 0.50m) + contact normal arrow.
 * Built lazily on first activation so runtime cost is zero when disabled.
 */
export class ColliderDebugOverlay {
  public readonly root = new THREE.Group();
  private readonly entries = new Map<string, ColliderDebugEntry>();
  private readonly doorEntries = new Map<string, ColliderDebugEntry>();
  private readonly ownedGeos: THREE.BufferGeometry[] = [];
  private readonly ownedMats: THREE.Material[] = [];

  private readonly matAabbFill: THREE.MeshBasicMaterial;
  private readonly matAabbEdge: THREE.LineBasicMaterial;
  private readonly matObbFill: THREE.MeshBasicMaterial;
  private readonly matObbEdge: THREE.LineBasicMaterial;
  private readonly matDoorFill: THREE.MeshBasicMaterial;
  private readonly matDoorEdge: THREE.LineBasicMaterial;
  private readonly matHitFill: THREE.MeshBasicMaterial;
  private readonly matHitEdge: THREE.LineBasicMaterial;

  private readonly playerGroup = new THREE.Group();
  private readonly playerCylMesh: THREE.Mesh;
  private readonly playerRingMesh: THREE.Mesh;
  private readonly matPlayerIdleFill: THREE.MeshBasicMaterial;
  private readonly matPlayerIdleRing: THREE.MeshBasicMaterial;
  private readonly matPlayerHitFill: THREE.MeshBasicMaterial;
  private readonly matPlayerHitRing: THREE.MeshBasicMaterial;
  private readonly normalLine: THREE.Line;
  private readonly normalPosAttr: THREE.BufferAttribute;

  private activeHitIds = new Set<string>();
  private visible = false;

  constructor(
    scene: THREE.Scene,
    staticColliders: AABB[],
    doors: InteractiveDoor[],
    playerRadius = 0.5,
  ) {
    this.root.name = 'PUP_Collider_Debug_Overlay';
    this.root.visible = false;
    scene.add(this.root);

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      this.ownedGeos.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      this.ownedMats.push(m);
      return m;
    };

    // Shared 1x1x1 box + edges geometry for all static & door hit-boxes
    const unitBoxGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
    const unitEdgesGeo = trackGeo(new THREE.EdgesGeometry(unitBoxGeo));

    this.matAabbFill = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.19,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        side: THREE.DoubleSide,
      }),
    );
    this.matAabbEdge = trackMat(
      new THREE.LineBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.94,
      }),
    );
    this.matObbFill = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        side: THREE.DoubleSide,
      }),
    );
    this.matObbEdge = trackMat(
      new THREE.LineBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.96,
      }),
    );
    this.matDoorFill = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.matDoorEdge = trackMat(
      new THREE.LineBasicMaterial({
        color: 0xd8b4fe,
        transparent: true,
        opacity: 0.95,
      }),
    );
    this.matHitFill = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.matHitEdge = trackMat(
      new THREE.LineBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 1.0,
      }),
    );

    const buildEntry = (box: AABB, isDoor: boolean): ColliderDebugEntry => {
      const desc = getColliderDebugDescriptor(box);
      const height = isDoor ? 3.5 : desc.width < 1.2 && desc.depth < 1.2 ? 2.4 : 3.2;

      const group = new THREE.Group();
      group.position.set(desc.cx, height * 0.5, desc.cz);
      group.rotation.y = desc.rotY;

      const fillMat = isDoor
        ? this.matDoorFill
        : desc.isOBB
          ? this.matObbFill
          : this.matAabbFill;
      const edgeMat = isDoor
        ? this.matDoorEdge
        : desc.isOBB
          ? this.matObbEdge
          : this.matAabbEdge;

      const fillMesh = new THREE.Mesh(unitBoxGeo, fillMat);
      fillMesh.scale.set(desc.width, height, desc.depth);
      fillMesh.renderOrder = 10;

      const edgeLines = new THREE.LineSegments(unitEdgesGeo, edgeMat);
      edgeLines.scale.set(desc.width + 0.015, height + 0.015, desc.depth + 0.015);
      edgeLines.renderOrder = 11;

      group.add(fillMesh, edgeLines);
      this.root.add(group);

      return {
        id: desc.id,
        isOBB: desc.isOBB,
        isDoor,
        fillMesh,
        edgeLines,
        group,
      };
    };

    for (const col of staticColliders) {
      const entry = buildEntry(col, false);
      this.entries.set(col.id, entry);
    }

    for (const door of doors) {
      const entry = buildEntry(door.closedCollider, true);
      entry.group.visible = !door.isOpen;
      this.entries.set(door.closedCollider.id, entry);
      this.doorEntries.set(door.id, entry);
    }

    // Player real-time physics cylinder (radius = 0.50m) + ground ring + outward contact normal arrow
    this.matPlayerIdleFill = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.matPlayerIdleRing = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.matPlayerHitFill = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.matPlayerHitRing = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );

    const cylGeo = trackGeo(new THREE.CylinderGeometry(playerRadius, playerRadius, 1.85, 24, 1, true));
    this.playerCylMesh = new THREE.Mesh(cylGeo, this.matPlayerIdleFill);
    this.playerCylMesh.position.y = 0.925;
    this.playerCylMesh.renderOrder = 12;

    const ringGeo = trackGeo(new THREE.RingGeometry(playerRadius - 0.055, playerRadius + 0.02, 32));
    ringGeo.rotateX(-Math.PI / 2);
    this.playerRingMesh = new THREE.Mesh(ringGeo, this.matPlayerIdleRing);
    this.playerRingMesh.position.y = 0.07;
    this.playerRingMesh.renderOrder = 13;

    const normalGeo = trackGeo(new THREE.BufferGeometry());
    this.normalPosAttr = new THREE.BufferAttribute(new Float32Array(6), 3);
    normalGeo.setAttribute('position', this.normalPosAttr);
    const normalMat = trackMat(new THREE.LineBasicMaterial({ color: 0xff4d4f }));
    this.normalLine = new THREE.Line(normalGeo, normalMat);
    this.normalLine.visible = false;
    this.normalLine.renderOrder = 14;

    this.playerGroup.add(this.playerCylMesh, this.playerRingMesh, this.normalLine);
    this.root.add(this.playerGroup);
  }

  public setVisible(show: boolean) {
    this.visible = show;
    this.root.visible = show;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public update(
    playerPos: THREE.Vector3,
    hitColliderIds: string[],
    contactNormalX: number,
    contactNormalZ: number,
    doors: InteractiveDoor[],
  ) {
    if (!this.visible) return;

    // Sync closed-door hit-box visibility
    for (const door of doors) {
      const entry = this.doorEntries.get(door.id);
      if (entry) {
        entry.group.visible = !door.isOpen && door.openProgress < 0.65;
      }
    }

    // Restore previously highlighted colliders that are no longer in contact
    const nextHitSet = new Set(hitColliderIds);
    for (const prevId of this.activeHitIds) {
      if (!nextHitSet.has(prevId)) {
        const entry = this.entries.get(prevId);
        if (entry) {
          entry.fillMesh.material = entry.isDoor
            ? this.matDoorFill
            : entry.isOBB
              ? this.matObbFill
              : this.matAabbFill;
          entry.edgeLines.material = entry.isDoor
            ? this.matDoorEdge
            : entry.isOBB
              ? this.matObbEdge
              : this.matAabbEdge;
        }
      }
    }

    // Highlight newly contacted colliders bright crimson red
    for (const id of nextHitSet) {
      const entry = this.entries.get(id);
      if (entry) {
        entry.fillMesh.material = this.matHitFill;
        entry.edgeLines.material = this.matHitEdge;
      }
    }
    this.activeHitIds = nextHitSet;

    // Update player collision cylinder & outward contact normal indicator
    this.playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
    const hasHit = hitColliderIds.length > 0;
    this.playerCylMesh.material = hasHit ? this.matPlayerHitFill : this.matPlayerIdleFill;
    this.playerRingMesh.material = hasHit ? this.matPlayerHitRing : this.matPlayerIdleRing;

    if (hasHit && (Math.abs(contactNormalX) > 1e-3 || Math.abs(contactNormalZ) > 1e-3)) {
      this.normalPosAttr.setXYZ(0, 0, 1.0, 0);
      this.normalPosAttr.setXYZ(1, contactNormalX * 1.4, 1.0, contactNormalZ * 1.4);
      this.normalPosAttr.needsUpdate = true;
      this.normalLine.visible = true;
    } else {
      this.normalLine.visible = false;
    }
  }

  public dispose() {
    this.root.parent?.remove(this.root);
    for (const g of this.ownedGeos) g.dispose();
    for (const m of this.ownedMats) m.dispose();
    this.entries.clear();
    this.doorEntries.clear();
  }
}
