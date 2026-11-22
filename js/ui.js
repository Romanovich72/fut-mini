function toast(t){const e=document.createElement("div");e.className="toast";e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2300)}
function setCoins(bump){const e=$("#coins");e.textContent="💰 "+S.coins;if(bump){e.classList.remove("bump");void e.offsetWidth;e.classList.add("bump")}}
function confetti(n){for(let i=0;i<n;i++){const d=document.createElement("div");d.className="cf";d.textContent=pick1(["🎉","⭐","✨","⚽","🏆","💥"]);
 d.style.left=Math.random()*100+"vw";d.style.animationDelay=Math.random()*.8+"s";document.body.appendChild(d);setTimeout(()=>d.remove(),3600)}}
function screenFlash(){const d=document.createElement("div");d.className="sf";document.body.appendChild(d);setTimeout(()=>d.remove(),800)}
function card(c){
 const lv=lvlOf(c.id), ovr=ovrOf(c), stars=lv>1?"★".repeat(lv-1):"";
 const tr=trainBonusOf(c);
 return `<div class="card ${rar(c.o)} ${c.s?"son":""}">
  <div class="ovr">${ovr}<small>${c.p}${stars?` <span class="lvlstars">${stars}</span>`:""}${tr?` <span class="lvlstars">+${tr}🏋️</span>`:""}</small></div>
  <div class="face">${c.s?"👑":EM[c.p]}</div>
  ${c.c?`<div class="club">${CLUB_LABEL}</div>`:""}
  <div class="nm">${c.n}</div>
  <div class="st">${c.st.map((v,i)=>`<span><b>${Math.min(99,v+(lv-1))}</b> ${LBL[i]}</span>`).join("")}</div>
  <div class="skl">${skillsOf(c).map(s=>`<span title="${SKILLS[s].n}: ${SKILLS[s].d}">${SKILLS[s].e}</span>`).join("")}</div>
 </div>`;
}
function lockedCard(c){return `<div class="card locked"><div class="face">${c.s?"🌟":"❓"}</div><div class="nm">${c.s?"СЕКРЕТ":"???"}</div><div style="font-size:12px">${RN[rar(c.o)]}</div></div>`}
const TABS=[["shop","🛒 Магазин"],["squad","⚽ Состав"],["match","🏟️ Матч"],["cup","🏆 Кубок"],["train","🏋️ Тренировка"],["coll","📚 Коллекция"],["ach","🏆 Достижения"]];
function go(t){if(busy||trainingOpen)return;clearMatchTimers();tab=t;pulled=null;nav();({shop,squad,match,cup,train,coll,ach})[t]()}
function nav(){$("#nav").innerHTML=TABS.map(([k,n])=>`<button class="${k===tab?"on":""}" onclick="go('${k}')">${n}</button>`).join("")}
function clearMatchTimers(){matchTimers.forEach(t=>clearTimeout(t));matchTimers=[]}
function currentSeason(){return Math.floor(new Date().getMonth()/4)+1}
function seasonName(){return {1:"Легенды 2000-х",2:"Женский футбол",3:"Мемные и дворовые"}[currentSeason()]||"Базовый"}
function seasonBar(){
 const cs=currentSeason();
 const got=DB.filter(c=>c.season===cs&&!c.s&&S.own[c.id]).length;
 const total=DB.filter(c=>c.season===cs&&!c.s).length;
 return `<div class="seasonbar">🗓️ Сезон: <b>${seasonName()}</b> · Собрано карт сезона: <b>${got}/${total}</b></div>`;
}
function checkAch(){
 const newly=[];
 ACHS.forEach(([id,icon,name,desc,target,reward,check])=>{
  if(S.achDone[id])return;
  try{if(check(S)){S.achDone[id]=true;S.coins+=reward;newly.push({id,icon,name,reward});}}catch(e){}
 });
 if(newly.length){
  save();setCoins(true);
  newly.forEach((a,i)=>setTimeout(()=>{toast(`${a.icon} Достижение: ${a.name}! +${a.reward}💰`);confetti(30)},i*600));
  if(tab==="ach")ach();
 }
}
function canDaily(){return S.daily!==new Date().toDateString()}
function claimDaily(){
 if(!canDaily()){toast("Бонус уже получен сегодня! Заходи завтра 😊");return}
 const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
 const wasYesterday=S.daily===yesterday.toDateString();
 const streak=wasYesterday?(S.streak||0)+1:1;
 const reward=[200,300,400,500,700,1000,1500][Math.min(streak-1,6)];
 S.coins+=reward;S.daily=new Date().toDateString();S.streak=streak;
 if(streak>S.bestStreak)S.bestStreak=streak;
 let bonusMsg=`🎁 День ${streak}: +${reward} 💰`;
 if(streak>=7){S.coins+=1000;bonusMsg=`🔥 7 дней подряд! +${reward}💰 и бонус 1000💰`}
 toast(bonusMsg);save();setCoins(true);confetti(40);checkAch();
 setTimeout(()=>shop(),400);
}
function shop(){
 const dailyBtn=canDaily()
  ? `<div style="text-align:center;margin:10px 0"><button class="btn green big" onclick="claimDaily()">🎁 Ежедневный бонус · день ${(S.streak||0)+1}</button></div>`
  : `<div style="text-align:center;margin:10px 0;color:#8fd;font-size:16px">🎁 Бонус получен! Серия: ${S.streak} дн. Заходи завтра</div>`;
 $("#view").innerHTML=`<h2>Выбери пак и открой его! 🔥</h2>${seasonBar()}${dailyBtn}<div class="packs">${Object.entries(PACKS).map(([k,p])=>`<div class="pack ${k}"><div class="pk">${p.e}</div><h3>${p.name}</h3><p>${p.d}</p><button class="btn gold" onclick="openPack('${k}')">${p.price} 💰</button></div>`).join("")}</div><div id="reveal"></div>`;
 if(pulled)showReveal();
}
function currentPool(){const cs=currentSeason();return DB.filter(c=>!c.s && (c.season===0 || c.season===cs))}
function rollCard(P){
 if(!P||!Array.isArray(P.w)||P.w.length!==5||P.w.some(v=>!Number.isFinite(v)||v<0)||P.w.reduce((a,b)=>a+b,0)<=0)return null;
 if(!S.own[SON.id]&&Math.random()<clamp(P.son||0,0,1))return SON;
 const w=P.w,total=w.reduce((a,b)=>a+b,0);let r=Math.random()*total,i=0;
 for(;i<w.length-1;i++){if(r<w[i])break;r-=w[i]}
 const k=["bronze","silver","gold","epic","icon"][i];
 const pool=currentPool();
 const open=pool.filter(c=>rar(c.o)===k && !S.own[c.id]);
 const src=open.length?open:pool.filter(c=>rar(c.o)===k);
 return src.length?pick1(src):null;
}
function openPack(k){sfx("pack");const P=PACKS[k];if(S.coins<P.price){toast("Не хватает монет! 💰 Сыграй матч, чтобы заработать");return}
 S.coins-=P.price;pulled=[];
 for(let i=0;i<P.n;i++){
  const c=rollCard(P);
  if(!c){console.warn("Пустой пул карт для",k);continue}
  let dup=!!S.own[c.id],gain=0;
  if(dup){gain=SELL[rar(c.o)];S.coins+=gain}else S.own[c.id]=1;
  pulled.push({id:c.id,dup,gain});
 }
 S.stats.packs++;
 let gotBooster=null;
 if(Math.random()<BOOSTER_DROP){
  const bkey=pick1(Object.keys(BOOSTERS));
  S.boosters[bkey]=(S.boosters[bkey]||0)+1;
  gotBooster=bkey;
 }
 save();setCoins(true);showReveal();$("#reveal").scrollIntoView({behavior:"smooth"});
 if(gotBooster){setTimeout(()=>toast(`🎁 Выпал бустер: ${BOOSTERS[gotBooster].e} ${BOOSTERS[gotBooster].n}`),1200);confetti(15)}
 checkAch();
}
function showReveal(){$("#reveal").innerHTML=`<h2>Нажимай на карты, чтобы открыть! 👆</h2><div class="row" style="margin-bottom:40px">${pulled.map((x,i)=>`<div class="flip" onclick="flip(this,${i})"><div class="flip-in"><div class="front"><span>⚽</span><b>FUT</b></div><div class="back">${card(DB[x.id])}${x.dup?`<div class="dup">ДУБЛЬ! продан +${x.gain} 💰</div>`:`<div class="new">НОВАЯ КАРТА! ✨</div>`}</div></div></div>`).join("")}</div><div style="text-align:center"><button class="btn" onclick="revealAll()">Открыть все</button></div>`}
function flip(el,i){if(el.classList.contains("open"))return;el.classList.add("open","flash");setTimeout(()=>el.classList.remove("flash"),900);
 const c=DB[pulled[i].id],r=rar(c.o);if(r==="icon"){screenFlash();confetti(c.s?120:60)}else if(r==="epic"){confetti(30)}else if(r==="gold"){confetti(18)}}
function revealAll(){document.querySelectorAll(".flip:not(.open)").forEach((el,j)=>setTimeout(()=>el.click(),j*350))}
function teamRate(){const f=S.lineup.map(id=>Number.isInteger(id)&&DB[id]?DB[id]:null).filter(Boolean);return f.length?f.reduce((a,c)=>a+ovrOf(c),0)/f.length:0}
// ===== ПОЛЕ 7 СЛОТОВ: 3-2-1, без пересечений =====
const XY=[[50,90],[18,65],[50,65],[82,65],[30,38],[70,38],[50,11]];
function squad(){
 const r=teamRate();
 const skills={};
 S.lineup.forEach(id=>{if(id==null)return;skillsOf(DB[id]).forEach(s=>skills[s]=(skills[s]||0)+1)});
 const sklHtml=Object.keys(skills).length?`<div class="sklbox"><h3>🎖️ Навыки команды</h3>${Object.entries(skills).map(([s,n])=>`<div class="sklrow">${SKILLS[s].e} <b>${SKILLS[s].n}</b> ×${n} — ${SKILLS[s].d}</div>`).join("")}</div>`:"";
 const bstEntries=Object.entries(S.boosters||{}).filter(([k,v])=>v>0);
 const bstHtml=`<div class="bstbox"><h3>🎁 Бустеры (до 3 применятся в матче)</h3>${bstEntries.length?bstEntries.map(([k,v])=>`<div class="brow">${BOOSTERS[k].e} <b>${BOOSTERS[k].n}</b> ×${v} — ${BOOSTERS[k].d}</div>`).join(""):`<div class="brow">Нет бустеров. Открой паки!</div>`}</div>`;
 $("#view").innerHTML=`<div class="teamr"><small>${TEAM_EMOJI} ${TEAM_NAME} · ОБЩИЙ РЕЙТИНГ</small><div class="big">${r?Math.round(r):"—"}</div></div><div class="field">${POS.map((p,i)=>{const id=S.lineup[i],c=id!=null?DB[id]:null;
 return `<div class="slot" style="left:${XY[i][0]}%;top:${XY[i][1]}%" onclick="pick(${i})">${c?card(c):`<div class="empty">+<br>${p}</div>`}</div>`}).join("")}</div><p style="text-align:center;color:#8fd">Нажми на позицию, чтобы выбрать игрока или прокачать его</p>${sklHtml}${bstHtml}`;
}
function pick(i){
 const pos=POS[i],used=S.lineup.filter((x,j)=>j!==i&&x!=null);
 const list=DB.filter(c=>c.p===pos&&S.own[c.id]&&!used.includes(c.id)).sort((a,b)=>ovrOf(b)-ovrOf(a));
 $("#mbox").innerHTML=`<h2>Выбери: ${pos} ${EM[pos]}</h2><div class="row">${list.map(c=>`
  <div class="pickcell">
   <div onclick="setP(${i},${c.id})">${card(c)}</div>
   ${lvlOf(c.id)<maxLvlOf(c)?`<button class="btn sm" style="margin-top:6px" onclick="doUp(DB[${c.id}])">⬆️ ур.${lvlOf(c.id)+1} · ${upCost(c)}💰</button>`:`<div style="font-size:12px;color:#8fd;margin-top:6px">★ МАКС</div>`}
  </div>`).join("")||"<p>Нет карточек на эту позицию. Открой паки! 🎁</p>"}</div>
  <div style="text-align:center;margin-top:10px">${S.lineup[i]!=null?`<button class="btn" onclick="setP(${i},null)">Убрать игрока</button> `:""}<button class="btn gold" onclick="closeM()">Закрыть</button></div>`;
 openM();
}
function setP(i,id){S.lineup[i]=id;save();closeM();squad()}
let savedScrollY=0;function openM(){const m=$("#modal");if(m.style.display!=="flex"){savedScrollY=window.scrollY;document.body.style.top=`-${savedScrollY}px`;document.body.classList.add("modal-open")}m.style.display="flex"}function closeM(){if(penaltyOpen||trainingOpen)return;$("#modal").style.display="none";document.body.classList.remove("modal-open");document.body.style.top="";window.scrollTo(0,savedScrollY)}
const TEAMS=["Красные Драконы 🐉","Синие Акулы 🦈","Золотые Орлы 🦅","Чёрные Пантеры 🐆","Огненные Львы 🦁","Ледяные Волки 🐺","Зелёные Ракеты 🚀","Ночные Совы 🦉"];
const SURN=["Громов","Молниев","Тигров","Ветров","Огнев","Стрелков","Буревестников"];
function newOpp(){
 const D=DIVISIONS[S.div];
 const t=pick1(TEAMS),i=t.lastIndexOf(" ");
 const progress=D.req>0 && D.req<999 ? Math.min(1,S.divPoints/D.req) : 0.5;
 const base=D.oppMin + (D.oppMax-D.oppMin)*progress;
 S.next={n:t.slice(0,i),e:t.slice(i+1),r:clamp(Math.round(base+Math.random()*4-2),D.oppMin,D.oppMax)};
 save();
}
function divBar(){
 const D=DIVISIONS[S.div];
 const isFinal=S.div>=DIVISIONS.length-1;
 const pct=isFinal?100:Math.min(100,Math.round(S.divPoints/D.req*100));
 const nextDiv=DIVISIONS[S.div+1];
 let label,subline="";
 if(isFinal){
  label=`${D.em} Дивизион: <b>${D.name}</b> · ФИНАЛ! 🏆`;
 }else{
  label=`${D.em} Дивизион: <b>${D.name}</b> · Очков: <b>${S.divPoints}/${D.req}</b> · +${D.bonus}💰`;
  subline=`<div class="next">Следующий: ${nextDiv.em} ${nextDiv.name} (нужно ${D.req} очков)</div>`;
 }
 return `<div style="text-align:center;margin:6px 0"><div class="divbar">${label}${subline}</div><div class="progress" style="max-width:400px;margin:6px auto"><div style="width:${pct}%"></div></div></div>`;
}
function vsHtml(){return `<div class="tm"><div class="em">${TEAM_EMOJI}</div><b>${TEAM_NAME}</b><div class="rt">${Math.round(teamRate())}</div></div><div class="vsx">VS</div><div class="tm"><div class="em">${S.next.e}</div><b>${S.next.n}</b><div class="rt">${S.next.r}</div></div>`}
function tacticsHtml(){return `<div class="tactics">${Object.entries(TACTICS).map(([k,t])=>`<button class="btn ${k===tactic?'on':''}" onclick="setTactic('${k}')" title="${t.desc}">${t.name}</button>`).join("")}</div>`}

const CUP_ROUNDS=[{n:'1/4 финала',r:64},{n:'Полуфинал',r:76},{n:'Финал',r:89}];
function cup(){let c=S.cup||(S.cup={active:false,stage:0,trophies:0,freePacks:0});let h='<h2>🏆 Кубок самых-самых</h2><p style="text-align:center">Победитель получает 2500 монет, золотой пак и трофей.</p><div class="cup-grid">';for(let i=0;i<3;i++){h+='<div class="cup-step '+(c.active&&i===c.stage?'active':'')+'"><b>'+CUP_ROUNDS[i].n+'</b><br>'+(!c.active&&c.stage<3?'🔒':c.active&&i===c.stage?'▶ Текущий раунд':i<c.stage?'✅ Пройден':'🔒 Впереди')+'<small>Сила '+CUP_ROUNDS[i].r+'</small></div>'+(i<2?'<div class="cup-down">↓</div>':'')}h+='</div><p style="text-align:center">Трофеи: '+(c.trophies||0)+' 🏆</p><div style="text-align:center">'+(c.active?'<button class="btn green" onclick="playCupRound()">Играть раунд</button>':'<button class="btn green" onclick="startCup()">Начать кубок</button>')+(c.freePacks?'<button class="btn gold" onclick="claimCupPack()">Забрать золотой пак</button>':'')+'</div>';$('#view').innerHTML=h}
function startCup(){S.cup={...(S.cup||{}),active:true,stage:0,matchPending:false};save();cup()}
function playCupRound(){let c=S.cup;if(!c||!c.active)return;if(S.lineup.some(x=>x==null)){toast('Сначала собери состав из 7 игроков');return}c.matchPending=true;S.next={n:['Кубковые Волки','Кубковые Титаны','Финальные Легенды'][c.stage],e:['🐺','⚡','👑'][c.stage],r:CUP_ROUNDS[c.stage].r};save();tab='match';nav();match()}
function recordCupResult(win){let c=S.cup;if(!c||!c.active||!c.matchPending)return;c.matchPending=false;if(!win){c.active=false;c.eliminated=true;S.coins+=150;toast('Кубок окончен: утешительный приз +150💰')}else if(++c.stage===3){c.active=false;c.trophies=(c.trophies||0)+1;c.freePacks=1;S.coins+=2500;confetti(90);sfx('win');toast('Кубок выигран! +2500💰, золотой пак и трофей')}save()}
function claimCupPack(){if(!S.cup||!S.cup.freePacks)return;S.coins+=PACKS.gold.price;openPack('gold');S.coins-=PACKS.gold.price;S.cup.freePacks=0;save();setCoins(true);cup()}
function setTactic(k){tactic=k;
 document.querySelectorAll(".tactics .btn").forEach(b=>b.classList.remove("on"));
 const idx=Object.keys(TACTICS).indexOf(k);
 const btns=document.querySelectorAll(".tactics .btn");
 if(btns[idx])btns[idx].classList.add("on");
}
function penaltyShootout(){
 return new Promise(resolve=>{
  penaltyOpen=true;
  let pScore=0,aiScore=0,round=0;
  const dirs=["⬅️","⬆️","➡️"];
  function render(){
   $("#mbox").innerHTML=`<h2>🥅 Серия пенальти!</h2>
    <div class="pen">
     <div class="stat">Ты: <b>${pScore}</b> · Соперник: <b>${aiScore}</b></div>
     <p>Раунд ${round+1} из 3. Куда бьём?</p>
     <div class="dirs">${dirs.map((d,i)=>`<button class="btn big" onclick="window.__pen(${i})">${d}</button>`).join("")}</div>
    </div>`;
   $("#modal").style.display="flex";
  }
  window.__pen=(dir)=>{
   const aiDir=Math.floor(Math.random()*3);
   if(dir!==aiDir)pScore++;
   if(Math.random()<.5)aiScore++;
   round++;
   if(round<3)render();
   else{
    penaltyOpen=false;closeM();
    const win=pScore>aiScore;
    if(win)S.stats.penWins++;
    save();toast(win?"🏆 Победа по пенальти!":"😤 Поражение по пенальти");
    resolve({a:pScore,b:aiScore,win});
   }
  };
  render();
 });
}
function finish(a,b,luckBonus){
 if(finished)return;finished=true;
 clearMatchTimers();
 const win=a>b, isDraw=a===b, base=win?250:isDraw?120:60;
 const divMult=1 + S.div*0.12;
 const lucky=S.lineup.some(id=>id!=null&&skillsOf(DB[id]).includes("lucky"));
 const gain=Math.round(base*TACTICS[tactic].reward*divMult)+(lucky?50:0)+(luckBonus||0);
 S.coins+=gain;
 S.stats.matches++;S.stats.goals+=a;
 if(win){S.stats.wins++;}
 // ===== ОЧКИ ДИВИЗИОНА: победа +3, ничья +1 =====
 if(win){S.wins++;S.divPoints+=3;}
 else if(isDraw){S.divPoints+=1;}
 // проверка повышения
 const D=DIVISIONS[S.div];
 if(S.divPoints>=D.req && S.div<DIVISIONS.length-1){
  S.div++;S.divPoints=0;S.coins+=D.bonus;
  setTimeout(()=>{toast(`🏆 Повышение! Дивизион «${DIVISIONS[S.div].name}» +${D.bonus}💰`);confetti(80)},800);
 }
 if(win){
  S._winStreak=(S._winStreak||0)+1;
  if(S._winStreak>S.bestStreak)S.bestStreak=S._winStreak;
 }else S._winStreak=0;
 newOpp();recordCupResult(win);save();setCoins(true);checkAch();
 const l=document.createElement("div");l.className="ln r";
 const ptsLabel=win?"+3 очк.":isDraw?"+1 очк.":"+0 очк.";
 l.textContent=(win?"🏆 ПОБЕДА! ":isDraw?"🤝 НИЧЬЯ! ":"😤 ПОРАЖЕНИЕ! ")+`+${gain} 💰 · ${ptsLabel}`+(lucky?" 🍀":"")+(luckBonus?" 🎁":"");$("#log").appendChild(l);
 if(win)confetti(90);
 const vs=$("#vs");if(vs)vs.innerHTML=vsHtml();
 const db=document.querySelector(".divbar");if(db)db.parentElement.outerHTML=divBar();
 document.querySelectorAll("#view .btn").forEach(b=>{if(b.textContent.includes("Пропустить"))b.remove()});
 const playBtn=$("#play");if(playBtn){playBtn.disabled=false;playBtn.textContent="▶ Играть ещё"}
 busy=false;
}
function train(){
 const today=new Date().toDateString();if(S.trainToday!==today){S.trainToday=today;S.trainUsed=0;save()}
 trainingOpen=false;
 $("#view").innerHTML=`<h2>🏋️ Тренировка</h2>
 <p style="text-align:center;color:#8fd;margin-bottom:6px">Успешная мини-игра даёт карте <b>+1 к характеристике</b> (макс +5). 3 успешных тренировки в день.</p>
 <p style="text-align:center;color:#ffd93b;font-weight:900">Сегодня: ${(S.trainUsed||0)} / 3</p>
 <div class="train">
  <h3 style="text-align:center;margin:10px 0">Выбери тип тренировки:</h3>
  <div class="trow">
   <div class="tcard"><div class="ic">🥅</div><h3>Пенальти</h3><p>3 удара по движущейся мишени. Точность решает.</p><button class="btn ${(S.trainUsed||0)<3?'green':''}" ${(S.trainUsed||0)>=3?'disabled':''} onclick="startTrain('pen')">Играть</button></div>
   <div class="tcard"><div class="ic">🏃</div><h3>Дриблинг</h3><p>Повтори последовательность стрелок. Ритм решает.</p><button class="btn ${(S.trainUsed||0)<3?'green':''}" ${(S.trainUsed||0)>=3?'disabled':''} onclick="startTrain('drib')">Играть</button></div>
   <div class="tcard"><div class="ic">🧤</div><h3>Сейв</h3><p>Угадай, куда полетит мяч. Реакция решает.</p><button class="btn ${(S.trainUsed||0)<3?'green':''}" ${(S.trainUsed||0)>=3?'disabled':''} onclick="startTrain('save')">Играть</button></div>
  </div>
  <h3 style="text-align:center;margin:14px 0">Выбери карту для тренировки:</h3>
  <div class="row">${S.lineup.filter(id=>id!=null).map(id=>`<div class="pickcell"><div onclick="selectTrainCard(${id})">${card(DB[id])}</div>${trainBonusOf(DB[id])>=5?'<div style="font-size:12px;color:#8fd">★ МАКС тренировок</div>':''}</div>`).join("")}</div>
 </div>`;
}
function selectTrainCard(id){
 const c=DB[id];
 if(trainBonusOf(c)>=5){toast("Эта карта уже прокачана тренировками! ★");return}
 if((S.trainUsed||0)>=3){toast("На сегодня лимит тренировок исчерпан! Заходи завтра");return}
 window.__trainCard=c;
 toast(`Выбрана карта: ${c.n}. Теперь жми тип тренировки!`);
}
function startTrain(kind){
 if((S.trainUsed||0)>=3){toast("На сегодня лимит тренировок исчерпан!");return}
 if(!window.__trainCard){toast("Сначала выбери карту внизу!");return}
 const c=window.__trainCard;
 if(trainBonusOf(c)>=5){toast("Эта карта уже прокачана тренировками!");return}
 trainingOpen=true;
 if(kind==="pen") trainPen(c);
 else if(kind==="drib") trainDrib(c);
 else trainSave(c);
}
function trainSuccess(c){
 const b=S.trainBonus[c.id]||{};
 const cur=trainBonusOf(c);
 if(cur>=5){toast("Карта уже прокачана!");return}
 let idx=Math.floor(Math.random()*4);
 b[idx]=(b[idx]||0)+1;
 S.trainBonus[c.id]=b;
 S.trainUsed=(S.trainUsed||0)+1;
 S.trainToday=new Date().toDateString();
 S.stats.trainOk++;
 save();checkAch();
 toast(`✅ Успех! ${c.n}: ${LBL[idx]} +1 🏋️`);
 confetti(20);
 setTimeout(()=>{trainingOpen=false;train()},600);
}
function trainFail(c){
 S.trainUsed=(S.trainUsed||0)+1;
 S.trainToday=new Date().toDateString();
 save();
 toast(`❌ Неудача. Попытка потрачена.`);
 setTimeout(()=>{trainingOpen=false;train()},600);
}
function trainPen(c){
 let attempts=0,hits=0,timer=null,token=0;
 function step(){const id=++token,pos=15+Math.random()*70,y=15+Math.random()*55;
  $("#mbox").innerHTML="<h2>🥅 Пенальти: "+c.n+"</h2><div class=\'mg\'><div class=\'hint\'>Удар "+(attempts+1)+"/3. Попади в 🎯</div><div class=\'stage\'><div class=\'goal\'></div><div class=\'target\' style=\'left:"+pos+"%;top:"+y+"%;transform:translate(-50%,-50%)\' onclick=\'window.__penHit(true,"+id+")\'>🎯</div></div></div>";openM();
  window.__penHit=(hit,t)=>{if(t!==token||attempts>=3)return;clearTimeout(timer);if(hit)hits++;attempts++;if(attempts<3)timer=setTimeout(step,350);else done()};
  timer=setTimeout(()=>{if(id!==token||attempts>=3)return;attempts++;if(attempts<3)step();else done()},2500)}
 function done(){clearTimeout(timer);token++;trainingOpen=false;closeM();if(hits>=2)trainSuccess(c);else trainFail(c)}
 step()
}
function trainDrib(c){
 let seq=[],input=[],started=false;
 function gen(){seq=[];for(let i=0;i<5;i++)seq.push(Math.floor(Math.random()*4));}
 const arrows=["⬅️","⬆️","➡️","⬇️"];
 function render(){
  const seqHtml=seq.map((v,i)=>{
   if(i<input.length) return `<span class="hit">${arrows[v]}</span>`;
   if(i===input.length) return `<span class="cur">${arrows[v]}</span>`;
   return `<span style="opacity:.3">${arrows[v]}</span>`;
  }).join("");
  $("#mbox").innerHTML=`<h2>🏃 Дриблинг: ${c.n}</h2>
   <div class="mg">
    <div class="hint">Повтори последовательность</div>
    <div class="seq">${seqHtml}</div>
    <div style="margin-top:10px">${arrows.map((a,i)=>`<div class="arrow" onclick="window.__dr(${i})">${a}</div>`).join("")}</div>
    <div style="margin-top:10px;color:#8fd">${input.length}/${seq.length}</div>
   </div>`;
  $("#modal").style.display="flex";
 }
 window.__dr=(i)=>{
  if(!started){started=true}
  if(i===seq[input.length]){input.push(i);render();if(input.length===seq.length){closeM();trainingOpen=false;trainSuccess(c)}}
  else{closeM();trainingOpen=false;trainFail(c)}
 };
 gen();render();
}
function trainSave(c){
 let rounds=0,hits=0;
 function step(){
  $("#mbox").innerHTML=`<h2>🧤 Сейв: ${c.n}</h2>
   <div class="mg">
    <div class="hint">Раунд ${rounds+1}/3. Угадай направление</div>
    <div class="stage" id="stage">
     <div class="goal"></div>
     <div style="position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);font-size:40px">⚽</div>
     <div style="position:absolute;left:50%;top:85%;transform:translate(-50%,-50%);font-size:36px">🧤</div>
    </div>
    <div style="margin-top:10px">${["⬅️","⬆️","➡️"].map((d,i)=>`<button class="btn big" onclick="window.__sv(${i})">${d}</button>`).join("")}</div>
   </div>`;
  $("#modal").style.display="flex";
  window.__sv=(i)=>{
   const truth=Math.floor(Math.random()*3);
   if(i===truth)hits++;
   rounds++;
   if(rounds<3)setTimeout(step,300);
   else{closeM();trainingOpen=false;if(hits>=2)trainSuccess(c); else trainFail(c)}
  };
 }
 step();
}
function coll(){
 const all=[...DB].sort((x,y)=>ovrOf(y)-ovrOf(x)),have=all.filter(c=>S.own[c.id]).length;
 const byRar={};
 all.forEach(c=>{const r=rar(c.o);byRar[r]=byRar[r]||{t:0,h:0};byRar[r].t++;if(S.own[c.id])byRar[r].h++});
 $("#view").innerHTML=`<h2>Собрано: ${have} из ${DB.length}</h2>
  ${seasonBar()}
  <div class="row" style="margin-bottom:10px;font-size:15px;color:#8fd">
   ${Object.entries(byRar).map(([r,v])=>`<span>${RN[r]}: ${v.h}/${v.t}</span>`).join(" · ")}
  </div>
  <div class="row">${all.map(c=>S.own[c.id]?card(c):lockedCard(c)).join("")}</div>`;
}
function ach(){
 const items=ACHS.map(([id,icon,name,desc,target,reward,check])=>{
  const done=!!S.achDone[id];
  let prog=0;
  try{prog=check(S)?target:Math.min(target,getProg(id,S))}catch(e){}
  const pct=Math.min(100,Math.round(prog/target*100));
  return `<div class="aitem ${done?"done":""}">
   <div class="icon">${icon}</div>
   <div class="info"><b>${name}</b><div class="desc">${desc}</div>
    ${!done?`<div class="prog"><div style="width:${pct}%"></div></div>`:""}
   </div>
   <div class="rw">${done?"✅":`+${reward}💰`}</div>
  </div>`;
 }).join("");
 $("#view").innerHTML=`<h2>🏆 Достижения</h2><div class="ach">${items}</div>`;
}
function getProg(id,S){
 switch(id){
  case "first_goal":case "goal_10":case "goal_50":return S.stats.goals;
  case "win_3":return S.bestStreak;
  case "win_10":return S.stats.wins;
  case "div_2":return Math.min(S.div,1);
  case "div_5":return Math.min(S.div,6);
  case "div_8":return Math.min(S.div,7);
  case "pen_win":return S.stats.penWins;
  case "collect_30":case "collect_80":case "collect_130":return DB.filter(c=>S.own[c.id]).length;
  case "up_5":return Object.values(S.lvl).some(v=>v>=5)?1:0;
  case "epic_10":return DB.filter(c=>!c.s&&rar(c.o)==="epic"&&S.own[c.id]).length;
  case "daily_7":return S.streak;
  case "pack_10":return S.stats.packs;
  case "season_1":return seasonCollected(S);
  case "train_3":case "train_10":return S.stats.trainOk;
 }
 return 0;
}
function resetAll(){if(confirm("Точно начать заново? Все монеты и карточки пропадут!")){clearMatchTimers();trainingOpen=false;S=fresh();save();go("shop");setCoins()}}

// Boot the menu independently of the optional match engine. All classic scripts are loaded in document order.
document.addEventListener("DOMContentLoaded",function(){try{S=load();setCoins();nav();shop();const soundButton=document.querySelector("#soundToggle");if(soundButton)soundButton.textContent=soundOn?"🔊":"🔇";if(window.__badSave)toast("⚠️ Сохранение повреждено; исходная копия сохранена отдельно")}catch(error){console.error("FUT Mini startup failed",error);const view=document.querySelector("#view");if(view)view.textContent="Не удалось запустить игру. Обновите страницу или проверьте файлы JavaScript."}},{once:true});
