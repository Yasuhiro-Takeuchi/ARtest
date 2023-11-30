import * as THREE from './libs/three.js-r132/build/three.module.js';
import { GLTFLoader } from './libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from './libs/three.js-r132/examples/jsm/webxr/ARButton.js';

document.addEventListener('DOMContentLoaded', () => {
  const initialize = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

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

    // タップカウンター
    let tapCount = 0;

    // モデルデータとスケールを含むオブジェクトの配列
    const models = [
      { path: 'assets/models/sakana.gltf', scale: 0.01 },
      { path: 'assets/models/tori.gltf', scale: 0.02 },
      { path: 'assets/models/usi4.gltf', scale: 0.02 },
      // 他のモデルも同様に追加
    ];

    controller.addEventListener('select', () => {
      // 現在のタップ数に応じたモデルを取得
      const modelData = models[tapCount % models.length];

      loader.load(modelData.path, (gltf) => {
        gltf.scene.position.setFromMatrixPosition(reticle.matrix);
        gltf.scene.scale.set(modelData.scale, modelData.scale, modelData.scale); // モデルごとのスケールで調整
        scene.add(gltf.scene);
      });

      // タップカウントを増やす
      tapCount++;
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
