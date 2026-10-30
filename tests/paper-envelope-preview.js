import * as THREE from 'three';
import { createPaperEnvelopeLibrary, paperSwing, SWING_DURATION } from '../js/components/paper-envelope.js';
const stage=document.querySelector('#preview'),output=document.querySelector('#state'),reduced=document.querySelector('#reduce');
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3.4,3.4,1.8,-1.8,.1,30);camera.position.z=7;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
stage.append(renderer.domElement);scene.add(new THREE.HemisphereLight(0xfff6de,0xa6c3d0,2));
const key=new THREE.DirectionalLight(0xfff3de,2.1);key.position.set(-3,8,7);scene.add(key);const fill=new THREE.DirectionalLight(0xdceeff,.8);fill.position.set(5,3,5);scene.add(fill);
let angle=0,frame=null,start=null,elapsed=null,disposed=false;
const library=createPaperEnvelopeLibrary({onLoad:render,onError:()=>output.textContent='原圖載入失敗。'});
const normal=library.create('normal'),gold=library.create('gold');
normal.anchor.position.set(-1.45,.7,0);gold.anchor.position.set(1.45,.7,0);normal.anchor.scale.setScalar(1.8);gold.anchor.scale.setScalar(1.8);scene.add(normal.anchor,gold.anchor);
function render(){
  if(disposed)return;
  for(const paper of [normal,gold])paper.anchor.visible=paper.variant.ready;
  renderer.render(scene,camera);
  output.textContent=`角度 ${angle}°；紙板 1.6%；${elapsed===null?'已完全靜止':'新金色信封晃動中（1.4秒）'}；${renderer.info.render.triangles} triangles／${renderer.info.render.calls} draw calls（兩封放大檢查）。`;
}
function tick(now){frame=null;if(start===null)start=now;elapsed=(now-start)/1000;gold.pivot.rotation.z=paperSwing(elapsed);
  if(reduced.checked||elapsed>=SWING_DURATION){elapsed=null;gold.pivot.rotation.z=0;start=null;render();return;}
  render();frame=requestAnimationFrame(tick);
}
document.querySelectorAll('[data-angle]').forEach(button=>button.addEventListener('click',()=>{angle=Number(button.dataset.angle);normal.anchor.rotation.y=gold.anchor.rotation.y=THREE.MathUtils.degToRad(angle);render();}));
document.querySelector('#swing').addEventListener('click',()=>{if(frame!==null)cancelAnimationFrame(frame);frame=null;start=null;elapsed=null;gold.pivot.rotation.z=0;if(!reduced.checked)frame=requestAnimationFrame(tick);else render();});
reduced.addEventListener('change',()=>{if(reduced.checked){if(frame!==null)cancelAnimationFrame(frame);frame=null;elapsed=null;gold.pivot.rotation.z=0;render();}});
const resize=new ResizeObserver(()=>{const width=stage.clientWidth,height=innerWidth<=500?420:560;camera.left=-3.4;camera.right=3.4;camera.top=3.4*height/width;camera.bottom=-camera.top;camera.updateProjectionMatrix();renderer.setSize(width,height);render();});resize.observe(stage);
addEventListener('pagehide',()=>{disposed=true;if(frame!==null)cancelAnimationFrame(frame);resize.disconnect();library.destroy();renderer.dispose();renderer.forceContextLoss();});
