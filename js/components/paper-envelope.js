import * as THREE from 'three';
import { envelopeShapes } from '../data/envelope-shapes.js';
import { PAPER_DEPTH, HANGING_DROP, HANGING_OUTSET } from '../data/paper-envelope-style.js';
export { PAPER_DEPTH, paperSwing, SWING_DURATION } from '../data/paper-envelope-style.js';

// Static, shared geometry. Contours come from the original alpha, including bow holes.
export function createPaperEnvelopeLibrary({ onLoad = () => {}, onError = () => {} } = {}) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), variants = {};
  const loader = new THREE.TextureLoader(); let disposed = false;
  const geometry = value => { value.computeBoundingBox(); geometries.add(value); return value; };
  const material = value => { materials.add(value); return value; };
  const paper = color => material(new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, envMapIntensity: 0 }));
  const ivory = paper(0xf3e3c7), edge = paper(0xd7bea0), threadMaterial = paper(0xbca480);
  const creaseMaterial = material(new THREE.LineBasicMaterial({ color: 0x9c8063, transparent: true, opacity: .26 }));
  const shadeMaterial = material(new THREE.MeshBasicMaterial({ color: 0x66482e, transparent: true, opacity: .11, depthWrite: false }));
  const threadEnd = new THREE.Vector3(0, -HANGING_DROP, HANGING_OUTSET);
  const thread = geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(), new THREE.Vector3(.002, -HANGING_DROP * .42, HANGING_OUTSET * .30),
    new THREE.Vector3(-.002, -HANGING_DROP * .79, HANGING_OUTSET * .69), threadEnd,
  ]), 8, .0035, 4, false));

  for (const [kind, data] of Object.entries(envelopeShapes)) {
    const variant = variants[kind] = { ready: false, failed: false, instances: new Set(), data };
    const texture = loader.load(new URL(`../../assets/illustrations/wish/${data.file}`, import.meta.url).href,
      () => { if (!disposed) { variant.ready = true; onLoad(); } },
      undefined, error => { if (!disposed) { variant.failed = true; onError(kind, error); } });
    texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const printed = material(new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0, envMapIntensity: 0, alphaTest: .35 }));
    const rear = material(new THREE.MeshStandardMaterial({ map: texture, color: 0xf6e7d1, roughness: 1, metalness: 0, envMapIntensity: 0, side: THREE.BackSide }));
    const width = data.bounds[2] - data.bounds[0];
    const point = ([x, y]) => new THREE.Vector2((x - data.anchor[0]) / width, (data.anchor[1] - y) / width);
    function shape(points, holes = []) {
      const value = new THREE.Shape(points.map(point));
      for (const hole of holes) value.holes.push(new THREE.Path(hole.map(point)));
      return value;
    }
    function printedGeometry(outline, holes = [], isRear = false) {
      const value = new THREE.ShapeGeometry(shape(outline, holes), 1), positions = value.attributes.position;
      const uv = value.attributes.uv, [pw, ph] = data.sourceSize, [rx, ry, rw, rh] = data.paperPatch;
      const minY = (data.anchor[1] - data.bounds[3]) / width, bodyHeight = (data.bounds[3] - data.bounds[1]) / width;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i);
        if (isRear) uv.setXY(i, (rx + (x + .5) * rw) / pw, 1 - (ry + (1 - (y - minY) / bodyHeight) * rh) / ph);
        else uv.setXY(i, (data.anchor[0] + x * width) / pw, 1 - (data.anchor[1] - y * width) / ph);
      }
      return geometry(value);
    }
    const outline = shape(data.outline, data.holes);
    variant.board = geometry(new THREE.ExtrudeGeometry(outline, { depth: PAPER_DEPTH, steps: 1, bevelEnabled: true, bevelThickness: .0006, bevelSize: .001, bevelSegments: 1, curveSegments: 1 }).translate(0, 0, -PAPER_DEPTH / 2));
    variant.front = printedGeometry(data.outline, data.holes);
    variant.rear = printedGeometry(data.outline, data.holes, true);
    variant.frontMaterial = printed; variant.rearMaterial = rear;
    variant.center = variant.front.boundingBox.getCenter(new THREE.Vector3());
    variant.box = variant.front.boundingBox.clone();
    const seal = Array.from({ length: 28 }, (_, i) => {
      const angle = i / 28 * Math.PI * 2, radius = data.seal.radius * (1 + .016 * Math.sin(i * 2.3));
      return [data.seal.center[0] + Math.cos(angle) * radius, data.seal.center[1] + Math.sin(angle) * radius];
    });
    variant.layers = [
      { outline: data.flap, z: PAPER_DEPTH / 2 + .0007, depth: .0012, side: edge },
      { outline: seal, z: PAPER_DEPTH / 2 + .0021, depth: .0022, side: paper(kind === 'gold' ? 0xb88845 : 0x8c4737) },
    ].map(layer => ({ ...layer,
      sides: geometry(new THREE.ExtrudeGeometry(shape(layer.outline), { depth: layer.depth, bevelEnabled: false, curveSegments: 1, steps: 1 })),
      front: printedGeometry(layer.outline),
    }));
    const creasePoints = [data.flap[0], data.flap[2], data.flap[2], data.flap[1]].map(p => { const v = point(p); return new THREE.Vector3(v.x, v.y, -PAPER_DEPTH / 2 - .0008); });
    variant.crease = geometry(new THREE.BufferGeometry().setFromPoints(creasePoints));
  }

  return {
    create(kind) {
      const variant = variants[kind], anchor = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group();
      anchor.name = `branch-anchor-${kind}`; pivot.name = 'hanging-pivot'; body.name = 'printed-paper-body';
      anchor.add(pivot);
      const string = new THREE.Mesh(thread, threadMaterial); string.name = 'short-hanging-thread';
      body.position.copy(threadEnd); pivot.add(string, body);
      const board = new THREE.Mesh(variant.board, [ivory, edge]); board.name = 'alpha-contour-paperboard'; body.add(board);
      const face = new THREE.Mesh(variant.front, variant.frontMaterial); face.position.z = PAPER_DEPTH / 2 + .0007; face.name = 'original-front-illustration'; body.add(face);
      const rear = new THREE.Mesh(variant.rear, variant.rearMaterial); rear.position.z = -PAPER_DEPTH / 2 - .0007; rear.name = 'textured-paper-rear'; body.add(rear);
      body.add(new THREE.LineSegments(variant.crease, creaseMaterial));
      for (const [i, layer] of variant.layers.entries()) {
        const shade = new THREE.Mesh(layer.front, shadeMaterial); shade.position.set(.003, -.004, layer.z - .0001); body.add(shade);
        const sides = new THREE.Mesh(layer.sides, layer.side); sides.position.z = layer.z; body.add(sides);
        const top = new THREE.Mesh(layer.front, variant.frontMaterial); top.position.z = layer.z + layer.depth + .0001; top.name = i ? 'raised-original-wax-seal' : 'raised-original-paper-flap'; body.add(top);
      }
      variant.instances.add(anchor);
      return { anchor, pivot, body, board, variant, localCenter: variant.center.clone(), bounds: variant.box.clone() };
    },
    release(ornament) { ornament.variant.instances.delete(ornament.anchor); },
    destroy() {
      if (disposed) return; disposed = true;
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      Object.values(variants).forEach(v => v.instances.clear());
    },
  };
}
