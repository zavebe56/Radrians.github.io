/* =========================================================
   ESTERASUL — RADRIAN ARCHIVE
   site.js — theme toggle + image lightbox + TOC box-open/scroll
   Shared by every page. Include with:
     <script src="site.js"></script>
   (toc-open.js is no longer a separate file — its logic now
   lives in the third IIFE below, so there's one less script
   tag/path that can go stale or 404.)
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     THEME TOGGLE (light / dark)
     Reads/writes localStorage so the choice persists across
     pages and future visits. The actual colors live in
     style.css under :root and html[data-theme="light"].
     --------------------------------------------------------- */

  var root = document.documentElement;
  var toggleBtn = document.getElementById("themeToggle");

  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (toggleBtn) toggleBtn.classList.add("is-light");
    } else {
      root.removeAttribute("data-theme");
      if (toggleBtn) toggleBtn.classList.remove("is-light");
    }
  }

  var saved = null;
  try {
    saved = localStorage.getItem("theme");
  } catch (e) {
    /* localStorage unavailable (e.g. privacy mode) — default to dark */
  }
  applyTheme(saved === "light" ? "light" : "dark");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* ignore — theme just won't persist this session */
      }
    });
  }

  /* ---------------------------------------------------------
     IMAGE LIGHTBOX
     Click any illustrated box-image / expand-image / gallery
     photo / map region image to view it enlarged, filling the
     screen. Click the backdrop, the close button, or press Esc
     to dismiss.
     --------------------------------------------------------- */

  var overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML =
    '<button class="lightbox-close" aria-label="Close image">&times;</button>' +
    '<img class="lightbox-img" alt="">';
  document.body.appendChild(overlay);

  var lightboxImg = overlay.querySelector(".lightbox-img");
  var lightboxClose = overlay.querySelector(".lightbox-close");

  function openLightbox(src, alt) {
    if (!src) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    overlay.classList.add("active");
    document.body.classList.add("lightbox-lock");
  }

  function closeLightbox() {
    overlay.classList.remove("active");
    document.body.classList.remove("lightbox-lock");
    lightboxImg.src = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  function backgroundUrlOf(el) {
    var bg = getComputedStyle(el).backgroundImage;
    var match = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    return match ? match[1] : null;
  }

  // Thumbnail images inside an info-box's <summary> — only open the
  // lightbox once that box is expanded; while collapsed, a click should
  // still just open the box as normal.
  document.querySelectorAll(".box-image").forEach(function (el) {
    var url = backgroundUrlOf(el);
    if (!url) return;
    el.addEventListener("click", function (ev) {
      var details = el.closest("details.info-box");
      if (details && details.open) {
        ev.preventDefault();
        openLightbox(url, "");
      }
    });
  });

  // Larger images shown inside an expanded info-box.
  document.querySelectorAll(".expand-image").forEach(function (el) {
    var url = backgroundUrlOf(el);
    if (!url) return;
    el.addEventListener("click", function () {
      openLightbox(url, "");
    });
  });

  // Homepage showcase image.
  document.querySelectorAll(".showcase-image").forEach(function (el) {
    var url = backgroundUrlOf(el);
    if (!url) return;
    el.addEventListener("click", function () {
      openLightbox(url, "");
    });
  });

  // Gallery page photos.
  document.querySelectorAll(".gallery-item img").forEach(function (img) {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function () {
      openLightbox(img.getAttribute("src"), img.getAttribute("alt") || "");
    });
  });

  // World map info panel — its background image is swapped dynamically
  // by that page's own script, so look up the current url at click time
  // rather than once on load.
  var mapInfoImage = document.getElementById("mapInfoImage");
  if (mapInfoImage) {
    mapInfoImage.addEventListener("click", function () {
      var url = backgroundUrlOf(mapInfoImage);
      if (url) openLightbox(url, "");
    });
  }
})();

(function () {
  "use strict";

  /* ---------------------------------------------------------
     TOC / SIDEBAR BOX OPEN + SCROLL
     Makes sidebar / TOC links (anything linking to "#some-id")
     open the matching <details class="info-box"> BEFORE
     scrolling to it, then jumps to it in a single instant move
     (no smooth-scroll animation, no repeated re-correction),
     positioning the box's top — image and title — right under
     the sticky header.

     Uses the browser's own scrollIntoView() to do the actual
     positioning (it respects .info-box's scroll-margin-top in
     style.css), instead of computing the scroll distance by
     hand — that avoids direction-dependent bugs a hand-rolled
     getBoundingClientRect()-based calculation is prone to.

     It forces scroll-behavior to "auto" on <html> for the
     instant this runs, so the site's CSS scroll-behavior:smooth
     (see style.css) can't turn this into an animated scroll,
     then restores it afterward so smooth-scrolling still works
     everywhere else on the site.

     Also keeps --header-offset in sync with the real header
     height, since .info-box's scroll-margin-top is defined in
     terms of that variable.
     --------------------------------------------------------- */

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
  // to be a single instant move regardless of the site's CSS
  // scroll-behavior.
  function jumpTo(target) {
    var htmlEl = document.documentElement;
    var prevScrollBehavior = htmlEl.style.scrollBehavior;

    htmlEl.style.scrollBehavior = "auto";

    target.scrollIntoView({ behavior: "auto", block: "start" });

    requestAnimationFrame(function () {
      htmlEl.style.scrollBehavior = prevScrollBehavior;
    });
  }

  // Opens the target (if it's a closed <details>) and jumps to it
  // once, right after the browser has laid out the newly-opened box.
  function openAndJump(id) {
    var target = document.getElementById(id);

    if (!target) return;

    if (target.tagName === "DETAILS" && !target.open) {
      target.open = true;
    }

    // Wait one frame for the "open" attribute change to be laid out
    // before jumping, so we measure/scroll against the expanded box,
    // not its collapsed size.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        jumpTo(target);
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
