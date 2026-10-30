(function(){
var grid=document.getElementById("seriesGrid"),empty=document.getElementById("emptySeries");
if(!grid)return;
var shows=window.ALLEND_SERIES||[];
for(var i=0;i<shows.length;i++){
 var show=shows[i],card=document.createElement("a");
 card.className="poster";card.href="player.html?series="+encodeURIComponent(show.id);
 if(show.poster){
  var img=document.createElement("img");img.src=show.poster;img.alt=show.title+" poster";
  img.onerror=function(){this.style.display="none";var ph=document.createElement("div");ph.className="placeholder";ph.appendChild(document.createTextNode("🎬"));this.parentNode.insertBefore(ph,this)};
  card.appendChild(img);
 }else{var ph=document.createElement("div");ph.className="placeholder";ph.appendChild(document.createTextNode("🎬"));card.appendChild(ph)}
 var label=document.createElement("span");label.className="poster-label";
 var title=document.createElement("strong");title.appendChild(document.createTextNode(show.title));label.appendChild(title);
 var sub=document.createElement("small");sub.appendChild(document.createTextNode(show.episodes+" episodes · Watch now"));label.appendChild(sub);
 card.appendChild(label);grid.appendChild(card);
}
if(empty)empty.hidden=shows.length>0;
})();
