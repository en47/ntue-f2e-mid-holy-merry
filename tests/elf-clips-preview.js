import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { createElfAnimation } from '../js/components/elf-animation.js';
const root=document.querySelector('#stage'),state=document.querySelector('#state'),scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-1,1,1.25,-.15,.1,20);camera.position.z=5;
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;root.append(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);pmrem.dispose();room.dispose();scene.environment=environment.texture;scene.environmentIntensity=.5;
scene.add(new THREE.HemisphereLight(0xfff6de,0xa6c3d0,2));const key=new THREE.DirectionalLight(0xfff3de,2.1);key.position.set(-3,8,7);scene.add(key);
const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2,0,0),new THREE.Vector3(2,0,0)]),new THREE.LineBasicMaterial({color:0x9aa8a8}));scene.add(line);
let engine=null,clip='look_around',elapsed=0,frame=null,last=0,paused=false,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function wake(){if(!disposed&&frame===null&&!document.hidden)frame=requestAnimationFrame(render);}
function render(now){frame=null;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
 if(engine&&!paused&&!reduced){elapsed+=dt;engine.update(dt);if(clip.startsWith('dance_')&&elapsed>=engine.durations[clip]+.33){clip='look_around';elapsed=0;engine.play(clip,true);}}
 renderer.render(scene,camera);if(engine)state.textContent=`${clip} · ${elapsed.toFixed(2)} / ${engine.durations[clip].toFixed(3)} 秒 · ${paused?'原生姿勢定格':'1× 原生播放'} · 無額外全身轉動`;
 if(engine&&!paused&&!reduced)wake();else last=0;
}
function inspect(action){try{action();}catch(error){paused=true;state.textContent='動畫檢查失敗：'+error.message+'；已載入 '+Object.keys(engine?.durations||{}).join(' / ');}}
document.querySelectorAll('[data-clip]').forEach(button=>button.onclick=()=>inspect(()=>{if(!engine)return;clip=button.dataset.clip;elapsed=0;paused=false;last=0;engine.play(clip,!clip.startsWith('dance_'));wake();}));
document.querySelectorAll('[data-phase]').forEach(button=>button.onclick=()=>inspect(()=>{if(!engine)return;paused=true;elapsed=Number(button.dataset.phase)*engine.durations[clip];engine.play(clip,false,true);engine.update(elapsed);wake();}));
const resize=new ResizeObserver(()=>{const w=root.clientWidth,h=root.clientHeight,aspect=w/h,height=Math.max(1.4,1.1/aspect);camera.left=-height*aspect/2;camera.right=-camera.left;camera.top=.55+height/2;camera.bottom=.55-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);wake();});resize.observe(root);
try{const gltf=await new GLTFLoader().loadAsync(new URL('../assets/models/wish-elf-original.glb',import.meta.url).href),saved=await(await fetch('../assets/animations/elf-actions.json',{cache:'no-store'})).json();
 scene.add(gltf.scene);engine=createElfAnimation(gltf.scene,[...gltf.animations,...saved.clips.map(c=>THREE.AnimationClip.parse(c))]);
 if(Object.keys(engine.durations).length!==5)throw new Error('預期五段原生動畫，實際 '+Object.keys(engine.durations).join(' / ')+'；來源 '+saved.clips.map(c=>c.name).join(' / '));
 const query=new URLSearchParams(location.search),requested=query.get('clip');
 if(requested&&engine.durations[requested]){clip=requested;paused=query.has('phase');elapsed=Math.max(0,Math.min(1,Number(query.get('phase'))||0))*engine.durations[clip];engine.play(clip,!clip.startsWith('dance_'),true);engine.update(elapsed);}
 document.querySelectorAll('[data-clip]').forEach(button=>button.disabled=false);wake();
}catch(error){state.textContent='載入失敗：'+error.message;}
addEventListener('visibilitychange',()=>{last=0;wake();});
addEventListener('pagehide',()=>{disposed=true;if(frame!==null)cancelAnimationFrame(frame);resize.disconnect();engine?.destroy();scene.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){for(const t of Object.values(m))if(t?.isTexture)t.dispose();m.dispose();}});environment.dispose();renderer.dispose();renderer.forceContextLoss();},{once:true});
