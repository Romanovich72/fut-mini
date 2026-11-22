function seasonCollected(s){return DB.filter(c=>c.season===currentSeason()&&!c.s&&s.own[c.id]).length}
const KEY="fut_mini_v1";
let S=null, tab="shop", pulled=null, busy=false;
let tactic="balance", finished=false, matchTimers=[], penaltyOpen=false, trainingOpen=false;
function fresh(){
 const st=[
  byName("Дворовый Вратарь"),byName("Дворовый Защитник"),byName("Литвинов"),byName("Стена из 5Б"),
  byName("Дворовый Полузащитник"),byName("Сосед Вася"),byName("Дворовый Нападающий")
 ];
 const own={};st.forEach(i=>own[i]=1);
 return{
  coins:1000,own,lineup:st,wins:0,next:null,lvl:{},div:0,divPoints:0,daily:"",streak:0,cup:{active:false,stage:0,trophies:0,freePacks:0},
  season:0,
  stats:{goals:0,wins:0,penWins:0,collected:0,packs:0,matches:0,trainOk:0},
  achDone:{},bestStreak:0,
  trainToday:"",trainUsed:0,trainBonus:{},
  boosters:{}
 };
}
function load(){const d=fresh();try{const raw=localStorage.getItem(KEY);if(!raw)return d;const x=JSON.parse(raw);if(!x||typeof x!=='object'||Array.isArray(x)||!x.own||typeof x.own!=='object')throw Error('bad save');const n=(v,f,min=0,max=1e9)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):f;const own={};for(const k of Object.keys(x.own)){const id=+k;if(Number.isInteger(id)&&id>=0&&id<DB.length&&x.own[k])own[id]=1}if(!Object.keys(own).length)throw Error('no cards');const stats={...d.stats,...(x.stats||{})};for(const k of Object.keys(d.stats))stats[k]=n(stats[k],0);const lvl={};if(x.lvl&&typeof x.lvl==='object')for(const[k,v]of Object.entries(x.lvl)){const id=+k;if(Number.isInteger(id)&&id>=0&&id<DB.length)lvl[id]=n(v,1,1,20)}const today=new Date().toDateString();let trainToday=typeof x.trainToday==='string'?x.trainToday:'',trainUsed=n(x.trainUsed,0,0,3);if(trainToday!==today){trainToday=today;trainUsed=0}const lineup=Array.from({length:7},(_,i)=>{const id=Array.isArray(x.lineup)?x.lineup[i]:null;return Number.isInteger(id)&&id>=0&&id<DB.length&&own[id]?id:d.lineup[i]});const z={...d,...x,cup:(()=>{let c=x.cup;if(!c||typeof c!=='object')return d.cup;return {active:!!c.active,stage:n(c.stage,0,0,3),trophies:n(c.trophies,0),freePacks:n(c.freePacks,0,0,1),matchPending:!!c.matchPending}})(),own,lineup,lvl,stats,trainToday,trainUsed,coins:n(x.coins,d.coins),wins:n(x.wins,0),div:n(x.div,0,0,DIVISIONS.length-1),divPoints:n(x.divPoints,x.divWins?n(x.divWins,0)*3:0),streak:n(x.streak,0),bestStreak:n(x.bestStreak,0),daily:typeof x.daily==='string'?x.daily:'',achDone:x.achDone&&typeof x.achDone==='object'?x.achDone:{},trainBonus:x.trainBonus&&typeof x.trainBonus==='object'?x.trainBonus:{},boosters:x.boosters&&typeof x.boosters==='object'?x.boosters:{},next:x.next&&typeof x.next==='object'?x.next:null};if(z.next)z.next.r=n(z.next.r,60,0,120);return z}catch(e){try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+'_corrupt_'+Date.now(),raw)}catch(_){}window.__badSave=true;return d}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){if(!window.__saveWarned){window.__saveWarned=true;setTimeout(()=>toast("⚠️ Не удалось сохранить прогресс"),0)}return false}}
const $=s=>document.querySelector(s), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), pick1=a=>a[Math.floor(Math.random()*a.length)];
const lvlOf=id=>S.lvl[id]||1;
function trainBonusOf(c){const b=S.trainBonus[c.id]||{};return Math.min(5,Object.values(b).reduce((s,v)=>s+v,0))}
const ovrOf=c=>c.o+(lvlOf(c.id)-1)+trainBonusOf(c);
function doUp(c){
 const ml=maxLvlOf(c);
 if(lvlOf(c.id)>=ml){toast(`Максимум для ${RN[rar(c.o)]}! ⭐`);return}
 if(S.coins<upCost(c)){toast(`Не хватает монет! Нужно ${upCost(c)}💰`);return}
 S.coins-=upCost(c);S.lvl[c.id]=lvlOf(c.id)+1;save();setCoins(true);
 confetti(20);toast(`${c.n} → уровень ${lvlOf(c.id)}! ⬆️`);
 checkAch();
 if(tab==="coll")coll();
 else if(tab==="squad"){closeM();squad();}
 else if(tab==="match"){closeM();match();}
}
function skillsOf(c){
 const out=[BASE_SKILL[c.p]];
 if(lvlOf(c.id)>=3 && UNIQUE_SKILL[c.n]) out.push(UNIQUE_SKILL[c.n]);
 if(lvlOf(c.id)>=5) out.push("captain");
 return [...new Set(out)];
}
