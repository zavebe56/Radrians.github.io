/* =========================================================
   TOC → OPEN ENTRY
   Makes links inside the side table-of-contents (.side-submenu)
   open the <details class="info-box"> entry they point to,
   instead of just scrolling to a collapsed box.

   The actual scroll POSITIONING (landing below the sticky
   header instead of behind/under it) is handled in CSS via
   scroll-margin-top on .info-box (see style.css). This script
   only needs to:
     1) keep --header-offset in sync with the real header height,
     2) open the target <details> before the jump happens.
   The browser's native "#id" navigation does the rest.

   Works on any page that has both:
     - <aside class="side-submenu"> ... <a href="#some-id">...</a>
     - <details id="some-id"> (or an element with that id
       living inside a <details>, e.g. a heading)

   Drop this file in the same folder as the other pages and add:
     <script src="toc-open.js"></script>
   right after the existing <script src="site.js"></script> tag.
   ========================================================= */

(function(){

    function syncHeaderOffset(){

        var header = document.querySelector('header');

        if(!header) return;

        document.documentElement.style.setProperty(
            '--header-offset',
            header.offsetHeight + '16px'
        );
    }

    /* Keep the offset accurate as the header changes size —
       e.g. it wraps to two rows on narrow/mobile widths, or a
       different font/zoom level changes its height. */
    document.addEventListener('DOMContentLoaded', syncHeaderOffset);
    window.addEventListener('load', syncHeaderOffset);
    window.addEventListener('resize', syncHeaderOffset);

    document.addEventListener('DOMContentLoaded', function(){

        var links = document.querySelectorAll('.side-submenu a[href^="#"]');

        links.forEach(function(link){

            link.addEventListener('click', function(){

                var id = link.getAttribute('href').slice(1);

                if(!id) return;

                var target = document.getElementById(id);

                if(!target) return;

                /* The id might be on the <details> itself, or on
                   something inside it (a heading, etc.) — either
                   way, open the nearest details BEFORE the browser's
                   default "#id" jump runs, so it measures the
                   already-expanded layout. */
                var entry = target.matches('details') ? target : target.closest('details');

                if(entry && !entry.open){
                    entry.open = true;
                }

                /* No manual scrolling here — the native anchor jump
                   that follows this click handler will scroll to
                   `target`, and scroll-margin-top in the CSS keeps
                   it clear of the sticky header. */
            });

        });

    });

})();
