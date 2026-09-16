/* =========================================================
   TOC → OPEN ENTRY
   Makes links inside the side table-of-contents (.side-submenu)
   open the <details class="info-box"> entry they point to,
   instead of just scrolling to a collapsed box.

   Works on any page that has both:
     - <aside class="side-submenu"> ... <a href="#some-id">...</a>
     - <details id="some-id"> (or an element with that id
       living inside a <details>, e.g. a heading)

   Drop this file in the same folder as the other pages and add:
     <script src="toc-open.js"></script>
   right after the existing <script src="site.js"></script> tag.
   ========================================================= */

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
               way, find the nearest details and open it. */
            var entry = target.matches('details') ? target : target.closest('details');

            if(!entry) return;

            if(!entry.open){
                entry.open = true;
            }

            /* Scroll so the TOP of the box (not the middle, and not
               the heading somewhere inside it) lands just below the
               sticky header. Opening the details changes the page's
               height, so this waits a frame for that layout change
               to settle before measuring/scrolling. */
            requestAnimationFrame(function(){

                var header = document.querySelector('header');

                var headerHeight = header ? header.offsetHeight : 0;

                var gap = 16; /* small breathing room below the header */

                var boxTop = entry.getBoundingClientRect().top + window.scrollY;

                window.scrollTo({
                    top: boxTop - headerHeight - gap,
                    behavior: 'smooth'
                });
            });

        });

    });

});
