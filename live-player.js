(function () {
  "use strict";
  var grid = document.getElementById("channelGrid");
  var empty = document.getElementById("emptyChannels");
  var section = document.getElementById("livePlayer");
  var video = document.getElementById("liveVideo");
  var status = document.getElementById("liveStatus");
  var channels = window.ALLEND_CHANNELS || [];
  var hls = null;
  empty.hidden = channels.length > 0 || grid.children.length > 0;
  var existingCards = grid.querySelectorAll("[data-channel-id]");
  for (var c = 0; c < existingCards.length; c++) {
    (function(card) {
      var id = card.getAttribute("data-channel-id");
      for (var n = 0; n < channels.length; n++) {
        if (channels[n].id === id) {
          (function(channel) {
            card.addEventListener("click", function() { playChannel(channel); });
          })(channels[n]);
          break;
        }
      }
    })(existingCards[c]);
  }

  function setStatus(message) { status.textContent = message; }
  function stopStream() {
    video.pause();
    if (hls) { hls.destroy(); hls = null; }
    video.removeAttribute("src");
    video.load();
  }
  function tryPlay() {
    var promise = video.play();
    if (promise && promise.catch) {
      promise.catch(function () { setStatus("Press Play to start the live channel."); });
    }
  }
  function playChannel(channel) {
    stopStream();
    section.hidden = false;
    document.getElementById("channelTitle").textContent = channel.name;
    setStatus("Loading " + channel.name + "...");
    var isHls = /\.m3u8(?:[?#]|$)/i.test(channel.url);
    if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
      tryPlay();
    } else if (isHls && window.Hls && Hls.isSupported()) {
      hls = new Hls();
      hls.on(Hls.Events.MEDIA_ATTACHED, function () { hls.loadSource(channel.url); });
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          setStatus("Stream failed. The link may be offline, blocked by CORS, or use an unsupported codec.");
          if (hls) { hls.destroy(); hls = null; }
        }
      });
      hls.attachMedia(video);
    } else if (isHls) {
      setStatus("HLS playback is not supported on this browser or TV. Check that hls.js loaded.");
    } else {
      video.src = channel.url;
      tryPlay();
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  channels.forEach(function (channel) {
    if (grid.querySelector('[data-channel-id="' + channel.id + '"]')) return;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "channel-card";
    button.style.cssText = "background:#252731;color:white;border:1px solid #41434f;border-radius:10px;padding:18px;cursor:pointer;text-align:center";
    if (channel.logo) {
      var img = document.createElement("img");
      img.src = channel.logo;
      img.alt = "";
      img.loading = "lazy";
      img.style.cssText = "width:100%;height:110px;object-fit:contain";
      button.appendChild(img);
    }
    var label = document.createElement("strong");
    label.textContent = channel.name;
    button.appendChild(label);
    button.addEventListener("click", function () { playChannel(channel); });
    grid.appendChild(button);
  });
  video.addEventListener("playing", function () { setStatus("● LIVE"); });
  video.addEventListener("waiting", function () { setStatus("Buffering live stream..."); });
  video.addEventListener("error", function () {
    if (video.error) setStatus("Playback error. Check the stream URL, CORS permissions, and device codec support.");
  });
  window.addEventListener("pagehide", stopStream);
})();
