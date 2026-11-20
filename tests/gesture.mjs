// Checks that open / closed hands are told apart:  node tests/gesture.mjs
import { GestureMapper } from '../js/input/GestureMapper.js';
import { CONFIG } from '../js/config.js';

const make = (tipY) => {
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.7, z: 0 }));
  lm[0] = { x: 0.5, y: 0.8, z: 0 };                       // wrist
  for (const i of [5, 9, 13, 17]) lm[i] = { x: 0.5, y: 0.6, z: 0 }; // knuckles
  for (const i of [8, 12, 16, 20]) lm[i] = { x: 0.5, y: tipY, z: 0 }; // fingertips
  return lm;
};

const m = new GestureMapper(CONFIG.hand);
let t = 0, s;
for (let i = 0; i < 30; i++) s = m.update(make(0.35), (t += 33));
console.log('open  ratio', s.ratio.toFixed(2), 'closed =', s.closed);
const openOk = s.closed === false;
for (let i = 0; i < 30; i++) s = m.update(make(0.68), (t += 33));
console.log('fist  ratio', s.ratio.toFixed(2), 'closed =', s.closed);
const fistOk = s.closed === true;
for (let i = 0; i < 30; i++) s = m.update(make(0.35), (t += 33));
console.log('open again  closed =', s.closed);
const ok = openOk && fistOk && s.closed === false;
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
