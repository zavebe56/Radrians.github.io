/* =========================================================
   TOC-OPEN.JS
   Makes sidebar / TOC links (anything linking to "#some-id")
   open the matching <details class="info-box"> BEFORE
   scrolling to it, then jumps to it instantly (no smooth-
   scroll animation), positioning the box's top — image and
   title — right under the sticky header.

   IMPORTANT: after the initial jump, the browser can still
   nudge the scroll position on its own for a moment (web font
   swapping in, the box's grid finishing layout, or the
   browser's built-in "scroll anchoring" compensating for
   content changes). To stop the box's title/image ending up
   hidden behind the header when that happens, we don't just
   scroll once — we re-check and re-correct the position for a
   short settle window right after opening.

   Also keeps --header-offset in sync with the real header
   height, since other CSS (scroll-margin-top on .info-box)
   relies on that variable as a fallback for native browser
   jumps (e.g. if JS fails to load, or a bookmarked link with
   a hash is opened directly).
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    var EXTRA_GAP = 16;        // small breathing room below the header, in px
    var SETTLE_FRAMES = 24;    // ~24 animation frames (roughly 0.3–0.4s) of correction

    function getHeaderOffset() {
        var header = document.querySelector('header');
        return header ? header.offsetHeight : 100;
    }

    function syncHeaderOffsetVar() {
        document.documentElement.style.setProperty(
            '--header-offset',
            getHeaderOffset() + 'px'
        );
    }

    // Opens the target (if it's a closed <details>) and jumps to it
    // instantly, then keeps correcting its position for a short
    // settle window so nothing can push its top out from under the
    // sticky header after the fact.
    function openAndJump(id) {

        var target = document.getElementById(id);

        if (!target) return;

        if (target.tagName === 'DETAILS' && !target.open) {
            target.open = true;
        }

        var attempts = 0;

        function correct() {

            var desiredTop = getHeaderOffset() + EXTRA_GAP;
            var rect = target.getBoundingClientRect();
            var diff = rect.top - desiredTop;

            // Only move if noticeably off, to avoid fighting sub-pixel jitter
            // or a scroll the user has started doing themselves.
            if (Math.abs(diff) > 1) {
                window.scrollTo({
                    top: Math.max(window.pageYOffset + diff, 0),
                    left: 0,
                    behavior: 'auto' // instant — no animation
                });
            }

            attempts++;

            if (attempts < SETTLE_FRAMES) {
                requestAnimationFrame(correct);
            }
        }

        // Wait one frame for the "open" attribute change to be laid
        // out before the first measurement.
        requestAnimationFrame(function () {
            requestAnimationFrame(correct);
        });
    }

    // Intercept every in-page "#id" link (sidebar / TOC links) so we
    // control the open + scroll sequence ourselves, instead of letting
    // the browser do its own (premature) native jump.
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        var id = link.getAttribute('href').slice(1);

        if (!id) return;

        link.addEventListener('click', function (e) {
            e.preventDefault();
            openAndJump(id);
            history.pushState(null, '', '#' + id);
        });
    });

    // If the page was loaded directly with a hash in the URL
    // (e.g. a bookmarked link or a link from another page), open
    // and jump to that box on load too.
    if (window.location.hash) {
        var initialId = window.location.hash.slice(1);
        // Small delay lets fonts/images finish shifting layout first.
        setTimeout(function () { openAndJump(initialId); }, 50);
    }

    syncHeaderOffsetVar();
    window.addEventListener('resize', syncHeaderOffsetVar);
});
