// Shared paper-cut vocabulary for the Game page's SVG art.
export const NS = 'http://www.w3.org/2000/svg';

export function shape(name, attributes, parent) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}

// Rough cut, cream paper rim, fine grain and a soft cast shadow. `scale` matches the art's viewBox size.
export function paperFilter(svg, id, { scale = 1, grain = .8, rim = '#f6ecda', shadow = .3 } = {}) {
  const defs = shape('defs', {}, svg);
  defs.innerHTML = `
    <filter id="${id}" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${.035 / scale}" numOctaves="2" seed="4" result="wobble"/>
      <feDisplacementMap in="SourceGraphic" in2="wobble" scale="${4 * scale}" result="cut"/>
      <feMorphology in="cut" operator="dilate" radius="${3 * scale}" result="edge"/>
      <feFlood flood-color="${rim}"/><feComposite in2="edge" operator="in" result="rim"/>
      <feTurbulence type="fractalNoise" baseFrequency="${.85 / scale} ${.55 / scale}" numOctaves="3" seed="9"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 .96  0 0 0 0 .86  0 0 0 ${grain} ${-grain * .525}"/>
      <feComposite in2="cut" operator="in" result="grain"/>
      <feGaussianBlur in="edge" stdDeviation="${2.4 * scale}"/><feOffset dx="${scale}" dy="${5 * scale}"/>
      <feComponentTransfer result="shadow"><feFuncA type="linear" slope="${shadow}"/></feComponentTransfer>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="rim"/><feMergeNode in="cut"/><feMergeNode in="grain"/></feMerge>
    </filter>`;
  return `url(#${id})`;
}

// SVG filters are costly to repaint, so each piece becomes an image once and only its layer moves.
export function rasterize(svg) {
  const [, , width, height] = svg.getAttribute('viewBox').split(' ');
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  const image = new Image(+width, +height);
  image.alt = ''; image.decoding = 'async';
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  return image;
}

let layerCount = 0;
// `draw` receives a filtered group; `origin` is the layer's pivot in viewBox units.
export function paperLayer(host, viewBox, className, draw, { paper = {}, origin, preserveAspectRatio } = {}) {
  const svg = shape('svg', { viewBox, ...(preserveAspectRatio ? { preserveAspectRatio } : {}) });
  draw(shape('g', paper ? { filter: paperFilter(svg, `paper-${++layerCount}`, paper) } : {}, svg));
  const layer = document.createElement('div');
  layer.className = `art-layer ${className}`;
  if (origin) {
    const [, , width, height] = viewBox.split(' ');
    layer.style.transformOrigin = `${origin[0] / width * 100}% ${origin[1] / height * 100}%`;
  }
  const image = rasterize(svg);
  image.loading = 'lazy';
  layer.append(image);
  host.append(layer);
  return layer;
}

export function leaf(parent, transform, fill) {
  const group = shape('g', { transform }, parent);
  shape('path', { d: 'M0-26C13-20 20-6 15 8 12 18 5 24 0 28-5 24-12 18-15 8-20-6-13-20 0-26Z', fill }, group);
  shape('path', { d: 'M0-20V22', stroke: '#1f4a3a', 'stroke-width': 1.3, 'stroke-opacity': .45, fill: 'none' }, group);
}

export function holly(parent, x, y, size, fill = '#5f8a70', berry = '#b4544c') {
  const group = shape('g', { transform: `translate(${x} ${y}) scale(${size})` }, parent);
  for (const angle of [-68, 4, 72]) {
    const blade = shape('g', { transform: `rotate(${angle})` }, group);
    shape('path', { d: 'M0 0C-4-5-12-7-17-5-13-11-15-16-13-23-9-20-7-19-5-20-6-26-6-31-2-38 0-42 2-42 4-38 7-31 7-26 6-20 8-19 10-20 14-23 16-16 14-11 18-5 13-7 5-5 0 0Z', fill }, blade);
    shape('path', { d: 'M1-2V-36', stroke: '#3f6653', 'stroke-width': 1.4, 'stroke-opacity': .6, fill: 'none' }, blade);
  }
  for (const [cx, cy] of [[-8, 3], [8, 4], [0, 12]]) shape('circle', { cx, cy, r: 7.5, fill: berry }, group);
}

export function pine(parent, x, base, height, fill = '#5f8a70', snow = '#fbf8f1') {
  const group = shape('g', { transform: `translate(${x} ${base}) scale(${height / 100})` }, parent);
  shape('rect', { x: -6, y: -12, width: 12, height: 14, fill: '#94785f' }, group);
  shape('path', { d: 'M0-100C8-84 18-72 26-64L15-65C24-52 34-42 42-34L28-35C38-24 46-16 54-10-10-4-40-5-54-10-44-18-36-25-28-35L-42-34C-33-44-25-53-15-65L-26-64C-17-72-8-85 0-100Z', fill }, group);
  shape('path', { d: 'M0-100C6-88 12-80 18-72 8-70 4-76-2-70-8-76-12-70-18-72-11-81-6-89 0-100ZM-30-36C-18-46-8-44 2-38 12-46 22-46 31-36 20-30 10-34 2-30-8-34-20-30-30-36Z', fill: snow }, group);
}

// Decorative loops stop once their art leaves the viewport.
export function pauseOffscreen(elements) {
  const targets = elements.filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('is-paused', !entry.isIntersecting);
  });
  const start = () => targets.forEach(target => observer.observe(target));
  start();
  window.addEventListener('pagehide', () => observer.disconnect());
  window.addEventListener('pageshow', event => { if (event.persisted) start(); });
}
