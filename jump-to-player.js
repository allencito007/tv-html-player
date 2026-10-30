/* AllendTV: immediately position the video at the top when a title opens. */
(function () {
  function jump() {
    var player = document.getElementById('screen');
    if (!player) return;
    var top = player.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
    window.scrollTo(0, Math.max(0, Math.round(top)));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', jump, false);
  } else { jump(); }
  window.addEventListener('load', jump, false);
})();
