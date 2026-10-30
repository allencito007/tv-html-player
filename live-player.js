(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  var grid=$("channelGrid"), empty=$("emptyChannels"), section=$("livePlayer");
  var video=$("liveVideo"), screen=$("liveScreen"), status=$("liveStatus");
  var channels=window.ALLEND_CHANNELS||[], hls=null, current=null, controlsTimer=null;
  empty.hidden=channels.length>0||grid.children.length>0;
  function setStatus(message) { status.textContent=message; }
  function setLoading(on) { $("liveLoading").hidden=!on; }
  function showControls() {
    screen.classList.remove("controls-hidden"); clearTimeout(controlsTimer);
    if (!video.paused) controlsTimer=setTimeout(function(){
      if (!video.paused) {
        var active=document.activeElement;
        if (active && screen.contains(active) && active.blur) active.blur();
        screen.classList.add("controls-hidden");
      }
    },3200);
  }
  function stopStream() {
    video.pause();
    if (hls) { hls.destroy(); hls=null; }
    video.removeAttribute("src"); video.load();
  }
  function tryPlay() {
    var promise;
    try { promise=video.play(); }
    catch(e) { setLoading(false);setStatus("Press Play to start the live channel.");return; }
    if (promise && promise.catch) promise.catch(function(){setLoading(false);setStatus("Press Play to start the live channel.");});
  }
  function playChannel(channel) {
    stopStream(); current=channel;section.hidden=false;
    $("channelTitle").textContent=channel.name;
    setLoading(true);setStatus("Loading "+channel.name+"...");
    var isHls=/\.m3u8(?:[?#]|$)/i.test(channel.url);
    if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src=channel.url;tryPlay();
    } else if (isHls && window.Hls && window.Hls.isSupported()) {
      hls=new window.Hls();
      hls.on(window.Hls.Events.MEDIA_ATTACHED,function(){hls.loadSource(channel.url);});
      hls.on(window.Hls.Events.MANIFEST_PARSED,tryPlay);
      hls.on(window.Hls.Events.ERROR,function(event,data){
        if (data.fatal) {setLoading(false);setStatus("Stream failed. It may be offline, blocked by CORS, or unsupported by this TV.");if(hls){hls.destroy();hls=null;}}
      });
      hls.attachMedia(video);
    } else if (isHls) {setLoading(false);setStatus("This TV/browser cannot play HLS. Check hls.js and device support.");}
    else {video.src=channel.url;tryPlay();}
    showControls();
    var top=screen.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||0);
    window.scrollTo(0,Math.max(0,Math.round(top)));
  }
  var existing=grid.querySelectorAll("[data-channel-id]");
  for(var i=0;i<existing.length;i++)(function(card){
    var id=card.getAttribute("data-channel-id");
    for(var j=0;j<channels.length;j++)if(channels[j].id===id){
      (function(channel){card.addEventListener("click",function(){playChannel(channel);});})(channels[j]);break;
    }
  })(existing[i]);
  channels.forEach(function(channel){
    if(grid.querySelector('[data-channel-id="'+channel.id+'"]'))return;
    var button=document.createElement("button");button.type="button";button.className="channel-card";
    button.setAttribute("data-channel-id",channel.id);
    if(channel.logo){var img=document.createElement("img");img.src=channel.logo;img.alt="";img.loading="lazy";button.appendChild(img);}
    var label=document.createElement("strong");label.textContent=channel.name;button.appendChild(label);
    button.addEventListener("click",function(){playChannel(channel);});grid.appendChild(button);
  });
  function toggle(){if(video.paused)tryPlay();else video.pause();}
  $("livePlay").addEventListener("click",toggle);video.addEventListener("click",toggle);
  video.addEventListener("play",function(){$("livePlay").textContent="❚❚";showControls();});
  video.addEventListener("pause",function(){$("livePlay").textContent="▶";clearTimeout(controlsTimer);screen.classList.remove("controls-hidden");});
  video.addEventListener("playing",function(){setLoading(false);setStatus("● LIVE · "+(current?current.name:""));});
  video.addEventListener("waiting",function(){setLoading(true);setStatus("Buffering live stream...");});
  video.addEventListener("stalled",function(){setLoading(true);setStatus("Waiting for live stream data...");});
  video.addEventListener("error",function(){if(video.error){setLoading(false);setStatus("Playback error. Check stream URL, CORS, or device codec support.");}});
  $("liveMute").addEventListener("click",function(){video.muted=!video.muted;$("liveMute").textContent=video.muted?"🔇":"🔊";});
  $("liveVolume").addEventListener("input",function(){video.volume=Number(this.value);video.muted=false;$("liveMute").textContent="🔊";});
  $("liveSpeed").addEventListener("change",function(){video.playbackRate=Number(this.value);});
  $("liveGoLive").addEventListener("click",function(){
    try{if(video.seekable.length)video.currentTime=Math.max(0,video.seekable.end(video.seekable.length-1)-0.5);setStatus("Jumping to live...");}
    catch(e){setStatus("This channel does not support seeking to live.");}
  });
  $("liveFullscreen").addEventListener("click",function(){
    if(document.fullscreenElement&&document.exitFullscreen){document.exitFullscreen();return;}
    var request=screen.requestFullscreen||screen.webkitRequestFullscreen||screen.msRequestFullscreen;
    if(request){try{var p=request.call(screen);if(p&&p.catch)p.catch(function(){setStatus("Fullscreen unavailable.");});}catch(e){setStatus("Fullscreen unavailable.");}}
    else if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();}
    else setStatus("Fullscreen unsupported on this TV.");
    showControls();
  });
  $("livePip").addEventListener("click",function(){
    if(video.requestPictureInPicture){var p=video.requestPictureInPicture();if(p&&p.catch)p.catch(function(){setStatus("Mini player unavailable.");});}
    else setStatus("Mini player unsupported on this TV.");
  });
  $("liveCinema").addEventListener("click",function(){
    document.body.classList.toggle("theater");
    this.textContent=document.body.classList.contains("theater")?"Exit theater":"☾ Theater";
  });
  $("liveSnapshot").addEventListener("click",function(){
    try{var canvas=document.createElement("canvas");canvas.width=video.videoWidth;canvas.height=video.videoHeight;
      if(!canvas.width)throw new Error("No frame");canvas.getContext("2d").drawImage(video,0,0);
      var a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="allend-live.png";a.click();
    }catch(e){setStatus("Snapshot unavailable for this stream.");}
  });
  screen.addEventListener("mousemove",showControls);screen.addEventListener("touchstart",showControls);
  window.addEventListener("pagehide",stopStream);
})();
