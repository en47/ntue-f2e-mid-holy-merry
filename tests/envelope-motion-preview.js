import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { createWishEnvelopes } from '../js/components/wish-envelopes.js';
const root=document.querySelector('#stage'),status=document.querySelector('#state'),angle=document.querySelector('#angle');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),scene=new THREE.Scene(),tree=new THREE.Group();scene.add(tree);
const camera=new THREE.OrthographicCamera(0,1,1,0,.1,50);camera.position.z=15;
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;root.append(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);pmrem.dispose();room.dispose();scene.environment=environment.texture;scene.environmentIntensity=.5;
scene.add(new THREE.HemisphereLight(0xfff6de,0xa6c3d0,2));const key=new THREE.DirectionalLight(0xfff3de,2.1);key.position.set(-3,8,7);scene.add(key);
const fill=new THREE.DirectionalLight(0xdceeff,.8);fill.position.set(5,3,5);scene.add(fill);
let frame=null,last=0,turnStart=null,disposed=false,geometry=null,generation=0,drag=null;
let wishes=Array.from({length:10},(_,i)=>({id:`calm-local-${i}`,nickname:`本機信件 ${i+1}`,isOwn:i===0}));
const wake=()=>{if(!disposed&&frame===null&&!document.hidden)frame=requestAnimationFrame(render);};
const envelopes=createWishEnvelopes({root,tree,camera,wake,motion});
const select=wish=>{document.querySelector('#letter-title').textContent=wish.nickname+(wish.isOwn?'（金色）':'');document.querySelector('#letter').showModal();};
function layout(){const w=root.clientWidth,h=root.clientHeight;renderer.setSize(w,h,false);camera.right=w/100;camera.top=h/100;camera.updateProjectionMatrix();
 if(geometry){const scale=Math.min(h*.92/100/geometry.height,w*.88/100/(2*geometry.radius));tree.scale.setScalar(scale);tree.position.set(w/200,h*.035/100,0);envelopes.layout(geometry);}wake();}
function render(now){frame=null;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
 if(turnStart!==null){const t=Math.min(1,(now-turnStart)/12000);tree.rotation.y=t*Math.PI*2;angle.value=String(t*360);if(t===1)turnStart=null;}
 const moving=envelopes.update(dt);envelopes.project(root.clientWidth,root.clientHeight);renderer.render(scene,camera);
 if(geometry)status.textContent=`樹 ${Math.round(tree.rotation.y*180/Math.PI)}°；上2／中3／下5；紙邊1.6%；${moving?'新金色信輕晃（1.4秒）':'所有信封已靜止'}${turnStart===null?'':'；本機慢轉驗收中'}`;
 if(moving||turnStart!==null)wake();else last=0;
}
angle.oninput=()=>{turnStart=null;tree.rotation.y=Number(angle.value)*Math.PI/180;wake();};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{angle.value=button.dataset.view;angle.oninput();});
document.querySelector('#turn').onclick=()=>{if(motion.matches){status.textContent='減少動態已啟用，請使用角度滑桿檢查。';return;}turnStart=performance.now();last=0;wake();};
document.querySelector('#new').onclick=()=>{const own={id:`calm-new-${++generation}`,isOwn:true,nickname:'新金色本機信'};wishes=[own,...wishes.filter(w=>!w.isOwn)];envelopes.setWishes(wishes,select,{newWishId:own.id});};
document.querySelector('#refresh').onclick=()=>envelopes.setWishes([...wishes].reverse(),select);
document.querySelector('#mobile').onchange=event=>{document.body.classList.toggle('mobile',event.target.checked);layout();};
document.querySelector('#close').onclick=()=>document.querySelector('#letter').close();
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;turnStart=null;drag={id:e.pointerId,x:e.clientX,y:e.clientY,angle:tree.rotation.y};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)<=Math.abs(dy)*1.15)return;e.preventDefault();tree.rotation.y=drag.angle+dx*.012;angle.value=String((tree.rotation.y*180/Math.PI+360)%360);wake();},{passive:false});
for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,()=>{drag=null;});
new GLTFLoader().load(new URL('../assets/models/wish-tree.glb',import.meta.url).href,gltf=>{
 if(disposed)return;const model=gltf.scene,box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),v=new THREE.Vector3();
 geometry={height:box.max.y-box.min.y,radius:0,branchRadii:Array(24).fill(0)};
 model.traverse(n=>{if(!n.isMesh)return;const positions=n.geometry.attributes.position;for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(n.matrixWorld);const radius=Math.hypot(v.x-center.x,v.z-center.z),band=Math.max(0,Math.min(23,Math.floor((v.y-box.min.y)/geometry.height*24)));geometry.radius=Math.max(geometry.radius,radius);geometry.branchRadii[band]=Math.max(geometry.branchRadii[band],radius);}});
 model.position.set(-center.x,-box.min.y,-center.z);tree.add(model);layout();envelopes.setWishes(wishes,select);document.querySelectorAll('nav button,#angle').forEach(b=>b.disabled=false);
},undefined,error=>{status.textContent='模型載入失敗：'+error.message;});
const resize=new ResizeObserver(layout);resize.observe(root);addEventListener('visibilitychange',()=>{last=0;if(!document.hidden){turnStart=null;wake();}});
addEventListener('pagehide',()=>{disposed=true;if(frame!==null)cancelAnimationFrame(frame);resize.disconnect();envelopes.destroy();tree.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){for(const t of Object.values(m))if(t?.isTexture)t.dispose();m.dispose();}});environment.dispose();renderer.dispose();renderer.forceContextLoss();},{once:true});
