/* =========================================================
   TOC-OPEN.JS
   Makes sidebar / TOC links (anything linking to "#some-id")
   open the matching <details class="info-box"> BEFORE
   scrolling to it, then jumps to it instantly (no smooth-
   scroll animation), positioning the box's top — image and
   title — right under the sticky header.

   Also keeps --header-offset in sync with the real header
   height, since other CSS (scroll-margin-top on .info-box)
   relies on that variable as a fallback for native browser
   jumps (e.g. if JS fails to load, or a bookmarked link with
   a hash is opened directly).
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    var EXTRA_GAP = 30; // small breathing room below the header, in px

    function getHeaderOffset() {
        var header = document.querySelector('header');
        return header ? header.offsetHeight : -100;
    }

    function syncHeaderOffsetVar() {
        document.documentElement.style.setProperty(
            '--header-offset',
            getHeaderOffset() + 'px'
        );
    }

    // Opens the target (if it's a closed <details>) and jumps to it
    // instantly, aligning its top edge just under the sticky header.
    function openAndJump(id) {

        var target = document.getElementById(id);

        if (!target) return;

        if (target.tagName === 'DETAILS' && !target.open) {
            target.open = true;
        }

        // Wait for the browser to finish laying out the now-open box
        // before measuring its position — otherwise we measure the
        // old (closed) layout and land in the wrong place.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {

                var rect = target.getBoundingClientRect();
                var absoluteTop = rect.top + window.pageYOffset;
                var scrollTarget = absoluteTop - getHeaderOffset() - EXTRA_GAP;

                window.scrollTo({
                    top: Math.max(scrollTarget, 0),
                    left: 0,
                    behavior: 'auto' // instant — no animation
                });
            });
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
