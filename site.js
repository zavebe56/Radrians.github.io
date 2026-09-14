/* =========================================================
   ESTERASUL — RADRIAN ARCHIVE
   site.js — theme toggle + image lightbox
   Shared by every page. Include with:
     <script src="site.js"></script>
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
