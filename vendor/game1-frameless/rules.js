"use strict";
// Pure difficulty rules, shared by game.js and tests/flying-rules.test.mjs.
(root=>{
const LANES=[0,1,2,3,4],REACH=2,RATE=.000837;
const WAVES=[...LANES.map(l=>[l]),...LANES.flatMap(a=>LANES.filter(b=>b>a&&!(a===3&&b===4)).map(b=>[a,b]))];
// Climbs quickly at first, then keeps creeping toward a ceiling that is never reached.
const progress=distance=>1-Math.exp(-RATE*Math.max(0,distance));
const speed=(distance,compact)=>compact?145+155*progress(distance):215+215*progress(distance);
// The floor keeps a whole sleigh length, one obstacle and a lane change between two waves.
function interval(distance,compact,span,rand=Math.random){const p=progress(distance),from=compact?2.15:1.85,to=compact?1.25:1.1,floor=(span+120)/speed(distance,compact)+.35;return Math.max(floor,from+(to-from)*p+rand()*(.6-.35*p))}
// A chimney rises from the ground, so it also blocks every lane under its top.
function blocked(wave){return [...new Set(wave.flatMap(l=>l>=3?LANES.filter(n=>n>=l):[l]))]}
function open(wave){const closed=blocked(wave);return LANES.filter(l=>!closed.includes(l))}
const reachable=(from,to)=>from.every(a=>to.some(b=>Math.abs(a-b)<=REACH));
function nextWave(previousOpen,distance,rand=Math.random){const pairs=rand()<Math.max(0,progress(distance)-.25)*.5,pool=WAVES.filter(w=>(w.length===2)===pairs&&reachable(previousOpen,open(w)));return pool[Math.floor(rand()*pool.length)]}
// Gifts sit in front of the coming obstacle, always one lane away from a clear path.
function giftLane(wave,rand=Math.random){const clear=open(wave),pool=blocked(wave).filter(l=>clear.some(c=>Math.abs(c-l)===1));return pool[Math.floor(rand()*pool.length)]}
const giftMilestone=count=>count>0&&count%5===0;
// A record only counts once there is one to beat, and only on the moment it is passed.
const passedRecord=(before,now,record)=>record>0&&before<=record&&now>record;
root.FlightRules={LANES,REACH,WAVES,progress,speed,interval,blocked,open,nextWave,giftLane,giftMilestone,passedRecord};
})(globalThis);
