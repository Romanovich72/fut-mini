
const GOAL_SECTORS = [195, 270, 345];
let match2dState=null;
function match(){if(!S.next)newOpp();$('#view').innerHTML='<h2>🏟️ Матч в прямом эфире</h2>'+divBar()+'<div class="vs" id="vs">'+vsHtml()+'</div>'+tacticsHtml()+'<section id="contractPanel"></section><div class="match-stage"><canvas id="matchCanvas" width="960" height="540" aria-label="2D трансляция матча"></canvas></div><div class="match-controls"><button class="btn green" id="matchStart" onclick="play()">▶ Играть матч</button><button class="btn" id="speedToggle" onclick="toggleMatchSpeed()">2x Скорость</button><button class="btn" id="skipMatch" onclick="skipMatch()">⏩ Пропустить</button></div><div class="match-events" id="matchEvents">Команды выходят на поле…</div><div class="wins">🏆 Побед всего: '+S.wins+'</div>';offerContracts();drawPitch();}
function addFloatingText(text,x,y,color='#fff',size=24){const m=match2dState;if(!m)return;m.floatingTexts=m.floatingTexts||[];m.floatingTexts.push({text,x,y,color,size,life:1,ttl:1.65})}
function triggerGoalEffect(team){const m=match2dState;if(!m)return;const x=team===0?915:45,y=270,now=performance.now();m.goalEffect={x,y,started:now,duration:1250};m.particles=m.particles||[];for(let i=0;i<34;i++){const a=Math.random()*Math.PI*2,v=65+Math.random()*230,life=.65+Math.random()*.7;m.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-35,life,maxLife:life,color:['#ffe65c','#ff6b2d','#48f7ff','#fff'][i%4],r:2+Math.random()*4})}addFloatingText('ГОООООЛ! 🔥',x,y-35,'#ffe65c',32)}
function updateMatchEffects(){const m=match2dState;if(!m)return;const now=performance.now(),dt=Math.min(.06,Math.max(0,(now-(m.visualTime||now))/1000));m.visualTime=now;for(const f of m.floatingTexts||[]){f.life-=dt;f.y-=24*dt}m.floatingTexts=(m.floatingTexts||[]).filter(f=>f.life>0);for(const p of m.particles||[]){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt}m.particles=(m.particles||[]).filter(p=>p.life>0)}
function drawPitch(){
 const c=document.querySelector('#matchCanvas');if(!c)return;updateMatchEffects();const x=c.getContext('2d'),w=c.width,h=c.height,m=match2dState,now=performance.now();x.clearRect(0,0,w,h);
 for(let i=0;i<8;i++){x.fillStyle=i%2?'#18833d':'#1c9145';x.fillRect(0,i*h/8,w,h/8)}x.strokeStyle='#ffffffbb';x.lineWidth=3;x.strokeRect(18,18,w-36,h-36);x.beginPath();x.moveTo(w/2,18);x.lineTo(w/2,h-18);x.stroke();x.beginPath();x.arc(w/2,h/2,70,0,Math.PI*2);x.stroke();x.strokeRect(18,h*.28,135,h*.44);x.strokeRect(w-153,h*.28,135,h*.44);x.strokeRect(18,h*.39,54,h*.22);x.strokeRect(w-72,h*.39,54,h*.22);
 const pulse=m?.goalEffect?Math.max(0,1-(now-m.goalEffect.started)/m.goalEffect.duration):0;for(const gx of [18,942]){const activePulse=m?.goalEffect&&((gx<100&&m.goalEffect.x<100)||(gx>900&&m.goalEffect.x>900))?pulse:0;x.save();x.translate(gx<100?-activePulse*Math.sin(now*.07)*5:activePulse*Math.sin(now*.07)*5,0);x.strokeStyle=activePulse?'rgba(255,226,74,'+(.5+activePulse*.5)+')':'#fff';x.lineWidth=activePulse?4:3;x.strokeRect(gx+(gx<100?-14:0),205,14,130);x.beginPath();for(let y=214;y<335;y+=18){x.moveTo(gx+(gx<100?-14:0),y);x.lineTo(gx+(gx<100?0:14),y+10)}x.stroke();x.restore()}
 if(pulse){x.save();x.strokeStyle='rgba(0,238,255,'+pulse+')';x.lineWidth=7;x.shadowColor='#00efff';x.shadowBlur=24;x.strokeRect(5,5,w-10,h-10);x.restore()}
 x.fillStyle='#eef';x.font='bold 22px Arial';x.textAlign='center';x.fillText((m?.a||0)+' : '+(m?.b||0)+'    '+Math.min(90,Math.floor(m?.sec||0))+"′",w/2,48);
 if(m){for(const p of m.players){let px=p.x,py=p.y,scale=1;if(p.team===1 && p.gk && m.keyMoment){
    const lean=clamp((now-m.keyMoment.started)/450,0,1);
    py+=16*(m.keyMoment.gkDive-1)*lean;
    if(m.keyMoment.gkDive===1)px-=16*lean;
    x.fillStyle='#fff59e';
    x.font='bold 23px Arial';
    x.fillText(['▲','◆','▼'][m.keyMoment.gkDive],px-24,py-8);
   }
   if(p.gk&&p.jumpUntil>m.sec){const t=clamp(1-(p.jumpUntil-m.sec),0,1),e=Math.sin(t*Math.PI);px+=(p.team?-1:1)*34*e;py+=(p.jumpToY-p.jumpFromY)*e;scale=1+.48*e}x.save();x.translate(px,py);x.scale(scale,scale);x.beginPath();x.fillStyle=p.team?'#ff512f':'#00d9ff';x.shadowColor=p.team?'#ff8a44':'#54f7ff';x.shadowBlur=14;x.arc(0,0,p.gk?19:15,0,Math.PI*2);x.fill();x.shadowBlur=0;x.font=p.gk?'15px Arial':'12px Arial';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#061327';x.fillText(p.role||((p.number||0)+''),0,1);x.restore();x.fillStyle='#fff';x.font='bold 11px Arial';x.textAlign='center';x.fillText(p.name+' '+p.ovr,px,py-22)}
 const carrier=m.players[m.lastTouch];if(carrier&&carrier.skills?.length){x.beginPath();x.strokeStyle='#ffd93b';x.lineWidth=4;x.shadowColor='#ffd93b';x.shadowBlur=22;x.arc(carrier.x,carrier.y,25,0,Math.PI*2);x.stroke();x.shadowBlur=0;x.fillStyle='#ffd93b';x.font='16px Arial';x.fillText(SKILLS[carrier.skills[0]]?.e||'✨',carrier.x+22,carrier.y-20)}
 if(m.ball.trail)m.ball.trail.forEach((pt,i)=>{const flame=m.activeSkill&&['sniper','power','clutch','poacher'].includes(m.activeSkill);x.beginPath();x.fillStyle=flame?'rgba(255,172,34,'+((i+1)/m.ball.trail.length*.45)+')':'rgba(80,245,255,'+((i+1)/m.ball.trail.length*.4)+')';x.arc(pt.x,pt.y,3+i/m.ball.trail.length*6,0,Math.PI*2);x.fill()});x.beginPath();x.fillStyle='#fff';x.shadowColor=m.activeSkill&&['sniper','power','clutch','poacher'].includes(m.activeSkill)?'#ff9d26':'#fff';x.shadowBlur=12;x.arc(m.ball.x,m.ball.y,8,0,Math.PI*2);x.fill();x.shadowBlur=0;if(m.shot){x.strokeStyle='#ffec57';x.lineWidth=5;x.beginPath();x.moveTo(m.ball.x,m.ball.y);x.lineTo(m.shot.x,m.shot.y);x.stroke()}
 if(m.keyMoment){const k=m.keyMoment,remain=clamp((k.deadline-now)/(k.deadline-k.started),0,1);x.save();x.setLineDash([8,8]);x.strokeStyle='rgba(255,236,87,.9)';x.lineWidth=2;x.beginPath();x.moveTo(m.ball.x,m.ball.y);x.lineTo(915,GOAL_SECTORS[k.hoverDir??1]);x.stroke();x.setLineDash([]);GOAL_SECTORS.forEach((y,i)=>{const z=1+Math.sin(now*.012+i)*.16,hot=k.hoverDir===i;x.beginPath();x.fillStyle=hot?'rgba(255,255,120,.5)':'rgba(255,225,70,.2)';x.strokeStyle=hot?'#fff99a':'#ffe65c';x.lineWidth=hot?4:3;x.shadowColor='#ffe65c';x.shadowBlur=hot?25:14;x.ellipse(915,y,20*z,26*z,0,0,Math.PI*2);x.fill();x.stroke();x.beginPath();x.arc(915,y,5,0,Math.PI*2);x.fillStyle='#fff';x.fill()});x.shadowBlur=0;x.beginPath();x.arc(m.ball.x,m.ball.y,21,-Math.PI/2,-Math.PI/2+Math.PI*2*remain);x.strokeStyle='#ffd93b';x.lineWidth=4;x.stroke();x.fillStyle='#fff';x.font='bold 16px Arial';x.fillText((remain*3.5).toFixed(1),m.ball.x,m.ball.y-28);x.restore()}
 for(const p of m.particles||[]){x.globalAlpha=clamp(p.life/p.maxLife,0,1);x.fillStyle=p.color;x.shadowColor=p.color;x.shadowBlur=12;x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fill()}x.globalAlpha=1;x.shadowBlur=0;for(const f of m.floatingTexts||[]){x.globalAlpha=clamp(f.life/f.ttl,0,1);x.fillStyle=f.color;x.shadowColor=f.color;x.shadowBlur=20;x.font='900 '+f.size+'px system-ui,Arial';x.textAlign='center';x.fillText(f.text,f.x,f.y)}x.globalAlpha=1;x.shadowBlur=0}
}
function toggleMatchSpeed(){if(!match2dState)return;match2dState.speed=match2dState.speed===2?1:2;$('#speedToggle').textContent=match2dState.speed===2?'1x Скорость':'2x Скорость'}
function addMatchEvent(text){const e=$('#matchEvents');if(!e)return;const a=match2dState?.eventLog||(match2dState.eventLog=[]);a.unshift(String(text));a.length=4;e.innerHTML=a.map(v=>'<div>'+v+'</div>').join('')}
function makePlayers(){const team=[],names=S.lineup.map(id=>DB[id]).filter(Boolean),xs=[80,205,205,205,360,360,440],ys=[270,115,270,425,190,350,270];for(let i=0;i<7;i++){const c=names[i]||names[names.length-1];team.push({team:0,x:xs[i],y:ys[i],baseX:xs[i],baseY:ys[i],tx:xs[i],ty:ys[i],name:c.n.split(' ').pop(),role:i===0?'🧤':i<=3?'🛡️':i<=5?'⚙️':'⚽',number:i+1,ovr:ovrOf(c),spd:c.st[0],pass:c.st[2],def:c.st[3],shot:c.st[1],gk:i===0,skills:skillsOf(c)})}const oppnames=['Громов','Тигров','Ветров','Огнев','Стрелков','Молниев','Буревестник'];for(let i=0;i<7;i++){let x=960-xs[i],y=ys[i];team.push({team:1,x,y,baseX:x,baseY:y,tx:x,ty:y,name:oppnames[i],role:i===0?'🧤':i<=3?'🛡️':i<=5?'⚙️':'⚽',number:i+1,ovr:S.next.r,spd:S.next.r,pass:S.next.r,def:S.next.r,shot:S.next.r,gk:i===0,skills:[]})}return team}
function play(){if(busy)return;if(S.lineup.some(x=>x==null)){toast('Сначала выставь всех 7 игроков в составе! ⚽');return}busy=true;finished=false;const skills=S.lineup.map(id=>skillsOf(DB[id])).flat(),has=k=>skills.includes(k);let dMod=(has("power")?3:0)+(has("captain")?2:0),atkBonus=(has("sniper")?.08:0)+(has("maestro")?.05:0)+(has("poacher")?.05:0)+(has("engine")?.04:0)+(has("clutch")?.06:0),defBonus=(has("safe")?.15:0)+(has("wall")?.10:0)+(has("reflex")?.10:0)+(has("rock")?.08:0)+(has("tackle")?.06:0),luckBonus=0,used=[];for(const k of Object.keys(S.boosters||{})){while(S.boosters[k]>0&&used.length<3){used.push(k);S.boosters[k]--}if(used.length>=3)break}for(const k of used){if(k==="strike")dMod+=2;else if(k==="shield")defBonus+=.15;else if(k==="luck")luckBonus+=100;else if(k==="speed")dMod+=1;else if(k==="pass")dMod+=1;else if(k==="motivation")dMod+=5}save();const diff=teamRate()-S.next.r+TACTICS[tactic].mod+dMod;match2dState={contractKey:selectedContract,contractDone:0,contractTarget:COACH_CONTRACTS[selectedContract].target,players:makePlayers(),ball:{x:480,y:270,flight:null},a:0,b:0,sec:0,speed:1,shots:0,chanceCount:Math.random()<.5?3:4,nextAction:1.2,keyCount:0,lastTouch:6,diff,atkBonus,defBonus,boostPass:used.includes("pass"),speedBoost:used.includes("speed"),opponent:S.next.r,luckBonus,possessionPasses:0,shot:null,floatingTexts:[],particles:[],done:false};$('#matchStart').disabled=true;$('#skipMatch').disabled=false;$('#speedToggle').disabled=false;$('#speedToggle').textContent='2x Скорость';$('#matchEvents').textContent='0′ — Свисток! Матч начался.';sfx('whistle');showContractProgress(match2dState);startMatchClock(match2dState);bindMatchAim($('#matchCanvas'));
}

function bindMatchAim(canvas){
 const m=match2dState;
 canvas.onpointermove=handleMatchHover;
 canvas.onpointerdown=event=>{
  if(!event.isPrimary || event.button!==0 || !m.keyMoment)return;
  canvas.setPointerCapture(event.pointerId);
  m.pointerStart={id:event.pointerId, point:canvasPoint(event), moment:m.keyMoment};
 };
 canvas.onpointercancel=canvas.onlostpointercapture=()=>{m.pointerStart=null};
 canvas.onpointerup=event=>{
  const start=m.pointerStart;
  if(!start || start.id!==event.pointerId)return;
  m.pointerStart=null;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  if(!m.keyMoment || start.moment!==m.keyMoment)return;
  const end=canvasPoint(event);
  if(Math.hypot(end.x-start.point.x,end.y-start.point.y)>28){
   handleMatchSwipe(start.point,end);
  }else{
   const sector=aimSector(end);
   if(sector!==null)resolveKeyShot(sector);
  }
 };
}
function startMatchClock(m){
 m.timer=setInterval(()=>{
  if(m!==match2dState || m.done)return;
  if(m.keyMoment && performance.now()>=m.keyMoment.deadline)resolveKeyShot(Math.floor(Math.random()*3),true);
  stepMatch();
  m.sec=Math.min(90,m.sec+.14*m.speed*(m.keyMoment?.slowMo ? .25 : 1));
  if(m.sec>=90)endMatch2d();
 },40);
}

function passTo(m,carrier,receiver){
 const dir=carrier.team?-1:1;
 receiver.tx=clamp(receiver.x+dir*15,60,900);
 receiver.ty=clamp(receiver.y+(receiver.y<270?-6:6),55,485);
 const distance=Math.hypot(receiver.tx-m.ball.x,receiver.ty-m.ball.y);
 m.ball.flight={kind:'pass',receiver:m.players.indexOf(receiver),sx:m.ball.x,sy:m.ball.y,
  ex:receiver.tx,ey:receiver.ty,t:0,duration:clamp(distance/(420+carrier.pass*2),.28,.82),arc:16};
 addMatchEvent(Math.floor(m.sec)+'′ — '+carrier.name+' пасует '+receiver.name);
 sfx('kick');
}

function passingOption(m,carrier,candidates){
 const opponents=m.players.filter(p=>p.team!==carrier.team);
 const dir=carrier.team?-1:1;
 let best=null,bestScore=-Infinity;
 for(const p of candidates){
  const space=Math.min(...opponents.map(q=>Math.hypot(q.x-p.x,q.y-p.y)));
  const score=Math.min(140,space)+dir*(p.x-carrier.x)*.32-Math.abs(p.y-carrier.y)*.12;
  if(score>bestScore){best=p;bestScore=score}
 }
 return best;
}

function restartAfterShot(m,shot){
 m.possessionPasses=0;
 m.activeSkill=null;
 m.shot=null;
 if(shot.goal){
  if(shot.team===0){
   advanceContract(m,'goals');
   if(shot.keyMoment)advanceContract(m,'key');
  }
  if(shot.team===0)m.a++;else m.b++;
  addMatchEvent(Math.floor(m.sec)+'′ — ГОЛ! ⚽');
  triggerGoalEffect(shot.team);
  sfx('goal');
  m.lastTouch=shot.team===0?13:6;
  m.ball.x=480;
  m.ball.y=270;
  m.restart='kickoff';
  m.nextAction=m.sec+3.5;
 }else{
  const keeper=shot.goalie;
  m.lastTouch=m.players.indexOf(keeper);
  m.ball.x=keeper.x;
  m.ball.y=keeper.y;
  addMatchEvent(Math.floor(m.sec)+'′ — вратарь спасает! 🧤');
  addFloatingText('СУПЕРСЕЙВ! 🧤',keeper.x,keeper.y-34,'#72f5ff',26);
  sfx('miss');
  m.restart='save';
  m.nextAction=m.sec+1.6;
 }
}

function stepMatch(){
 const m=match2dState;if(!m||m.done)return;
 const dt=.04*m.speed*(m.keyMoment&&m.keyMoment.slowMo?0.25:1),ballX=m.ball.x,ballY=m.ball.y,carrier=m.players[m.lastTouch];
 for(const p of m.players){
  const dir=p.team?-1:1,teamHasBall=!!carrier&&p.team===carrier.team;
  const ballProgress=(ballX-480)*.34;
  const tactical=tactic==='attack'?dir*58:tactic==='defense'?-dir*38:0;
  let tx=p.baseX+ballProgress+tactical,ty=p.baseY+(ballY-270)*(p.gk?.035:.14);
  if(p.gk){tx=p.team?900:60;ty=clamp(ballY,185,355)}
  else if(carrier&&p===carrier){
   const defenders=m.players.filter(q=>q.team!==p.team&&!q.gk).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   const near=defenders[0],goalSide=p.team?60:900;
   const run=clamp(Math.abs(goalSide-p.x)*.62,0,190);
   tx=p.team?clamp(p.x-run,130,220):clamp(p.x+run,740,830);
   if(near){const danger=Math.max(0,1-Math.hypot(near.x-p.x,near.y-p.y)/145);const preferred=p.y<=near.y?-1:1;ty+=preferred*clamp(48* danger,0,48)}
   ty=clamp(ty,65,475);
  }else if(carrier&&p.team!==carrier.team){
   const defenders=m.players.filter(q=>q.team===p.team&&!q.gk).sort((a,b)=>Math.hypot(a.x-ballX,a.y-ballY)-Math.hypot(b.x-ballX,b.y-ballY));
   if(defenders[0]===p){tx=ballX;ty=ballY}
  }else if(teamHasBall&&!p.gk){
   const teammates=m.players.filter(q=>q.team===p.team&&!q.gk&&q!==carrier);
   const support=teammates.sort((a,b)=>Math.abs(a.baseY-carrier.baseY)-Math.abs(b.baseY-carrier.baseY)).slice(0,3).includes(p);
   if(support){tx=clamp(carrier.x+dir*(105+(p.baseX%55)),70,890);ty=clamp(p.baseY+(p.baseY<carrier.y?-65:65),60,480)}
  }
  if(m.restart==='kickoff'){
   tx=p===carrier?480:p.baseX;
   ty=p===carrier?270:p.baseY;
  }else if(m.ball.flight?.kind==='pass' && p===m.players[m.ball.flight.receiver]){
   tx=m.ball.flight.ex;
   ty=m.ball.flight.ey;
  }
  p.tx=clamp(tx,40,920);p.ty=clamp(ty,45,495);
  const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy),baseSpeed=.5+(p.spd+(m.speedBoost?12:0))/110;
  const step=m.restart==="kickoff"?dist*Math.min(1,dt*5):Math.min(dist,baseSpeed*dt*38*Math.min(1,.45+dist/28));
  if(dist>0){p.x+=dx/dist*step;p.y+=dy/dist*step}p.bob=Math.sin(m.sec*.12+p.baseY)*1.6;
 }
 if(m.ball.flight){const f=m.ball.flight;f.t=Math.min(1,f.t+dt/f.duration);const ease=f.t*f.t*(3-2*f.t);m.ball.x=f.sx+(f.ex-f.sx)*ease;m.ball.y=f.sy+(f.ey-f.sy)*ease-Math.sin(f.t*Math.PI)*f.arc;m.ball.trail=m.ball.trail||[];m.ball.trail.push({x:m.ball.x,y:m.ball.y});if(m.ball.trail.length>12)m.ball.trail.shift();if(f.t>=1){m.ball.x=f.ex;m.ball.y=f.ey;m.ball.trail=[];if(f.kind==='pass'){
   const receiver=m.players[f.receiver];
   if(Math.hypot(receiver.x-f.ex,receiver.y-f.ey)<=10){
    m.ball.flight=null;
    m.lastTouch=f.receiver;
    m.possessionPasses++;
    m.nextAction=m.sec+1.4;
    addMatchEvent(Math.floor(m.sec)+'′ — пас принят');
    if(receiver.team===0)advanceContract(m,'passes');
    sfx('receive');
   }
  }else{
   m.ball.flight=null;
   restartAfterShot(m,f);
  }
 }}
 else if(m.restart){
  if(m.restart==='save'){m.ball.x=carrier.x;m.ball.y=carrier.y}
  if(m.sec>=m.nextAction){
   const candidates=m.players.filter(p=>p.team===carrier.team && !p.gk && p!==carrier && p!==m.players[carrier.team?13:6]);
   m.restart=null;
   passTo(m,carrier,passingOption(m,carrier,candidates));
  }
 }
 else if(carrier){const lead=carrier.team?-22:22;m.ball.x+=(carrier.x+lead-m.ball.x)*Math.min(1,dt*9);m.ball.y+=(carrier.y-m.ball.y)*Math.min(1,dt*9);const tackler=m.players.filter(p=>p.team!==carrier.team&&!p.gk).sort((a,b)=>Math.hypot(a.x-carrier.x,a.y-carrier.y)-Math.hypot(b.x-carrier.x,b.y-carrier.y))[0];if(!m.keyMoment&&tackler&&Math.hypot(tackler.x-carrier.x,tackler.y-carrier.y)<24&&Math.random()<(.012+tackler.def/20000)*m.speed){m.nextAction=m.sec+1.3;m.lastTouch=m.players.indexOf(tackler);if(tackler.team===0)advanceContract(m,'tackles');m.possessionPasses=0;addMatchEvent('🛡️ '+tackler.name+' перехватывает мяч');addFloatingText('ПЕРЕХВАТ! 🛡️',tackler.x,tackler.y-30,'#75f6ff',25);sfx('miss')}}
 if(!m.restart && !m.ball.flight && !m.keyMoment && m.sec>=m.nextAction){
  m.nextAction=m.sec+2.6;
  matchAction();
 }
 drawPitch()
}
function matchAction(){
 const m=match2dState;if(!m||m.done||m.keyMoment||m.ball.flight)return;
 const carrier=m.players[m.lastTouch];
 if(!carrier || carrier.gk)return;
 const our=carrier.team===0,dir=our?1:-1,goalZone=our?carrier.x>660:carrier.x<300;
 const skill=carrier.skills?.find(s=>['sniper','maestro','power','clutch','engine','poacher','tackle','rock'].includes(s));
 if(skill&&m.activeSkill!==skill){m.activeSkill=skill;addMatchEvent('✨ '+carrier.name+' активирует '+(SKILLS[skill]?.n||skill));const label={sniper:'СНАЙПЕР 🎯',power:'МОЩЬ 💪',clutch:'КЛАТЧ 🔥',poacher:'ГОЛЕАДОР ⚽'}[skill]||((SKILLS[skill]?.n||skill)+' ✨');addFloatingText(label,carrier.x,carrier.y-28,'#ffe65c',22);sfx('kick')}
 if(goalZone){if(our&&m.keyCount<2&&Math.random()<.42){showKeyMoment(carrier);return}shootNow(our,carrier);return}
 const passes=m.possessionPasses||0;
 if(passes<2){
  const candidates=m.players.filter(p=>p.team===carrier.team&&!p.gk&&p!==carrier&&dir*(p.x-carrier.x)>24);
  const receiver=passingOption(m,carrier,candidates);
  const passChance=clamp(.46+(carrier.pass||50)/300+(m.boostPass?.05:0),.52,.84);
  if(receiver&&Math.random()<passChance){
   passTo(m,carrier,receiver);
  }
 }
}
function showKeyMoment(p){
 const m=match2dState;
 if(!m || m.done || m.keyMoment || m.ball.flight)return;
 if(m.keyCount>=2)return shootNow(true,p);
 m.keyCount++;
 const now=performance.now();
 const moment={p,started:now,deadline:now+3500,slowMo:true,hoverDir:null,gkDive:Math.floor(Math.random()*3)};
 m.keyMoment=moment;
 addFloatingText('ВЫБЕРИ УГОЛ!',810,164,'#ffe65c',23);
}
function resolveKeyShot(direction,automatic=false){
 const m=match2dState, moment=m?.keyMoment;
 if(!moment || m.done)return;
 m.keyMoment=null;
 m.pointerStart=null;
 if(automatic)addMatchEvent('Время вышло — автоудар');
 shootNow(true,moment.p,direction,moment.gkDive);
}
function canvasPoint(e){const c=$('#matchCanvas'),r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}
function aimSector(point){
 if(point.x<640 || point.x>960 || point.y<0 || point.y>540)return null;
 // Boundaries halfway between target centres keep every visible target in its own sector.
 if(point.y<(GOAL_SECTORS[0]+GOAL_SECTORS[1])/2)return 0;
 if(point.y<(GOAL_SECTORS[1]+GOAL_SECTORS[2])/2)return 1;
 return 2;
}
function handleMatchSwipe(a,b){const m=match2dState;if(!m?.keyMoment||Math.hypot(a.x-m.ball.x,a.y-m.ball.y)>88||b.x-a.x<28)return;const dy=b.y-a.y;resolveKeyShot(dy<-24?0:dy>24?2:1)}
function handleMatchHover(event){
 const moment=match2dState?.keyMoment;
 if(moment)moment.hoverDir=aimSector(canvasPoint(event));
}
function keyShot(direction){resolveKeyShot(direction)}
function shootNow(our,p,direction,gkDive){const m=match2dState;if(!m||m.ball.flight)return;direction=direction??1;m.shots++;m.lastTouch=m.players.indexOf(p);m.activeSkill=p.skills?.find(s=>['sniper','power','clutch','poacher'].includes(s))||null;const gx=our?915:45,gy=GOAL_SECTORS[direction]??270,goalie=m.players[our?7:0],dive=gkDive??Math.floor(Math.random()*3);goalie.jumpFromY=goalie.y;goalie.jumpToY=GOAL_SECTORS[dive];goalie.jumpStart=m.sec;goalie.jumpUntil=m.sec+1;const skillBonus=p.skills.includes('power')?.04:0,clutch=p.skills.includes('clutch')?.06:0,bonus=our?(m.atkBonus||0)+skillBonus+clutch:-(m.defBonus||0),baseChance=our?.5+m.diff*.02:.5-m.diff*.02,diveBonus=[-0.25,0.15,0.35][Math.abs(direction-dive)],chance=clamp(baseChance+bonus+diveBonus+(!our&&tactic==="attack"?0.08:0),our?0.12:0.15,our?0.95:0.8),goal=Math.random()<chance;goalie.ty=clamp(goalie.jumpToY,185,355);goalie.jumpDir=dive;m.ball.flight={kind:'shot',sx:m.ball.x,sy:m.ball.y,ex:gx,ey:gy,t:0,duration:.58,arc:50,goal,keyMoment:gkDive!==undefined,team:our?0:1,goalie};m.shot={x:gx,y:gy};sfx('kick')}
function clearMatch2dTimers(m){
 clearInterval(m.timer);
 m.timer=null;
 m.keyMoment=null;
 m.pointerStart=null;
}
function stopMatch2d(){
 if(match2dState)clearMatch2dTimers(match2dState);
 match2dState=null;
 clearMatchTimers();
 cancelPenaltyShootout?.();
 busy=false;
}
function endMatch2d(){
 const m=match2dState;
 if(!m||m.done)return;
 m.done=true;
 clearMatch2dTimers(m);
 addMatchEvent('90′ — Финальный свисток!');
 sfx('whistle');
 drawPitch();
 if(m.a!==m.b){
  finish(m.a,m.b,m.luckBonus);
  return;
 }
 penaltyShootout().then(result=>{
  if(!result||match2dState!==m)return;
  finish(m.a,m.b,m.luckBonus,result);
 });
}
function skipMatch(){const m=match2dState;if(!m||m.done)return;if(m.ball.flight){const f=m.ball.flight;if(f.kind==='shot'&&f.goal){if(f.team===0)m.a++;else m.b++}else if(f.kind==='pass')m.lastTouch=f.receiver;m.ball.flight=null}while(m.shots<m.chanceCount){const our=Math.random()<clamp(.5+m.diff*.02,.25,.75),att=our?m.players.slice(1,7):m.players.slice(8,14),p=att[Math.floor(Math.random()*att.length)];if(!p)break;shootNow(our,p);const f=m.ball.flight;if(f?.kind==='shot'&&f.goal){if(f.team===0)m.a++;else m.b++}m.ball.flight=null}m.sec=90;endMatch2d()}