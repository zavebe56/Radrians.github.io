 var QUIET_PERIOD = 400;   // stop correcting once nothing has resized for this long (ms)
  var HARD_TIMEOUT = 2500;  // absolute cap, in case something never settles (ms)
 
  function getHeaderOffset() {
    var header = document.querySelector("header");
    return header ? header.offsetHeight : 100;
  }
 
  function syncHeaderOffsetVar() {
    document.documentElement.style.setProperty(
      "--header-offset",
      getHeaderOffset() + "px"
    );
  }
 
  // Jumps to target using the browser's own layout math, forcing it
  // to be instant regardless of the site's CSS scroll-behavior.
  function jumpTo(target) {
    var htmlEl = document.documentElement;
    var prevScrollBehavior = htmlEl.style.scrollBehavior;
 
    htmlEl.style.scrollBehavior = "auto";
 
    target.scrollIntoView({ behavior: "auto", block: "start" });
 
    requestAnimationFrame(function () {
      htmlEl.style.scrollBehavior = prevScrollBehavior;
    });
  }
 
  // Opens the target (if it's a closed <details>) and jumps to it,
  // then keeps re-jumping for as long as the box/header/page keep
  // changing size, so nothing can leave its title/image hidden
  // behind the sticky header.
  function openAndJump(id) {
    var target = document.getElementById(id);
 
    if (!target) return;
 
    if (target.tagName === "DETAILS" && !target.open) {
      target.open = true;
    }
 
    var quietTimer = null;
    var hardTimer = null;
    var ro = null;
 
    function stopWatching() {
      if (ro) ro.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(hardTimer);
    }
 
    function onPossibleShift() {
      jumpTo(target);
      clearTimeout(quietTimer);
      quietTimer = setTimeout(stopWatching, QUIET_PERIOD);
    }
 
    // Wait one frame for the "open" attribute change to be laid out
    // before the first jump.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        onPossibleShift();
 
        if (typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(onPossibleShift);
 
          ro.observe(target);
 
          var header = document.querySelector("header");
          if (header) ro.observe(header);
 
          ro.observe(document.body);
 
          hardTimer = setTimeout(stopWatching, HARD_TIMEOUT);
        } else {
          // Fallback for browsers without ResizeObserver: just
          // re-jump a few times over the same window.
          var attempts = 0;
          (function loop() {
            jumpTo(target);
            attempts++;
            if (attempts < 15) setTimeout(loop, 60);
          })();
        }
      });
    });
  }
 
  // Intercept every in-page "#id" link (sidebar / TOC links) so we
  // control the open + scroll sequence ourselves, instead of letting
  // the browser do its own (premature) native jump.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
 
    if (!id) return;
 
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openAndJump(id);
      history.pushState(null, "", "#" + id);
    });
  });
 
  // If the page was loaded directly with a hash in the URL (e.g. a
  // bookmarked link or a link from another page), open and jump to
  // that box on load too.
  if (window.location.hash) {
    var initialId = window.location.hash.slice(1);
    setTimeout(function () { openAndJump(initialId); }, 50);
  }
 
  syncHeaderOffsetVar();
  window.addEventListener("resize", syncHeaderOffsetVar);
})();
