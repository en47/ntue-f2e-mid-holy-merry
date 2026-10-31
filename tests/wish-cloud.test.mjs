import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../vendor/three/build/three.module.js';
import { selectTreeWishes } from '../js/services/wish-selection.js';
import { createHash } from 'node:crypto';
import { assignEnvelopeAnchors, envelopeZoneCounts, envelopesSeparated } from '../js/components/wish-envelope-layout.js';
import { wishTreeAnchors, wishTreeAnchorSource } from '../js/data/wish-tree-anchors.js';
import { envelopeShapes } from '../js/data/envelope-shapes.js';
import { HANGING_DROP, HANGING_OUTSET, MAX_SWING, PENDULUM, SWING_DURATION, outwardLean, paperSwing, pendulumStep } from '../js/data/paper-envelope-style.js';
test('tree selection: 10 approved others, or 9 others plus own latest private/pending; no duplicate or own older letters',()=>{
  const others=Array.from({length:14},(_,i)=>({id:`public-${i}`,ownerUid:'other',nickname:'公開願望'}));
  const mine={id:'my-latest',ownerUid:'me',visibility:'private',status:'pending'};
  assert.equal(selectTreeWishes(null,others,'me').length,10);
  const selected=selectTreeWishes(mine,[...others,others[0],{id:'older',ownerUid:'me'}],'me');
  assert.equal(selected.length,10);assert.equal(selected[0].id,mine.id);assert.equal(selected[0].isOwn,true);
  assert.equal(selected.filter(w=>w.isOwn).length,1);assert.equal(new Set(selected.map(w=>w.id)).size,10);
  assert.deepEqual(selectTreeWishes(null,[],'me'),[]);assert.equal(selectTreeWishes(mine,[],'me').length,1);
  assert.throws(()=>selectTreeWishes({...mine,ownerUid:'someone'},others,'me'),/belong/);
});
async function envelopeEnvironment() {
  class Element {
    constructor(){this.children=[];this.style={};this.listeners={};this.attributes={};this.clientLeft=this.clientTop=0;}
    append(...children){children.forEach(child=>{child.parent=this;this.children.push(child);});}
    setAttribute(k,v){this.attributes[k]=v;} addEventListener(k,f){this.listeners[k]=f;}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.removed=true;}
    setPointerCapture(){} getBoundingClientRect(){return {left:0,top:0,width:1400,height:800};}
  }
  const textures=[],root=new Element(),tree=new THREE.Group(),scene=new THREE.Scene(),motion={matches:false};scene.add(tree);
  const camera=new THREE.OrthographicCamera(0,14,8,0,.1,50);camera.position.z=15;camera.updateMatrixWorld();
  const textureClass=class{load(url,onLoad){const t=new THREE.Texture();t.disposals=0;t.loaded=()=>onLoad(t);t.sourceUrl=url;t.addEventListener('dispose',()=>t.disposals++);textures.push(t);return t;}};
  const context=vm.createContext({document:{createElement:()=>new Element()},URL,Math,console,crypto:{getRandomValues(buffer){buffer[0]=7;return buffer;}}});
  const exports={...THREE,TextureLoader:textureClass};
  const three=new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v);},{context});
  const modules=new Map();
  async function load(url){
    if(modules.has(url.href))return modules.get(url.href);
    const module=new vm.SourceTextModule(await fs.readFile(url,'utf8'),{context,identifier:url.href,initializeImportMeta:m=>m.url=url.href});modules.set(url.href,module);
    await module.link((specifier,reference)=>specifier==='three'?three:load(new URL(specifier,reference.identifier)));return module;
  }
  const module=await load(new URL('../js/components/wish-envelopes.js',import.meta.url));await module.evaluate();
  let wakes=0,selected=null;
  const controller=module.namespace.createWishEnvelopes({root,tree,camera,motion,wake:()=>wakes++});
  return {controller,root,tree,camera,motion,textures,get selected(){return selected;},get wakes(){return wakes;},select:w=>selected=w,load:async relative=>{const m=await load(new URL(relative,import.meta.url));await m.evaluate();return m.namespace;}};
}

test('real paper geometry: rounded outline, thick 3–7% packet, shared paper texture, matte rear, low polygon budget',async()=>{
  const env=await envelopeEnvironment(),{createPaperEnvelopeLibrary,PAPER_DEPTH}=await env.load('../js/components/paper-envelope.js');
  const library=createPaperEnvelopeLibrary(),normal=library.create('normal'),gold=library.create('gold');
  assert.ok(PAPER_DEPTH>=.03&&PAPER_DEPTH<=.07);
  for(const paper of [normal,gold]){
    const box=paper.board.geometry.boundingBox,depth=box.max.z-box.min.z;
    assert.ok(depth>=.03&&depth<=.08);
    assert.equal(paper.pivot.parent,paper.anchor);assert.equal(paper.body.parent,paper.pivot);
    assert.deepEqual(paper.pivot.position.toArray(),[0,0,0],'The swinging hinge stays exactly on the branch anchor');
    const string=paper.pivot.getObjectByName('short-hanging-thread');assert.ok(string);
    assert.ok(string.geometry.parameters.radius<=.004,'The thread must remain discreet');
    assert.ok(paper.body.position.length()<.4,'The envelope stays close to its branch');
    assert.ok(paper.board.geometry.attributes.position.count/3<2000,'Keep the silhouette low poly');
    assert.equal(paper.pivot.isSprite,undefined);
    const front=paper.body.getObjectByName('original-front-illustration'),rear=paper.body.getObjectByName('textured-paper-rear');
    assert.equal(front.material.map,rear.material.map);assert.equal(front.material.roughness,1);assert.equal(front.material.metalness,0);
    assert.equal(front.material.depthTest,true);assert.equal(rear.material.side,THREE.BackSide);
    assert.ok(paper.body.getObjectByName('raised-original-paper-flap'));assert.ok(paper.body.getObjectByName('raised-original-wax-seal'));
    const data=paper.variant.data,width=data.bounds[2]-data.bounds[0],outside=new THREE.Vector3((data.bounds[0]+4-data.anchor[0])/width,(data.anchor[1]-data.bounds[1]-4)/width,0);
    paper.pivot.updateMatrixWorld(true);paper.body.localToWorld(outside);
    const ray=new THREE.Raycaster(outside.clone().add(new THREE.Vector3(0,0,2)),new THREE.Vector3(0,0,-1));
    assert.equal(ray.intersectObject(paper.board).length,0,'Transparent bounding-box corners must not become cardboard');
    for(const hole of data.holes){
      const center=hole.reduce((v,p)=>v.add(new THREE.Vector2(...p)),new THREE.Vector2()).multiplyScalar(1/hole.length);
      const point=paper.body.localToWorld(new THREE.Vector3((center.x-data.anchor[0])/width,(data.anchor[1]-center.y)/width,0));
      ray.set(point.clone().add(new THREE.Vector3(0,0,2)),new THREE.Vector3(0,0,-1));
      assert.equal(ray.intersectObject(paper.board).length,0,'Bow cutouts must remain holes through the paper');
    }
  }
  library.destroy();env.controller.destroy();
});

test('paper tree: shared resources, accessible real-geometry picking, rotation, depth occlusion and exact cleanup',async()=>{
  const env=await envelopeEnvironment(),{controller,tree,root,textures}=env;
  const wishes=Array.from({length:10},(_,i)=>({id:String(i),nickname:'小雪',isOwn:i===0}));
  controller.setWishes(wishes,env.select);controller.layout({height:1,radius:.33});
  assert.equal(controller.update(.5),false,'Restored envelopes never sway');
  tree.scale.setScalar(6);tree.position.set(8,1,0);textures.forEach(t=>t.loaded());controller.project(1400,800);
  const targets=root.children[0],papers=tree.children[0].children;
  assert.equal(textures.length,2);assert.equal(papers.length,10);assert.ok(targets.children.some(b=>!b.hidden));
  assert.ok(targets.children.some(b=>b.hidden),'Rear letters require rotating the tree');
  assert.ok(targets.children.filter(b=>!b.hidden).every(b=>Number.parseFloat(b.style.width)>=44&&Number.parseFloat(b.style.height)>=44));
  const frontMaps=papers.map(p=>p.getObjectByName('original-front-illustration').material.map);
  assert.equal(frontMaps.filter(m=>m===frontMaps[0]).length,1,'Only own latest uses golden PNG');
  targets.children[0].listeners.click({detail:0,stopPropagation(){}});assert.equal(env.selected.id,'0');
  const firstButton=targets.children[0],x=parseFloat(firstButton.style.left),y=parseFloat(firstButton.style.top);
  env.select(null);
  firstButton.listeners.click({detail:1,clientX:x,clientY:y,stopPropagation(){}});assert.equal(env.selected.id,'0');
  // Actual model depth governs pointer reads; the per-frame proxy is only an approximation.
  const blockerGeometry=new THREE.PlaneGeometry(30,30),blockerMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const blocker=new THREE.Mesh(blockerGeometry,blockerMaterial);blocker.position.z=2;tree.add(blocker);tree.updateWorldMatrix(true,true);
  env.select(null);firstButton.listeners.click({detail:1,clientX:x,clientY:y,stopPropagation(){}});
  assert.equal(env.selected,null,'A real foreground surface must block a pointer read');
  blocker.position.z=-2;tree.updateWorldMatrix(true,true);
  firstButton.listeners.click({detail:1,clientX:x,clientY:y,stopPropagation(){}});
  assert.equal(env.selected.id,'0','A model behind the ornament must not block a pointer read');
  tree.remove(blocker);blockerGeometry.dispose();blockerMaterial.dispose();
  tree.rotation.y=Math.PI;controller.project(1400,800);assert.ok(targets.children.some(b=>b.hidden),'Occluded targets must hide; exposed edges may intentionally show their rear');
  assert.ok(papers.every(p=>p.visible),'Real mesh depth, not hemisphere hiding, controls artwork visibility');
  const discovered=new Set();
  for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8){
    tree.rotation.y=angle;controller.project(700,800);
    targets.children.forEach((b,i)=>{if(!b.hidden)discovered.add(i);});
  }
  assert.equal(discovered.size,10,'Every front/left/right/rear wish is discoverable by user rotation');
  tree.rotation.y=2*Math.PI;controller.project(700,800);assert.ok(!targets.children[0].hidden);
  controller.setWishes(wishes.slice(0,1),env.select);assert.equal(tree.children[0].children.length,1);assert.equal(targets.children.length,1);assert.equal(textures.length,2);
  const geometries=new Set(),materials=new Set();tree.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m)materials.add(m);});
  const disposed=new Map();for(const item of [...geometries,...materials])item.addEventListener('dispose',()=>disposed.set(item,(disposed.get(item)||0)+1));
  controller.destroy();controller.destroy();assert.equal(tree.children.length,0);assert.ok(targets.removed);
  assert.ok(textures.every(t=>t.disposals===1));assert.ok([...disposed.values()].every(count=>count===1));assert.ok(env.wakes>0);
});

test('validated branch anchors match actual GLB vertices and remain below the star',async()=>{
  const data=await fs.readFile(new URL('../assets/models/wish-tree.glb',import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),wishTreeAnchorSource.sha256);
  const jsonLength=data.readUInt32LE(12),gltf=JSON.parse(data.subarray(20,20+jsonLength));
  assert.equal(gltf.nodes.length,1);assert.equal(gltf.nodes[0].matrix,undefined);
  const a=gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION],view=gltf.bufferViews[a.bufferView];
  const start=28+jsonLength+(view.byteOffset||0)+(a.byteOffset||0),height=a.max[1]-a.min[1];
  assert.equal(wishTreeAnchorSource.sourceHeight,height);assert.ok(wishTreeAnchors.length>=60);
  for(const anchor of wishTreeAnchors){
    for(let axis=0;axis<3;axis++){
      const coordinate=data.readFloatLE(start+anchor.vertex*12+axis*4);
      const origin=axis===1?a.min[axis]:(a.min[axis]+a.max[axis])/2;
      assert.ok(Math.abs((coordinate-origin)/height-anchor.point[axis])<.000001,'Hang from an existing vertex, never a guessed cone point');
    }
    assert.ok(anchor.point[1]>=.19&&anchor.point[1]<.78);
    assert.ok(Math.abs(Math.atan2(anchor.point[0],anchor.point[2])-anchor.angle)<.000001);
  }
  // Verify the hung body is outside actual foliage, not merely outside a cone proxy.
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(data.buffer,data.byteOffset+start,a.count*3),3));
  const index=gltf.accessors[gltf.meshes[0].primitives[0].indices],iv=gltf.bufferViews[index.bufferView];
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(data.buffer,data.byteOffset+28+jsonLength+(iv.byteOffset||0)+(index.byteOffset||0),index.count),1));
  geometry.computeBoundingBox();
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld();
  for(const anchor of wishTreeAnchors){
    for(const [kind,data]of Object.entries(envelopeShapes))for(const tilt of [-Math.PI/30,Math.PI/30]){
      const sourceWidth=data.bounds[2]-data.bounds[0],outward=new THREE.Vector3(Math.sin(anchor.angle),0,Math.cos(anchor.angle));
      const center=new THREE.Vector3(((data.bounds[0]+data.bounds[2])/2-data.anchor[0])/sourceWidth,
        -HANGING_DROP+(data.anchor[1]-(data.bounds[1]+data.bounds[3])/2)/sourceWidth,HANGING_OUTSET)
        .applyAxisAngle(new THREE.Vector3(0,0,1),tilt).applyAxisAngle(new THREE.Vector3(0,1,0),anchor.angle)
        .multiplyScalar((kind==='gold'?.106:.098)*.96).add(new THREE.Vector3(...anchor.point)).multiplyScalar(height);
      const ray=new THREE.Raycaster(center.clone().addScaledVector(outward,2),outward.negate());
      const surface=ray.intersectObject(mesh)[0];
      assert.ok(!surface||surface.distance>=1.998,`${anchor.id} ${kind}: keep the short-hung body outside actual foliage`);
    }
  }
  const branchRadii=Array(24).fill(0),positions=geometry.attributes.position;let radius=0;
  for(let i=0;i<positions.count;i++){
    const radial=Math.hypot(positions.getX(i),positions.getZ(i)),band=Math.min(23,Math.floor(positions.getY(i)/height*24));
    radius=Math.max(radius,radial);branchRadii[band]=Math.max(branchRadii[band],radial);
  }
  const env=await envelopeEnvironment();env.tree.add(mesh);env.tree.scale.setScalar(6);env.tree.position.set(8,1,0);
  const wishes=Array.from({length:10},(_,i)=>({id:`real-tree-${i}`,isOwn:i===0,nickname:`測試${i}`}));
  env.controller.setWishes(wishes,env.select);env.controller.layout({height,radius,branchRadii});env.textures.forEach(t=>t.loaded());
  const buttons=env.root.children[0].children,read=new Set();
  for(let step=0;step<32&&read.size<10;step++){
    env.tree.rotation.y=step*Math.PI/16;env.controller.project(1400,800);
    buttons.forEach((button,i)=>{
      if(button.hidden||read.has(i))return;
      env.select(null);button.listeners.click({detail:1,clientX:parseFloat(button.style.left),clientY:parseFloat(button.style.top),stopPropagation(){}});
      if(env.selected?.id===wishes[i].id)read.add(i);
    });
  }
  assert.equal(read.size,10,'All ten letters must remain pointer-readable around the actual GLB and actual crown profile; missing: '+wishes.filter((_,i)=>!read.has(i)).map(w=>w.id));
  env.tree.remove(mesh);env.controller.destroy();
  geometry.dispose();material.dispose();
});

test('stable stratified assignments: 2 upper, 3 middle, 5 lower; all quadrants, clearance, own priority and sparse pools',()=>{
  assert.deepEqual(envelopeZoneCounts(10),{upper:2,middle:3,lower:5});
  const wishes=Array.from({length:10},(_,i)=>({id:`wish-${i}`,isOwn:i===0}));
  const quadrant=a=>Math.floor(((a+Math.PI/4+Math.PI*2)%(Math.PI*2))/(Math.PI/2));
  for(let seed=0;seed<100;seed++){
    const plan=assignEnvelopeAnchors(wishes,[],seed);
    assert.deepEqual(plan,assignEnvelopeAnchors(wishes,[],seed));
    assert.equal(plan.length,10);assert.equal(plan.filter(p=>p.isOwn).length,1);
    assert.deepEqual(plan.reduce((n,p)=>(n[p.zone]++,n),{upper:0,middle:0,lower:0}),{upper:2,middle:3,lower:5});
    assert.equal(new Set(plan.map(p=>quadrant(p.angle))).size,4);
    assert.equal(new Set(plan.map(p=>p.anchorId)).size,10);
    for(const p of plan){assert.ok(wishTreeAnchors.some(a=>a.id===p.anchorId));assert.ok(p.size>=(p.isOwn?.106:.098)*.96&&p.size<=(p.isOwn?.106:.098)*1.04);}
    for(let i=0;i<10;i++)for(let j=i+1;j<10;j++)assert.ok(envelopesSeparated(plan[i],plan[j]));
    const refresh=assignEnvelopeAnchors([...wishes].reverse(),plan,seed);
    for(const p of plan)assert.equal(refresh.find(q=>q.id===p.id),p,'Same collection preserves existing objects and positions');
    const replaced=assignEnvelopeAnchors([{id:'new-own',isOwn:true},...wishes.slice(1)],plan,seed);
    assert.ok(replaced.some(p=>p.id==='new-own'&&p.isOwn));
    for(const p of plan.filter(p=>!p.isOwn))assert.equal(replaced.find(q=>q.id===p.id),p);
    for(let count=0;count<=10;count++){
      const sparse=assignEnvelopeAnchors(wishes.slice(0,count),[],seed);
      assert.equal(sparse.length,count);
      assert.deepEqual(sparse.reduce((n,p)=>(n[p.zone]++,n),{upper:0,middle:0,lower:0}),envelopeZoneCounts(count));
    }
  }
  const overfull=[...wishes.slice(1),{id:'extra'},{id:'last-own',isOwn:true}];
  assert.ok(assignEnvelopeAnchors(overfull).some(p=>p.id==='last-own'),'Own latest remains even if caller supplies more than ten');
  assert.notDeepEqual(assignEnvelopeAnchors(wishes,[],1),assignEnvelopeAnchors(wishes,[],2),'Session seeds produce subtle natural variation');
});

test('hanging envelopes follow a damped pendulum: lag behind the turn, swing on after it stops, and come to rest',()=>{
  const state={angle:0,velocity:0},dt=1/60;
  for(let i=0;i<20;i++)pendulumStep(state,3,dt);
  assert.ok(state.angle<0,'A tree speeding up leaves the envelope behind');
  const amplitude=[];let peak=0,last=state.velocity;
  for(let i=0;i<60*12;i++){pendulumStep(state,0,dt);peak=Math.max(peak,Math.abs(state.angle));if(Math.sign(last)!==Math.sign(state.velocity)){amplitude.push(peak);peak=0;}last=state.velocity;}
  assert.ok(amplitude.length>4,'It keeps swinging after the push');
  for(let i=1;i<amplitude.length;i++)assert.ok(amplitude[i]<amplitude[i-1]+1e-9,'Every swing is smaller than the one before');
  assert.ok(Math.abs(state.angle)<.002,'Friction brings it to rest');
  const huge={angle:0,velocity:0};for(let i=0;i<120;i++)pendulumStep(huge,400,dt);assert.ok(Math.abs(huge.angle)<=PENDULUM.limit);
  assert.equal(outwardLean(0)+0,0);assert.ok(outwardLean(3)<outwardLean(1),'Faster spin flings it further out');assert.ok(outwardLean(100)>=-PENDULUM.leanLimit);
});

test('new gold swings once, survives public refresh, waits for assets, stops exactly, and honors reduced motion',async()=>{
  const env=await envelopeEnvironment(),{controller,tree,textures,motion}=env;
  const initial=[{id:'old',nickname:'自己',isOwn:true},{id:'public',nickname:'朋友',isOwn:false}];
  controller.setWishes(initial,env.select);controller.layout({height:1,radius:.33});textures.forEach(t=>t.loaded());
  const group=tree.children[0],other=group.children[1],otherPosition=other.position.clone(),otherRotation=other.rotation.clone();
  const next=[{id:'new',nickname:'自己',isOwn:true},initial[1]];
  controller.setWishes(next,env.select,{newWishId:'new'});
  const ownAnchor=group.children.find(p=>p!==other),own=ownAnchor.getObjectByName('hanging-pivot'),rest=own.rotation.z;
  assert.equal(controller.update(.25),true);assert.notEqual(own.rotation.z,rest);
  const during=own.rotation.z;controller.setWishes(next,env.select);assert.equal(own.rotation.z,during,'Data refresh must not restart the one-shot');
  assert.ok(other.position.equals(otherPosition));assert.equal(other.rotation.z,otherRotation.z);assert.equal(tree.rotation.y,0);
  assert.equal(controller.update(SWING_DURATION),false);assert.equal(own.rotation.z,rest);assert.equal(controller.update(100),false);assert.equal(own.rotation.z,rest);
  controller.setWishes(next,env.select,{newWishId:'new'});assert.equal(controller.update(.2),false,'No repeated celebration for the same ID');
  motion.matches=true;controller.setWishes([{id:'reduced',nickname:'自己',isOwn:true}],env.select,{newWishId:'reduced'});assert.equal(controller.update(.5),false);
  controller.destroy();
});

test('delivery swing waits for the real model and textures, and cancels immediately for reduced motion',async()=>{
  const env=await envelopeEnvironment(),{controller,textures,motion,tree}=env;
  controller.setWishes([{id:'new',isOwn:true,nickname:'自己'}],env.select,{newWishId:'new'});
  assert.equal(controller.update(20),false);
  controller.layout({height:1,radius:.33});assert.equal(controller.update(20),false);
  textures.forEach(t=>t.loaded());const pivot=tree.children[0].children[0].getObjectByName('hanging-pivot'),rest=pivot.rotation.z;
  assert.equal(controller.update(.25),true);assert.notEqual(pivot.rotation.z,rest);
  motion.matches=true;assert.equal(controller.update(0),false);assert.equal(pivot.rotation.z,rest);
  controller.destroy();
});

test('branch hierarchy: turning the tree swings envelopes on their hinge, never detaches or billboards them, then they settle',async()=>{
  const env=await envelopeEnvironment(),{tree,controller,camera}=env;
  controller.setWishes(Array.from({length:10},(_,i)=>({id:`calm-${i}`,isOwn:i===0})),env.select);
  controller.layout({height:1,radius:.33});env.textures.forEach(t=>t.loaded());
  tree.scale.setScalar(6);tree.position.set(8,1,0);
  const anchors=tree.children[0].children,poses=anchors.map(anchor=>({
    position:anchor.position.clone(),rotation:anchor.quaternion.clone(),scale:anchor.scale.clone(),
    pivot:anchor.getObjectByName('hanging-pivot'),body:anchor.getObjectByName('printed-paper-body'),
    rest:anchor.getObjectByName('hanging-pivot').quaternion.clone(),
  }));
  let swung=0,lean=0;
  for(let frame=0;frame<=240;frame++){
    tree.rotation.y=frame*Math.PI/60;controller.update(1/60);controller.project(1400,800);
    poses.forEach((pose,i)=>{
      const anchor=anchors[i];assert.ok(anchor.position.equals(pose.position));assert.ok(anchor.quaternion.equals(pose.rotation),'Anchors stay fixed to the branch, no billboarding');assert.ok(anchor.scale.equals(pose.scale));
      assert.ok(pose.pivot.getWorldPosition(new THREE.Vector3()).distanceTo(anchor.getWorldPosition(new THREE.Vector3()))<1e-10,'Thread hinge never detaches');
      swung=Math.max(swung,pose.pivot.quaternion.angleTo(pose.rest));lean=Math.min(lean,pose.pivot.rotation.x);
    });
  }
  assert.ok(swung>.05,'A turning tree visibly moves the envelopes');assert.ok(swung<1.1,'Swing stays limited');assert.ok(lean<0,'Spinning leans them outward');
  for(let frame=0;frame<60*20;frame++)controller.update(1/60);
  assert.equal(controller.update(1/60),false,'They come to rest and stop asking for frames');
  poses.forEach(pose=>assert.ok(pose.pivot.quaternion.angleTo(pose.rest)<.01));
  camera.position.x=2;camera.lookAt(8,4,0);controller.project(1390,800);
  anchors.forEach((anchor,i)=>{assert.ok(anchor.quaternion.equals(poses[i].rotation));assert.ok(poses[i].pivot.quaternion.equals(poses[i].rest));});
  for(let i=0;i<=140;i++)assert.ok(Math.abs(paperSwing(i/100))<=MAX_SWING);
  assert.ok(SWING_DURATION>=1&&SWING_DURATION<=1.5);assert.equal(paperSwing(SWING_DURATION),0);assert.equal(paperSwing(100),0);
  controller.destroy();
});
