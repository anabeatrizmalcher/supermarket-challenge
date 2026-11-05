import * as THREE from 'three';

/** Frees GPU memory: geometries, materials and their textures, then the WebGL context itself. */
export function disposeScene(scene: THREE.Object3D, renderer: THREE.WebGLRenderer) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      (mat as THREE.MeshBasicMaterial).map?.dispose();
      mat.dispose();
    }
  });
  renderer.dispose();
  // Mobile browsers allow only a few live WebGL contexts, so release this one explicitly.
  renderer.forceContextLoss();
}
