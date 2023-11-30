import * as THREE from './libs/three.js-r132/build/three.module.js';
import { GLTFLoader } from './libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from './libs/three.js-r132/examples/jsm/webxr/ARButton.js';

document.addEventListener('DOMContentLoaded', () => {
  const initialize = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial();
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(arButton);

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    const loader = new GLTFLoader();
    controller.addEventListener('select', () => {
      loader.load('assets/models/sakana.gltf', (gltf) => {
        gltf.scene.position.setFromMatrixPosition(reticle.matrix);
        gltf.scene.scale.set(0.1, 0.1, 0.1); // サイズ調整
        scene.add(gltf.scene);
      });
    });

    renderer.xr.addEventListener("sessionstart", async (e) => {
      const session = renderer.xr.getSession();
      const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

      renderer.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitPose = hit.getPose(referenceSpace);

          reticle.visible = true;
          reticle.matrix.fromArray(hitPose.transform.matrix);
        } else {
          reticle.visible = false;
        }

        renderer.render(scene, camera);
      });
    });

    renderer.xr.addEventListener("sessionend", () => {
      console.log("session end");
    });
  }

  initialize();
});