(function() {
  var prev;
  var hF = document.getElementById("highlightFullscreen");
  var fullscreen = false;
  if(hF == null){
    document.body.addEventListener('mouseover', handler);
    window.addEventListener('resize', resizeElement, true);
    var head = document.getElementsByTagName("head")[0];
    var highlight = document.createElement("style");
    highlight.id = 'highlightFullscreen';
    highlight.innerHTML = ".highlightFullscreen { background-color: yellow; }";
    highlight.innerHTML += " .goFullscreen { position:fixed;width:100%;height:100%;left:0px;top:0px;z-index:999999999;background-color:white; }";
    head.appendChild(highlight);
    if(document.getElementsByClassName("highlightFullscreen").length > 0){
      var element = document.getElementsByClassName("highlightFullscreen")[0];
      element.className = element.className.replace(/\bhighlightFullscreen/,'');
    }
  } else {
    document.body.removeEventListener('mouseover', handler);
    window.removeEventListener('resize', resizeElement, true);
    hF.remove();
    if(document.getElementsByClassName("goFullscreen").length > 0){
      var element = document.getElementsByClassName("goFullscreen")[0];
      element.className = element.className.replace(/\bgoFullscreen/,'');
      element.style.position = bkupPosition;
      element.style.width = bkupWidth;
      element.style.height = bkupHeight;
      element.style.left = bkupLeft;
      element.style.top = bkupTop;
      element.style.zIndex = bkupZIndex;
    }
    window.dispatchEvent(new Event('resize'));
    clickhandler = function(){};
  }
  
  function handler(event) {
    if(!fullscreen){
      if (event.target === document.body ||
          (prev && prev === event.target)) {
        return;
      }
      if (prev) {
        prev.className = prev.className.replace(/\bhighlightFullscreen/, '');
        prev.removeEventListener('click',clickhandler, true);
        prev = undefined;
      }
      if (event.target) {
        prev = event.target;
        if (prev.className.indexOf("highlightFullscreen") === -1){
          prev.className += " highlightFullscreen";
        }
        prev.addEventListener('click',clickhandler, true);
      }
    }
  }

  function clickhandler(event) {
    if(!fullscreen){
      fullscreen = true;
      document.body.removeEventListener('mouseover', handler);
      event.target = event.target;
      event.target.removeEventListener('click', clickhandler);
      bkupPosition = event.target.style.position;
      bkupWidth = event.target.style.width;
      bkupHeight = event.target.style.height;
      bkupLeft = event.target.style.left;
      bkupTop = event.target.style.top;
      bkupZIndex = event.target.style.zIndex;
      if (event.target.className.indexOf("goFullscreen") === -1){
        event.target.className += " goFullscreen";
      }
      setStyle(event.target);
    }
  }

  function setStyle(element){
    element.style.position='fixed';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.left = '0px';
    element.style.top = '0px';
    element.style.zIndex = '999999999';
  }

  var resizeTimeout = null;
  function resizeElement(){
    console.log('resizing!');
    if(document.getElementsByClassName("goFullscreen").length > 0){
      if(resizeTimeout){
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(function(){setStyle(document.getElementsByClassName("goFullscreen")[0])}, 20);
    }
  }

})();