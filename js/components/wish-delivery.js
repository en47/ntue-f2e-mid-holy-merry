import { deliveryPath, stockingMouth } from './wish-delivery-path.js';

// A single visual object folds and flies. The caller supplies the real persistence operation.
export function createWishDelivery(root, { savingText = '正在儲存到此瀏覽器……' } = {}) {
  const form = root.querySelector('#wish-form'), image = root.querySelector('.stocking-station img');
  const receipt = root.querySelector('#delivery-receipt'), again = root.querySelector('#wish-again');
  const feedback = root.querySelector('#delivery-feedback'), message = root.querySelector('#delivery-message');
  const snowflake = root.querySelector('#delivery-snowflake');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let operation = null, destroyed = false;
  const animations = new Set();
  const abortError = () => new DOMException('Delivery interrupted', 'AbortError');
  function state(value, text) {
    root.dataset.deliveryState = value; feedback.hidden = !text; message.textContent = text || '';
    snowflake.hidden = value !== 'saving';
  }
  function cancel() { if (operation && !operation.committed) { operation.cancelled = true; animations.forEach(a => a.cancel()); } }
  async function animate(target, keyframes, options) {
    if (operation?.cancelled || destroyed) throw abortError();
    const animation = target.animate(keyframes, { fill: 'forwards', ...options }); animations.add(animation);
    await animation.finished;
    if (operation?.cancelled || destroyed) throw abortError();
    return animation;
  }
  function snapshot(width, height, padding) {
    const clone = form.cloneNode(true);
    clone.className = 'wish-letter fold-copy'; clone.removeAttribute('style'); clone.removeAttribute('id');
    clone.removeAttribute('aria-hidden'); clone.inert = true;
    clone.style.setProperty('--sheet-width', `${width}px`); clone.style.setProperty('--sheet-height', `${height}px`);
    clone.style.setProperty('--sheet-padding', padding);
    const original = form.querySelectorAll('input,textarea');
    clone.querySelectorAll('input,textarea').forEach((field, i) => { field.value = original[i].value; field.removeAttribute('name'); field.removeAttribute('required'); });
    clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    clone.querySelectorAll('[for]').forEach(node => node.removeAttribute('for'));
    clone.querySelectorAll('[role],[aria-live],[aria-describedby]').forEach(node => { node.removeAttribute('role'); node.removeAttribute('aria-live'); node.removeAttribute('aria-describedby'); });
    return clone;
  }
  function createPaper(width, height) {
    const travel = document.createElement('div'); travel.className = 'delivery-travel';
    travel.style.width = `${width}px`; travel.style.height = `${height}px`;
    const paper = document.createElement('div'); paper.className = 'delivery-paper'; travel.append(paper);
    const side = width * .1, centerHeight = Math.max(width * .8 / 1.5, height / 3), top = (height - centerHeight) / 2;
    const padding = getComputedStyle(form).padding;
    // Full-width horizontal flaps carry the corners; side flaps occupy only the
    // middle belt. This reconstructs the sheet without long dangling side strips.
    const regions = [['center',side,top,width*.8,centerHeight], ['bottom',0,top+centerHeight,width,top], ['left',0,top,side,centerHeight], ['right',width-side,top,side,centerHeight], ['top',0,0,width,top]];
    const panels = {}, faces = [], cornerFaces = [];
    for (const [name,x,y,w,h] of regions) {
      const panel = document.createElement('div'); panel.className = `fold-panel fold-${name}`;
      Object.assign(panel.style, {left:`${x}px`,top:`${y}px`,width:`${w}px`,height:`${h}px`});
      const front = document.createElement('div'); front.className = 'fold-face front';
      const copy = snapshot(width,height,padding); copy.style.setProperty('--copy-left',`${-x}px`); copy.style.setProperty('--copy-top',`${-y}px`);
      front.append(copy); const back = document.createElement('div'); back.className = 'fold-face back';
      panel.append(front,back); paper.append(panel); panels[name]=panel;
      faces.push(front,back); if(name==='top'||name==='bottom')cornerFaces.push(front,back);
    }
    const art = document.createElement('img'); art.src = 'assets/illustrations/wish/envelope.png'; art.className = 'fold-envelope'; art.alt = ''; paper.append(art);
    const seal = document.createElement('span'); seal.className = 'fold-wax'; seal.textContent = '♥'; paper.append(seal);
    return { travel, paper, panels, faces, cornerFaces, art, seal, envelopeWidth: width*.8 };
  }
  const relative = rect => {
    const base = root.getBoundingClientRect();
    return {left:rect.left-base.left-root.clientLeft,top:rect.top-base.top-root.clientTop,width:rect.width,height:rect.height};
  };
  function geometry() {
    const r = relative(form.getBoundingClientRect()), mouth = stockingMouth(relative(image.getBoundingClientRect()));
    return {r,mouth};
  }
  function restore() {
    animations.forEach(a => a.cancel()); animations.clear();
    operation?.layer?.remove(); operation?.resize?.disconnect();
    form.classList.remove('is-delivering'); form.removeAttribute('aria-hidden'); form.inert = false;
    form.removeAttribute('aria-busy');
    if (!form.classList.contains('is-sent')) form.style.height = '';
  }
  function reset() {
    if (operation) return;
    receipt.hidden = true; form.classList.remove('is-sent'); form.style.height = '';
    root.querySelector('.letter-content').removeAttribute('aria-hidden');
    form.reset(); root.querySelector('#wish-counter').textContent = '0 / 300';
    state('idle',''); root.querySelector('#nickname').focus({preventScroll:true});
  }
  again.addEventListener('click',reset);
  const visibility = () => { if (document.hidden) cancel(); };
  document.addEventListener('visibilitychange',visibility);
  return {
    get busy() { return !!operation; },
    async run(commit) {
      if (operation || destroyed) return null;
      operation = {cancelled:false,committed:false}; form.setAttribute('aria-busy','true');
      const controls = [...form.querySelectorAll('input,textarea,button')];
      const disabled = controls.map(node=>node.disabled);
      try {
        const {r,mouth} = geometry(), width=form.offsetWidth, height=form.offsetHeight;
        form.style.height = `${height}px`;
        if (!motion.matches) {
          const layer=document.createElement('div'); layer.className='wish-delivery'; layer.hidden=true;layer.setAttribute('aria-hidden','true'); layer.inert=true;
          const item=createPaper(width,height); layer.append(item.travel); root.append(layer); operation.layer=layer;
          const start={x:r.left+r.width/2,y:r.top+r.height/2};
          item.travel.style.left=`${start.x-width/2}px`;item.travel.style.top=`${start.y-height/2}px`;
          const cuff=document.createElement('img');cuff.src=image.getAttribute('src');cuff.alt='';cuff.className='delivery-cuff';
          Object.assign(cuff.style,{left:`${mouth.left}px`,top:`${mouth.top}px`,width:`${mouth.width}px`,height:`${mouth.height}px`});layer.append(cuff);
          operation.resize=new ResizeObserver(()=>{
            const next=geometry();
            if (Math.abs(next.r.width-r.width)>2 || Math.abs(next.r.left-r.left)>2 || Math.abs(next.mouth.x-mouth.x)>2 || Math.abs(next.mouth.y-mouth.y)>2) cancel();
          });operation.resize.observe(root);operation.resize.observe(image);
          // Prepare the actual artwork before replacing the original paper.
          form.inert=true;state('preparing','正在準備聖誕信紙……');
          await item.art.decode();
          if(operation.cancelled || destroyed)throw abortError();
          // Freeze the measured letter dimensions, but leave it in layout for the rack/scene.
          layer.hidden=false;feedback.focus({preventScroll:true});form.setAttribute('aria-hidden','true');form.classList.add('is-delivering');
          state('folding','正在摺好你的聖誕信紙……');
          const duration=1500, scale=Math.min(100,item.envelopeWidth*.4)/item.envelopeWidth;
          await Promise.all([
            animate(item.paper,[{transform:'rotate(-1deg) scale(1)',offset:0},{transform:'rotate(-1deg) scale(1)',offset:.2},{transform:'rotate(0) scale(.94)',offset:.55},{transform:`rotate(0) scale(${scale})`,offset:1}],{duration,easing:'cubic-bezier(.35,0,.2,1)'}),
            animate(item.panels.bottom,[{transform:'rotateX(0)',offset:0},{transform:'rotateX(0)',offset:.12},{transform:'rotateX(180deg)',offset:.48},{transform:'rotateX(180deg)',offset:1}],{duration,easing:'ease-in-out'}),
            animate(item.panels.left,[{transform:'rotateY(0)',offset:0},{transform:'rotateY(0)',offset:.35},{transform:'rotateY(180deg)',offset:.7},{transform:'rotateY(180deg)',offset:1}],{duration,easing:'ease-in-out'}),
            animate(item.panels.right,[{transform:'rotateY(0)',offset:0},{transform:'rotateY(0)',offset:.4},{transform:'rotateY(-180deg)',offset:.74},{transform:'rotateY(-180deg)',offset:1}],{duration,easing:'ease-in-out'}),
            animate(item.panels.top,[{transform:'rotateX(0)',offset:0},{transform:'rotateX(0)',offset:.57},{transform:'rotateX(-180deg)',offset:.88},{transform:'rotateX(-180deg)',offset:1}],{duration,easing:'ease-in-out'}),
            ...item.cornerFaces.map(face=>animate(face,[{clipPath:'inset(0)',offset:0},{clipPath:'inset(0)',offset:.48},{clipPath:'inset(0 10%)',offset:.77},{clipPath:'inset(0 10%)',offset:1}],{duration,easing:'ease-in-out'})),
            animate(item.seal,[{opacity:0,transform:'translate(-50%,-50%) scale(0)',offset:0},{opacity:0,transform:'translate(-50%,-50%) scale(0)',offset:.78},{opacity:1,transform:'translate(-50%,-50%) scale(1.1)',offset:.92},{opacity:0,transform:'translate(-50%,-50%) scale(1)',offset:1}],{duration}),
            animate(item.art,[{opacity:0,offset:0},{opacity:0,offset:.86},{opacity:1,offset:1}],{duration}),
            // Fade faces, not their preserve-3d parent (which would flatten the
            // back faces and show mirrored writing in Safari).
            ...item.faces.map(face=>animate(face,[{opacity:1,offset:0},{opacity:1,offset:.88},{opacity:0,offset:1}],{duration})),
          ]);
          state('flying','信封正飛往聖誕襪……');
          if (image.getBoundingClientRect().bottom > innerHeight - 24) image.scrollIntoView({block:'nearest',behavior:'smooth'});
          await animate(item.travel,deliveryPath(start,{x:mouth.x,y:mouth.y}),{duration:1850,easing:'cubic-bezier(.35,0,.45,1)'});
          item.travel.hidden=true;
          cuff.hidden=true;
        }
        if (operation.cancelled || destroyed) throw abortError();
        controls.forEach(node=>{node.disabled=true;});
        state('saving',savingText);
        // No simulated network delay: the loading state wraps the actual persistence callback.
        const result=await commit();operation.committed=true;
        form.classList.add('is-sent');root.querySelector('.letter-content').setAttribute('aria-hidden','true');receipt.hidden=false;
        state('success','');
        return result;
      } catch(error) {
        state(error.name==='AbortError'?'idle':'error','');throw error;
      } finally {
        controls.forEach((node,i)=>{node.disabled=disabled[i];});restore();operation=null;
        if(!destroyed && form.classList.contains('is-sent'))root.querySelector('#receipt-title').focus({preventScroll:true});
      }
    },
    cancel,
    destroy() { destroyed=true;cancel();restore();again.removeEventListener('click',reset);document.removeEventListener('visibilitychange',visibility); },
  };
}
