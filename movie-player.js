(function(){
'use strict';
const $=id=>document.getElementById(id),video=$('video'),screen=$('screen'),movies=(window.ALLEND_MOVIES||[]).filter(m=>m&&m.id&&m.url);
const id=new URLSearchParams(location.search).get('id');let movie=movies.find(m=>m.id===id);
if(!movie){$('status').textContent='Movie not found or no source configured.';return}
let timer=null,countdown=null,remaining=10,queue=[],shuffle=true,loop=false,lastSave=0,position=0;
const fmt=n=>!Number.isFinite(n)?'0:00':Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
const key=()=> 'allend-movie-progress-'+movie.id;
function save(){if(video.currentTime>0&&Number.isFinite(video.currentTime))try{localStorage.setItem(key(),String(video.currentTime))}catch(e){}}
function showControls(){screen.classList.remove('controls-hidden');clearTimeout(timer);if(!video.paused)timer=setTimeout(()=>{if(!video.paused){const a=document.activeElement;if(a&&screen.contains(a)&&a.blur)a.blur();screen.classList.add('controls-hidden')}},3200)}
function settle(){const a=document.activeElement;if(a&&screen.contains(a)&&a.blur)a.blur();showControls()}
function cancelNext(){clearInterval(countdown);countdown=null;$('movieCountdown').hidden=true}
function buildQueue(){let other=movies.filter(m=>m.id!==movie.id);if(shuffle)for(let i=other.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[other[i],other[j]]=[other[j],other[i]]}queue=other;renderQueue()}
function renderQueue(){const root=$('queueList');root.replaceChildren();queue.forEach((m,i)=>{const b=document.createElement('button');b.textContent=(i+1)+'. '+m.title;b.onclick=()=>loadMovie(m,true);root.appendChild(b)})}
function updateIntro(){const r=movie.intro,t=video.currentTime;$('skipIntro').hidden=!(r&&Number.isFinite(r.start)&&Number.isFinite(r.end)&&r.end>r.start&&t>=r.start&&t<r.end)}
function loadMovie(m,autoplay){if(video.currentSrc)save();cancelNext();movie=m;position=0;try{position=Number(localStorage.getItem(key()))||0}catch(e){}history.replaceState(null,'','movie.html?id='+encodeURIComponent(movie.id));document.title=movie.title+' | Allend TV';$('title').textContent=movie.title;$('description').textContent=movie.description||'';$('resume').hidden=true;$('skipIntro').hidden=true;video.src=movie.url;video.load();$('status').textContent='Loading '+movie.title+'...';buildQueue();settle();if(autoplay)video.play().catch(()=>$('status').textContent='Press Play to start the next movie.')}
function toggle(){if(video.paused)video.play().catch(()=>$('status').textContent='Press Play to start.');else video.pause()}
function nextMovie(){if(!queue.length){$('status').textContent='No more movies in the queue.';return}loadMovie(queue[0],true)}
function startNext(){if(!queue.length){$('status').textContent='Queue finished.';return}cancelNext();remaining=10;$('movieCountdown').hidden=false;const tick=()=>{$('movieCountdownText').textContent='Next movie: '+queue[0].title+' in '+remaining+'s';if(remaining--<=0)nextMovie()};tick();countdown=setInterval(tick,1000)}
$('play').onclick=toggle;video.onclick=toggle;
video.onplay=()=>{$('play').textContent='❚❚';$('status').textContent='Now playing '+movie.title;showControls()};
video.onpause=()=>{$('play').textContent='▶';save();clearTimeout(timer);screen.classList.remove('controls-hidden')};
video.onloadedmetadata=()=>{$('resume').hidden=!(position>0&&position<video.duration-8);$('status').textContent='Ready to play.'};
$('resume').onclick=()=>{video.currentTime=position;$('resume').hidden=true;video.play().catch(()=>{})};
video.ontimeupdate=()=>{$('time').textContent=fmt(video.currentTime)+' / '+fmt(video.duration);$('seek').value=Number.isFinite(video.duration)&&video.duration>0?Math.round(video.currentTime/video.duration*1000):0;updateIntro();if(Date.now()-lastSave>4000){save();lastSave=Date.now()}};
video.onended=()=>{try{localStorage.removeItem(key())}catch(e){}$('resume').hidden=true;try{localStorage.setItem('allend-movie-finished-'+movie.id,'1')}catch(e){}if(loop){video.currentTime=0;video.play().catch(()=>{});}else if($('autoNext').checked)startNext();else $('status').textContent='Movie finished.'};
video.onerror=()=>{$('status').textContent='Video unavailable. Check the source URL, format or access permissions.'};
$('seek').oninput=()=>{if(Number.isFinite(video.duration))video.currentTime=video.duration*Number($('seek').value)/1000};
$('mute').onclick=()=>{video.muted=!video.muted;$('mute').textContent=video.muted?'🔇':'🔊'};
$('volume').oninput=()=>{video.volume=Number($('volume').value);video.muted=false};
$('back10').onclick=()=>video.currentTime=Math.max(0,video.currentTime-10);
$('forward10').onclick=()=>{if(Number.isFinite(video.duration))video.currentTime=Math.min(video.duration,video.currentTime+10)};
$('speed').onchange=()=>video.playbackRate=Number($('speed').value);
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(screen.requestFullscreen)screen.requestFullscreen().catch(()=>$('status').textContent='Fullscreen unavailable.');settle()};
$('pip').onclick=()=>{if(video.requestPictureInPicture)video.requestPictureInPicture().catch(()=>$('status').textContent='Mini player unavailable.');else $('status').textContent='Mini player unsupported.';settle()};
$('cinema').onclick=()=>{document.body.classList.toggle('theater');$('cinema').textContent=document.body.classList.contains('theater')?'Exit theater':'☾ Theater';settle()};
$('loop').onclick=()=>{loop=!loop;$('loop').textContent=loop?'↻ Loop on':'↻ Loop off';settle()};
$('shuffle').onclick=()=>{shuffle=!shuffle;$('shuffle').textContent=shuffle?'⤨ Shuffle on':'⤨ Shuffle off';buildQueue();settle()};
$('shuffleQueue').onclick=()=>{shuffle=true;$('shuffle').textContent='⤨ Shuffle on';buildQueue()};
$('skipIntro').onclick=()=>{if(movie.intro){video.currentTime=movie.intro.end;updateIntro();settle()}};
$('playNextNow').onclick=nextMovie;$('cancelNext').onclick=()=>{cancelNext();$('status').textContent='Next movie canceled.'};
$('screenshot').onclick=()=>{try{const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='allend-movie.png';a.click()}catch(e){$('status').textContent='Screenshot blocked by the video source.'}};
screen.addEventListener('mousemove',showControls);screen.addEventListener('touchstart',showControls,{passive:true});$('movieControls').addEventListener('click',()=>setTimeout(settle,0));

/* Monitor how much video is buffered ahead */

function checkBuffer() {
  if (!video.buffered.length) return;

  let bufferedAhead = 0;

  for (let i = 0; i < video.buffered.length; i++) {
    if (
      video.buffered.start(i) <= video.currentTime &&
      video.buffered.end(i) >= video.currentTime
    ) {
      bufferedAhead =
        video.buffered.end(i) - video.currentTime;
      break;
    }
  }

  console.log(
    "Movie buffered ahead:",
    bufferedAhead.toFixed(1),
    "seconds"
  );
}

video.addEventListener("progress", checkBuffer);
video.addEventListener("timeupdate", checkBuffer);

window.addEventListener('pagehide',save);
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();toggle()}else if(e.key.toLowerCase()==='f')$('fullscreen').click();else if(e.key.toLowerCase()==='m')$('mute').click();else if(e.key==='ArrowRight')$('forward10').click();else if(e.key==='ArrowLeft')$('back10').click()});
loadMovie(movie,true);
})();