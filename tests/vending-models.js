// 販賣機頁模型的預覽台：九個壓縮後的模型各放一格，在偏暖的夜晚燈光下慢慢轉（人工檢查用，不在 npm test 內）。
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/three/examples/jsm/libs/meshopt_decoder.module.js';

const NAMES = ['vending-machine', ...['stocking', 'tree', 'gingerbread', 'snowman'].flatMap(name => [`vending-${name}`, `vending-${name}-button`])];
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), grid = document.querySelector('#grid'), views = [];
for (const name of NAMES) {
  const figure = document.createElement('figure'), canvas = document.createElement('canvas'), caption = document.createElement('figcaption');
  caption.textContent = name; figure.append(canvas, caption); grid.append(figure);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(300, 300, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2c3a52');
  scene.add(new THREE.HemisphereLight('#fff1d6', '#30405a', 1.6)); const key = new THREE.DirectionalLight('#ffe2b0', 2.2); key.position.set(2, 3, 2.5); scene.add(key);
  const camera = new THREE.PerspectiveCamera(35, 1, .01, 100), pivot = new THREE.Group(); scene.add(pivot);
  loader.load(`../assets/models/${name}-web.glb`, ({ scene: model }) => {
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
    model.position.sub(centre); pivot.add(model);
    const reach = Math.max(size.x, size.y, size.z) * 1.9; camera.position.set(0, size.y * .15, reach); camera.lookAt(0, 0, 0);
    caption.textContent = `${name}（${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}）`;
  }, undefined, () => { caption.textContent = `${name}：載入失敗`; });
  views.push({ renderer, scene, camera, pivot });
}
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer();
function renderer(time = 0) { for (const view of views) { view.pivot.rotation.y = still ? .5 : time / 2400; view.renderer.render(view.scene, view.camera); } requestAnimationFrame(renderer); }
