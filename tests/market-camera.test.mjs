import test from 'node:test';
import assert from 'node:assert/strict';
import { approach, layer } from '../js/services/market-camera.js';

const near = (a, b, message) => assert.ok(Math.abs(a - b) < .01, `${message}: ${a} ≠ ${b}`);
const map = (shot, [x, y]) => [shot.to[0] + shot.scale * (x - shot.focus[0]), shot.to[1] + shot.scale * (y - shot.focus[1])];
const house = { x: 1003, y: 212, width: 429, height: 538 }, desk = { width: 1440, height: 804 };

test('walking up to the house on the right: it comes to the middle, as large as the height allows, whole', () => {
  const shot = approach({ thing: house, view: desk, scene: { left: 0, top: 0, right: 1900, bottom: 804 } });
  near(shot.scale, (804 - 36) / 538, 'the house fills the height but for a margin');
  near(shot.to[0], 720, 'straight ahead, in the middle across'); near(shot.to[1], 402, 'and down');
  const [left, top] = map(shot, [house.x, house.y]), [right, bottom] = map(shot, [house.x + house.width, house.y + house.height]);
  assert.ok(left >= 0 && right <= 1440 && top >= 0 && bottom <= 804, 'the whole house in view');
  const [sceneRight] = map(shot, [1900, 0]), [sceneLeft] = map(shot, [0, 0]);
  assert.ok(sceneRight >= 1440 && sceneLeft <= 0, 'the street drawn on past the edge still fills the view');
});

test('where the street is not drawn on, the house stops short of the middle rather than show a bare edge', () => {
  const shot = approach({ thing: house, view: desk });
  assert.ok(shot.to[0] > 720, 'it stays on its side');
  near(map(shot, [1440, 0])[0], 1440, 'the street\'s edge just reaches the edge of the view');
});

test('on a phone the cabinet, not the lanterns hung out from it, sets how near: it fills the width', () => {
  const thing = { x: 12, y: 712, width: 366, height: 459, core: 366 * 960 / 1340 }, view = { width: 390, height: 1240, top: 520, bottom: 1364 };
  const shot = approach({ thing, view: { ...view, bottom: 1240 } });
  near(shot.scale, 390 * .94 / thing.core, 'the cabinet is 94% of the width');
  near(shot.to[0], 195, 'in the middle across');
});

test('the house never shrinks, and never comes nearer than the most allowed', () => {
  assert.equal(approach({ thing: { x: 0, y: 0, width: 1400, height: 900 }, view: desk }).scale, 1);
  assert.equal(approach({ thing: { x: 600, y: 300, width: 40, height: 40 }, view: desk }).scale, 2.4);
});

test('a layer\'s turn and walk: scaled about the house, carried over by the turn, wherever it is laid out', () => {
  const shot = approach({ thing: house, view: desk, scene: { left: 0, top: 0, right: 1900, bottom: 804 } });
  const px = text => text.split(' ').map(parseFloat);
  const at = ({ origin, translate, scale }, offset, [x, y]) => { const [ox, oy] = px(origin), [tx, ty] = px(translate), s = Number(scale); return [offset[0] + ox + tx + s * (x - offset[0] - ox), offset[1] + oy + ty + s * (y - offset[1] - oy)]; };
  for (const offset of [[0, 0], [345, 40], [1003, 212]]) {
    const moved = at(layer(shot, offset), offset, shot.focus);
    near(moved[0], shot.to[0], `the house's middle lands in the middle (layer at ${offset})`); near(moved[1], shot.to[1], 'and down');
    const corner = at(layer(shot, offset), offset, [1440, 804]);
    near(corner[0], map(shot, [1440, 804])[0], 'every point moves as the shot says'); near(corner[1], map(shot, [1440, 804])[1], 'down too');
  }
  const turned = layer({ ...shot, scale: 1 }, [0, 0]);
  assert.equal(turned.scale, '1', 'only turned, nothing grows');
});
