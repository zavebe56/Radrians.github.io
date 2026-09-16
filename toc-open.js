/* =========================================================
   TOC-OPEN.JS
   Makes sidebar / TOC links (anything linking to "#some-id")
   open the matching <details class="info-box"> BEFORE
   scrolling to it, then jumps to it instantly (no smooth-
   scroll animation), positioning the box's top — image and
   title — right under the sticky header.

   This uses the browser's own scrollIntoView() to do the
   actual positioning, instead of computing the scroll distance
   by hand. scrollIntoView already respects the .info-box's
   scroll-margin-top (see style.css), so the browser — not our
   own arithmetic — works out exactly how far to move in either
   direction, which avoids the direction-dependent bugs that a
   hand-rolled getBoundingClientRect()-based calculation is
   prone to.

   We force scroll-behavior to "auto" on <html> for the instant
   this runs, so it can't be caught by the site's CSS
   scroll-behavior:smooth (see style.css), then restore it
   afterward.

   Because things can still shift size after the jump (web
   fonts swapping in, the box's grid finishing layout, the
   browser's own "scroll anchoring"), we watch the box, header,
   and page body with a ResizeObserver and re-run the jump any
   time one of them resizes, stopping once things go quiet for a
   short period (or after a hard timeout, as a safety net).

   Also keeps --header-offset in sync with the real header
   height, since .info-box's scroll-margin-top is defined in
   terms of that variable.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    var QUIET_PERIOD = 400;     // stop correcting once nothing has resized for this long (ms)
    var HARD_TIMEOUT = 2500;    // absolute cap, in case something never settles (ms)

    function getHeaderOffset() {
        var header = document.querySelector('header');
        return header ? header.offsetHeight : 16;
    }

    function syncHeaderOffsetVar() {
        document.documentElement.style.setProperty(
            '--header-offset',
            getHeaderOffset() + 'px'
        );
    }

    // Jumps to target using the browser's own layout math (so it
    // can't undershoot/overshoot in one direction the way manual
    // arithmetic can), forcing it to be instant regardless of the
    // site's CSS scroll-behavior.
    function jumpTo(target) {

        var htmlEl = document.documentElement;
        var prevScrollBehavior = htmlEl.style.scrollBehavior;

        htmlEl.style.scrollBehavior = 'auto';

        target.scrollIntoView({ behavior: 'auto', block: 'start' });

        // Restore whatever the site's own scroll-behavior was, once
        // this jump has been applied.
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

        if (target.tagName === 'DETAILS' && !target.open) {
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

        // Wait one frame for the "open" attribute change to be laid
        // out before the first jump.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {

                onPossibleShift();

                if (typeof ResizeObserver !== 'undefined') {

                    ro = new ResizeObserver(onPossibleShift);

                    ro.observe(target);

                    var header = document.querySelector('header');
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
