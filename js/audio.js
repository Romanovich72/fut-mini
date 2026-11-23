const SOUND_KEY='fut_mini_sound_v1';let soundOn=localStorage.getItem(SOUND_KEY)==='1',audioCtx=null;
function toggleSound(){soundOn=!soundOn;try{localStorage.setItem(SOUND_KEY,soundOn?'1':'0')}catch(e){}$('#soundToggle').textContent=soundOn?'🔊':'🔇';if(soundOn)sfx('click')}
function audioUnlock(){if(!soundOn)return;try{let C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
function sfx(k){if(!soundOn)return;audioUnlock();if(!audioCtx)return;let a={click:[700,.05],pack:[440,.2],kick:[110,.12],receive:[210,.075],miss:[170,.2],whistle:[1400,.35],goal:[520,.5],win:[390,.8]},p=a[k]||a.click,t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=k==='miss'?'sawtooth':'triangle';o.frequency.value=p[0];g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(k==='receive'?.032:.1,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+p[1]);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+p[1])}
document.addEventListener('pointerdown',audioUnlock);document.addEventListener('click',e=>{if(e.target.closest('button,.btn'))sfx('click')});

