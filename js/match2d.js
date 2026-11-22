
let match2dState=null;
function match(){if(!S.next)newOpp();$('#view').innerHTML='<h2>🏟️ Матч в прямом эфире</h2>'+divBar()+'<div class="vs" id="vs">'+vsHtml()+'</div>'+tacticsHtml()+'<div class="match-stage"><canvas id="matchCanvas" width="960" height="540" aria-label="2D трансляция матча"></canvas></div><div class="match-controls"><button class="btn green" id="matchStart" onclick="play()">▶ Играть матч</button><button class="btn" id="speedToggle" onclick="toggleMatchSpeed()">2x Скорость</button><button class="btn" id="skipMatch" onclick="skipMatch()">⏩ Пропустить</button></div><div class="match-events" id="matchEvents">Команды выходят на поле…</div><div class="wins">🏆 Побед всего: '+S.wins+'</div>';drawPitch();}
function drawPitch(){const c=document.querySelector('#matchCanvas');if(!c)return;const x=c.getContext('2d'),w=c.width,h=c.height;x.clearRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=i%2?'#18833d':'#1c9145';x.fillRect(0,i*h/8,w,h/8)}x.strokeStyle='#ffffffbb';x.lineWidth=3;x.strokeRect(18,18,w-36,h-36);x.beginPath();x.moveTo(w/2,18);x.lineTo(w/2,h-18);x.stroke();x.beginPath();x.arc(w/2,h/2,70,0,Math.PI*2);x.stroke();x.strokeRect(18,h*.28,135,h*.44);x.strokeRect(w-153,h*.28,135,h*.44);x.strokeRect(18,h*.39,54,h*.22);x.strokeRect(w-72,h*.39,54,h*.22);x.fillStyle='#eef';x.font='bold 22px Arial';x.textAlign='center';x.fillText((match2dState?.a||0)+' : '+(match2dState?.b||0)+'    '+Math.min(90,Math.floor(match2dState?.sec||0))+"′",w/2,48);if(match2dState){for(const p of match2dState.players){x.beginPath();x.fillStyle=p.team?'#ff512f':'#00d9ff';x.shadowColor=p.team?'#ff8a44':'#54f7ff';x.shadowBlur=14;x.arc(p.x,p.y,p.gk?19:15,0,7);x.fill();x.shadowBlur=0;x.fillStyle='#fff';x.font='bold 11px Arial';x.fillText(p.name+' '+p.ovr,p.x,p.y-22)}const carrier=match2dState.players[match2dState.lastTouch];if(carrier&&carrier.skills?.length){x.beginPath();x.strokeStyle='#ffd93b';x.lineWidth=4;x.shadowColor='#ffd93b';x.shadowBlur=22;x.arc(carrier.x,carrier.y,25,0,7);x.stroke();x.shadowBlur=0;x.fillStyle='#ffd93b';x.font='16px Arial';x.fillText(SKILLS[carrier.skills[0]]?.e||'✨',carrier.x+22,carrier.y-20)}if(match2dState.ball.trail){match2dState.ball.trail.forEach((pt,i)=>{x.beginPath();x.fillStyle='rgba(80,245,255,'+((i+1)/match2dState.ball.trail.length*.35)+')';x.arc(pt.x,pt.y,3+(i/match2dState.ball.trail.length)*5,0,7);x.fill()})}x.beginPath();x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=8;x.arc(match2dState.ball.x,match2dState.ball.y,8,0,7);x.fill();x.shadowBlur=0;if(match2dState.shot){x.strokeStyle='#ffec57';x.lineWidth=5;x.beginPath();x.moveTo(match2dState.ball.x,match2dState.ball.y);x.lineTo(match2dState.shot.x,match2dState.shot.y);x.stroke()}}}
function toggleMatchSpeed(){if(!match2dState)return;match2dState.speed=match2dState.speed===2?1:2;$('#speedToggle').textContent=match2dState.speed===2?'1x Скорость':'2x Скорость'}
function addMatchEvent(text){const e=$('#matchEvents');if(!e)return;const a=match2dState?.eventLog||(match2dState.eventLog=[]);a.unshift(String(text));a.length=4;e.innerHTML=a.map(v=>'<div>'+v+'</div>').join('')}
function makePlayers(){const team=[],names=S.lineup.map(id=>DB[id]).filter(Boolean),xs=[80,205,205,205,360,360,440],ys=[270,115,270,425,190,350,270];for(let i=0;i<7;i++){const c=names[i]||names[names.length-1];team.push({team:0,x:xs[i],y:ys[i],baseX:xs[i],baseY:ys[i],tx:xs[i],ty:ys[i],name:c.n.split(' ').pop(),ovr:ovrOf(c),spd:c.st[0],pass:c.st[2],def:c.st[3],shot:c.st[1],gk:i===0,skills:skillsOf(c)})}const oppnames=['Громов','Тигров','Ветров','Огнев','Стрелков','Молниев','Буревестник'];for(let i=0;i<7;i++){let x=520+xs[i]*.9,y=ys[i];team.push({team:1,x,y,baseX:x,baseY:y,tx:x,ty:y,name:oppnames[i],ovr:S.next.r,spd:S.next.r,pass:S.next.r,def:S.next.r,shot:S.next.r,gk:i===0,skills:[]})}return team}
function play(){if(S.lineup.some(x=>x==null)){toast('Сначала выставь всех 7 игроков в составе! ⚽');return}busy=true;finished=false;const skills=S.lineup.map(id=>skillsOf(DB[id])).flat(),has=k=>skills.includes(k);let dMod=(has("power")?3:0)+(has("captain")?2:0),atkBonus=(has("sniper")?.08:0)+(has("maestro")?.05:0)+(has("poacher")?.05:0)+(has("engine")?.04:0)+(has("clutch")?.06:0),defBonus=(has("safe")?.15:0)+(has("wall")?.10:0)+(has("reflex")?.10:0)+(has("rock")?.08:0)+(has("tackle")?.06:0),luckBonus=0,used=[];for(const k of Object.keys(S.boosters||{})){while(S.boosters[k]>0&&used.length<3){used.push(k);S.boosters[k]--}if(used.length>=3)break}for(const k of used){if(k==="strike")dMod+=2;else if(k==="shield")defBonus+=.15;else if(k==="luck")luckBonus+=100;else if(k==="speed")dMod+=1;else if(k==="pass")dMod+=1;else if(k==="motivation")dMod+=5}save();const diff=teamRate()-S.next.r+TACTICS[tactic].mod+dMod;match2dState={players:makePlayers(),ball:{x:480,y:270,flight:null},a:0,b:0,sec:0,speed:1,events:0,shots:0,chanceCount:Math.random()<.5?3:4,nextAction:1.2,keyCount:0,lastTouch:6,diff,atkBonus,defBonus,boostPass:used.includes("pass"),speedBoost:used.includes("speed"),opponent:S.next.r,luckBonus,possessionPasses:0,shot:null,done:false};$('#matchStart').disabled=true;$('#matchEvents').textContent='0′ — Свисток! Матч начался.';sfx('whistle');match2dState.timer=setInterval(()=>stepMatch(),40);match2dState.clock=setInterval(()=>{if(!match2dState||match2dState.done)return;match2dState.sec+=.14*match2dState.speed;if(match2dState.sec>=90){endMatch2d()}},40);const c=$('#matchCanvas');c.onclick=e=>handleMatchAim(e);c.ontouchstart=e=>{match2dState.touch={x:e.touches[0].clientX,y:e.touches[0].clientY}};c.ontouchend=e=>{if(match2dState.touch){let dx=e.changedTouches[0].clientX-match2dState.touch.x;let r=c.getBoundingClientRect();handleMatchAim({clientX:dx>0?r.right-35:r.left+35,clientY:e.changedTouches[0].clientY});match2dState.touch=null}}}
function stepMatch(){
 const m=match2dState;if(!m||m.done)return;
 const dt=.04*m.speed,ballX=m.ball.x,ballY=m.ball.y,carrier=m.players[m.lastTouch];
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
  p.tx=clamp(tx,40,920);p.ty=clamp(ty,45,495);
  const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy),baseSpeed=.5+(p.spd+(m.speedBoost?12:0))/110;
  const step=Math.min(dist,baseSpeed*dt*38*Math.min(1,.45+dist/28));
  if(dist>0){p.x+=dx/dist*step;p.y+=dy/dist*step}p.bob=Math.sin(m.sec*.12+p.baseY)*1.6;
 }
 if(m.ball.flight){const f=m.ball.flight;f.t=Math.min(1,f.t+dt/f.duration);const ease=f.t*f.t*(3-2*f.t);m.ball.x=f.sx+(f.ex-f.sx)*ease;m.ball.y=f.sy+(f.ey-f.sy)*ease-Math.sin(f.t*Math.PI)*f.arc;m.ball.trail=m.ball.trail||[];m.ball.trail.push({x:m.ball.x,y:m.ball.y});if(m.ball.trail.length>12)m.ball.trail.shift();if(f.t>=1){m.ball.x=f.ex;m.ball.y=f.ey;m.ball.trail=[];const kind=f.kind;m.ball.flight=null;if(kind==='pass'){const oldTeam=m.players[m.lastTouch]?.team;m.lastTouch=f.receiver;m.possessionPasses=oldTeam===m.players[f.receiver]?.team?(m.possessionPasses||0)+1:1;addMatchEvent(Math.floor(m.sec)+"′ — пас принят")}else if(kind==='shot'){if(f.goal){if(f.team===0)m.a++;else m.b++;addMatchEvent(Math.floor(m.sec)+"′ — ГОЛ! ⚽");sfx('goal')}else{addMatchEvent(Math.floor(m.sec)+"′ — вратарь спасает! 🧤");sfx('miss')}f.goalie.tx=f.goalie.team?900:60;f.goalie.ty=clamp(f.ey,55,485);m.shot=null;drawPitch()}}}
 else if(carrier){const lead=carrier.team?-22:22;m.ball.x+=(carrier.x+lead-m.ball.x)*Math.min(1,dt*9);m.ball.y+=(carrier.y-m.ball.y)*Math.min(1,dt*9);const tackler=m.players.filter(p=>p.team!==carrier.team&&!p.gk).sort((a,b)=>Math.hypot(a.x-carrier.x,a.y-carrier.y)-Math.hypot(b.x-carrier.x,b.y-carrier.y))[0];if(tackler&&Math.hypot(tackler.x-carrier.x,tackler.y-carrier.y)<24&&Math.random()<(.012+tackler.def/20000)*m.speed){m.lastTouch=m.players.indexOf(tackler);m.possessionPasses=0;addMatchEvent('🛡️ '+tackler.name+' перехватывает мяч');sfx('miss')}}
 if(m.sec>=m.nextAction&&m.events<22){m.events++;m.nextAction+=2.6;matchAction()}drawPitch()
}
function matchAction(){
 const m=match2dState;if(!m||m.done||m.ball.flight)return;
 let carrier=m.players[m.lastTouch];if(!carrier||carrier.gk){const active=m.players.filter(p=>!p.gk);carrier=active.sort((a,b)=>Math.hypot(a.x-m.ball.x,a.y-m.ball.y)-Math.hypot(b.x-m.ball.x,b.y-m.ball.y))[0];if(!carrier)return;m.lastTouch=m.players.indexOf(carrier);m.possessionPasses=0}
 const our=carrier.team===0,dir=our?1:-1,goalZone=our?carrier.x>660:carrier.x<300;
 const skill=carrier.skills?.find(s=>['sniper','maestro','power','clutch','engine','poacher','tackle','rock'].includes(s));
 if(skill&&m.activeSkill!==skill){m.activeSkill=skill;addMatchEvent('✨ '+carrier.name+' активирует '+(SKILLS[skill]?.n||skill));sfx('kick')}
 if(goalZone&&m.shots<m.chanceCount){if(our&&m.keyCount<2&&Math.random()<.42){showKeyMoment(carrier);return}shootNow(our,carrier);return}
 const passes=m.possessionPasses||0;
 if(passes<2){
  const candidates=m.players.filter(p=>p.team===carrier.team&&!p.gk&&p!==carrier&&dir*(p.x-carrier.x)>24);
  candidates.sort((a,b)=>{
   const score=p=>dir*(p.x-carrier.x)*.72-Math.abs(p.y-carrier.y)*.22+((p.pass||50)-(carrier.pass||50))*.18+Math.random()*12;
   return score(b)-score(a)
  });
  const receiver=candidates[0];
  const passChance=clamp(.46+(carrier.pass||50)/300+(m.boostPass?.05:0),.52,.84);
  if(receiver&&Math.random()<passChance){
   const leadX=clamp(receiver.x+dir*32,60,900),leadY=clamp(receiver.y+(carrier.y<receiver.y?18:-18),55,485);
   m.ball.flight={kind:'pass',sx:m.ball.x,sy:m.ball.y,ex:leadX,ey:leadY,t:0,duration:clamp(.52-(carrier.pass||50)/500,.26,.44),arc:20,receiver:m.players.indexOf(receiver)};
   addMatchEvent(Math.floor(m.sec)+'′ — '+carrier.name+' пасует '+receiver.name);sfx('kick');return
  }
 }
 // At the edge of the final third, carry the ball closer before attempting a shot.
 if(goalZone&&m.shots<m.chanceCount)shootNow(our,carrier);
}
function showKeyMoment(p){const m=match2dState;if(m.keyCount>=2)return shootNow(true,p);m.keyCount++;const wrap=document.querySelector('.match-stage'),overlay=document.createElement('div');overlay.className='key-overlay';overlay.innerHTML='<b>⚡ КЛЮЧЕВОЙ МОМЕНТ</b><br><span>Нажми на угол ворот за 3,5 секунды!</span><div style="margin-top:8px"><button class="btn sm" onclick="keyShot(0)">◀</button> <button class="btn sm" onclick="keyShot(1)">▲</button> <button class="btn sm" onclick="keyShot(2)">▶</button></div>';wrap.appendChild(overlay);m.keyPlayer=p;m.keyTimer=setTimeout(()=>{overlay.remove();shootNow(true,p)},3500)}
function handleMatchAim(e){const m=match2dState;if(m?.keyPlayer){const r=$('#matchCanvas').getBoundingClientRect(),x=(e.clientX-r.left)/r.width;if(x<.4)keyShot(0);else if(x>.6)keyShot(2);else keyShot(1)}}function keyShot(d){const m=match2dState;if(!m?.keyPlayer)return;clearTimeout(m.keyTimer);document.querySelector('.key-overlay')?.remove();let p=m.keyPlayer;m.keyPlayer=null;shootNow(true,p,d)}
function shootNow(our,p,direction){const m=match2dState;if(!m||m.ball.flight)return;m.shots++;m.lastTouch=m.players.indexOf(p);m.activeSkill=p.skills?.find(s=>['sniper','power','clutch','poacher'].includes(s))||null;const gx=our?900:60,gy=direction===0?95:direction===2?445:270,goalie=m.players[our?7:0],attack=our?p.shot:m.opponent,def=our?m.opponent:p.def;const skillBonus=p.skills.includes('power')?.04:0,clutch=p.skills.includes('clutch')?.06:0,bonus=our?(m.atkBonus||0)+skillBonus+clutch:-(m.defBonus||0);const baseChance=our?.5+m.diff*.02:.5-m.diff*.02, chance=clamp(baseChance+bonus,our?.25:.15,our?.88:.8),goal=Math.random()<chance;goalie.ty=gy+(Math.random()-.5)*24;goalie.jumpUntil=m.sec+1;m.ball.flight={kind:'shot',sx:m.ball.x,sy:m.ball.y,ex:gx,ey:gy,t:0,duration:.58,arc:50,goal,team:our?0:1,goalie};m.shot={x:gx,y:gy};sfx('kick')}

function endMatch2d(){const m=match2dState;if(!m||m.done)return;m.done=true;clearInterval(m.timer);clearInterval(m.clock);clearTimeout(m.keyTimer);addMatchEvent('90′ — Финальный свисток!');sfx('whistle');busy=false;if(m.a===m.b)penaltyShootout().then(r=>finish(r.win?m.a+1:m.a,m.b+(r.win?0:1),m.luckBonus));else finish(m.a,m.b,m.luckBonus)}
function skipMatch(){const m=match2dState;if(!m||m.done)return;if(m.ball.flight){const f=m.ball.flight;if(f.kind==='shot'&&f.goal){if(f.team===0)m.a++;else m.b++}else if(f.kind==='pass')m.lastTouch=f.receiver;m.ball.flight=null}while(m.shots<m.chanceCount){const our=Math.random()<clamp(.5+m.diff*.02,.25,.75),att=our?m.players.slice(1,7):m.players.slice(8,14),p=att[Math.floor(Math.random()*att.length)];if(!p)break;shootNow(our,p);const f=m.ball.flight;if(f?.kind==='shot'&&f.goal){if(f.team===0)m.a++;else m.b++}m.ball.flight=null}m.sec=90;endMatch2d()}