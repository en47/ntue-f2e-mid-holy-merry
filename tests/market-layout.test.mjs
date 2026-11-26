import test from 'node:test';
import assert from 'node:assert/strict';
import { halfWidth, lens } from '../js/services/market-view.js';
import { BANKS, CORNER, EASEL, ELVES, FOREST, FRAME, FRAME_TALL, HOUSE, LAMP, MACHINE, MACHINE_DEPTH, PENNANT_FROM, RIGHT_HOUSE, SIGN, SKY, STALLS, STARS, VIEW, WINGS, along, bearing, clearance, footprint, ground, overlaps, picture } from '../js/services/market-layout.js';

const DEG = Math.PI / 180;
const near = (a, b, by, message) => assert.ok(Math.abs(a - b) <= by, `${message}: ${a.toFixed(2)} against ${b.toFixed(2)}`);
// Everything standing on the cobbles, as footprints.
const things = { 'the machine': MACHINE, 'the lamp': LAMP, 'the chalkboard': EASEL, 'the Advent House': HOUSE, ...Object.fromEntries(STALLS.map(stall => [`the ${stall.look} stall`, stall])) };
const prints = () => Object.entries(things).map(([name, thing]) => [name, footprint(thing)]);
const elf = at => ({ at, turn: 0, left: .22, right: .22, back: .15, front: .15 });

test('laid out from the picture: each thing shows where the picture has it, seen from where the visitor stands', () => {
  for (const [name, thing] of Object.entries({ machine: MACHINE, lamp: LAMP, house: HOUSE, chalkboard: EASEL, ...Object.fromEntries(STALLS.map(stall => [stall.look, stall])) })) {
    const [x0, y0, x1, y1] = thing.box, [x, z] = thing.at, foot = picture([x, 0, z]), top = picture([x, thing.height, z]);
    assert.ok(foot[0] > x0 && foot[0] < x1, `the ${name}'s foot within its box across`);
    near(top[1], y0, 1, `the ${name}'s top where the picture has it`);
  }
  // The ground and the picture agree both ways; the visitor's eye is the picture's camera.
  for (const [u, v] of [[300, 700], [900, 500], [1200, 800]]) { const { at: [x, z] } = ground(u, v), [pu, pv] = picture([x, 0, z]); near(pu, u, .01, 'across'); near(pv, v, .01, 'down'); }
  assert.deepEqual(VIEW.eye, [0, FRAME.eye, 0]);
});

test('the machine faces the visitor nearly square, turned just past the way to them so that its deep side shows', () => {
  const toVisitor = -bearing(VIEW.eye, MACHINE.at);
  assert.ok(MACHINE.turn > toVisitor && MACHINE.turn - toVisitor < 12 * DEG, `turned ${(MACHINE.turn / DEG).toFixed(0)}°, the visitor at ${(toVisitor / DEG).toFixed(0)}°`);
  // How much of its left side shows, against its front: a deep machine's side, not a card's edge.
  const unit = MACHINE.height / 1.27, depth = MACHINE_DEPTH * unit, width = .5 * unit, side = depth * Math.sin(MACHINE.turn - toVisitor), front = width * Math.cos(MACHINE.turn - toVisitor);
  assert.ok(side / front > .2, `its side shows ${(side / front * 100).toFixed(0)}% as wide as its front`);
  assert.ok(MACHINE.height > 1.9 && MACHINE.height < 2.3, 'as tall as a big vending machine is');
  assert.equal(EASEL.turn, MACHINE.turn, 'the chalkboard stands as the machine does');
  const [lx, lz] = LAMP.at, [mx, mz] = MACHINE.at;
  assert.ok(lx < mx - MACHINE.left && Math.abs(lz - mz) < .5, 'the lamp at the machine\'s left hand, where its light comes from');
});

test('nothing stands in anything else; the elves stand clear and the one with the presents walks clear', () => {
  const list = prints();
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) assert.ok(!overlaps(list[i][1], list[j][1]), `${list[i][0]} stands in ${list[j][0]}`);
  for (const [name, at] of [['the elf with the cup', ELVES.cocoa], ['the elf with the bauble', ELVES.bauble]]) for (const [other, print] of list) assert.ok(!overlaps(footprint(elf(at)), print), `${name} stands in ${other}`);
  // The elf with the presents walks clear of everything until it comes to the Advent House (then it goes round behind
  // its front); it starts where the machine hides it and ends where the house does, so it never has to fade.
  const { z, from, to } = ELVES.walk;
  for (let x = from; x <= to; x += .1) for (const [other, print] of list) if (other !== 'the Advent House') assert.ok(clearance([x, z], print) > .2, `the elf with the presents walks through ${other} at ${x.toFixed(1)}`);
  const [left, right] = [picture([from - .3, 0, z])[0], picture([from + .3, 0, z])[0]], top = picture([from, ELVES.height, z])[1];
  assert.ok(left > MACHINE.box[0] && right < MACHINE.box[2] && top > MACHINE.box[1], 'it comes out from behind the machine');
  // (the house's cabinet starts .88 m left of its middle: the elf's left edge shows right of that, behind it)
  const [x, cz] = along(HOUSE, -.88), cabinet = picture([x, 0, cz])[0];
  assert.ok(clearance([to, z], footprint({ ...HOUSE, left: .9, right: .9, front: 0, back: .9 })) === 0 && picture([to - .3, 0, z])[0] > cabinet, 'it ends behind the house\'s front, whole');
  for (const [other, print] of list) assert.ok(clearance([VIEW.eye[0], VIEW.eye[2]], print) > 1, `the visitor stands in ${other}`);
});

test('the booths down the lane stand slanted to it, like the picture\'s, and the string of bulbs is tied to one of them', () => {
  for (const stall of STALLS.filter(stall => stall.deep)) {
    const square = -bearing(VIEW.eye, stall.at);
    assert.ok(Math.abs(stall.turn - square) > 25 * DEG, `the ${stall.look} booth turned ${((stall.turn - square) / DEG).toFixed(0)}° from square to the visitor`);
  }
  // Its end is at the front post of the ornament booth's far end, up under its roof, not through the booth.
  const ornaments = STALLS.find(stall => stall.look === 'ornaments'), [px, py, pz] = PENNANT_FROM, [ex, ez] = along(ornaments, ornaments.width / 2, 0);
  assert.ok(Math.hypot(px - ex, pz - ez) < .15 && py > ornaments.height * .6 && py < ornaments.height, 'tied at the far front post, under the roof');
  assert.ok(clearance([px, pz], footprint({ ...ornaments, left: ornaments.width / 2 - .2, right: ornaments.width / 2 - .2, front: 0 })) > 0, 'outside the booth');
});

test('the title\'s sign hangs where the string of stars begins, at the same depth, so they meet on any screen', () => {
  assert.equal(SIGN.depth, STARS.depth);
  const signRight = SIGN.box[2], cordStart = STARS.box[0];
  assert.ok(cordStart < signRight && signRight - cordStart < 20, 'the cord starts just under the sign\'s right edge');
  assert.ok(SIGN.box[3] < MACHINE.box[1] + 15, 'the sign clear of the machine\'s crest');
  for (const bank of BANKS) assert.ok(bank.depth > 3, 'every bank of snow out on the cobbles');
});

test('on any screen the whole picture shows top to bottom, and the square runs on past what a wide screen or the turn to the house shows', () => {
  const LENS = { span: FRAME.fov, low: FRAME_TALL, high: 64 * DEG }, F = FRAME.width / 2 / Math.tan(FRAME.fov / 2), edge = bearing => FRAME.width / 2 + Math.tan(bearing) * F;
  // (the right edge the house's few things are drawn to, and the left the corner building is: in the picture's pixels)
  const right = Math.min(RIGHT_HOUSE.box[2], STARS.box[2], SKY.box[2], FOREST.box[2]) - 40, left = Math.max(CORNER.box[0], SKY.box[0], FOREST.box[0]) + 40;
  for (const aspect of [1.25, 16 / 10, 16 / 9, 2.1, 21 / 9]) {
    const fov = lens(aspect, LENS), half = halfWidth(fov, aspect);
    assert.ok(fov >= FRAME_TALL - 1e-9, `a screen ${aspect.toFixed(2)} wide sees all the picture's height`);
    assert.ok(edge(half) < right && edge(-half) > left, `a screen ${aspect.toFixed(2)} wide sees no edge of the square`);
    // Turned to the house and drawn in on it (about 19° tall), its right edge still within what is drawn.
    const toHouse = bearing(VIEW.eye, HOUSE.at), drawn = halfWidth(19 * DEG, aspect);
    assert.ok(edge(toHouse + drawn) < right, `turned to the house on a screen ${aspect.toFixed(2)} wide, nothing empty on its right`);
  }
  for (const fir of WINGS.firs) assert.ok(fir.at[1] < -3 && fir.height > 1.4, 'a fir at either side, standing on the cobbles');
});
