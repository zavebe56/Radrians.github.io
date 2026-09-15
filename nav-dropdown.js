// Mobile nav dropdown: tap the arrow to open/close the submenu.
// On desktop the arrow is hidden by CSS and hover handles it instead,
// so this script only really does anything below the 768px breakpoint.
(function(){

    var toggles = document.querySelectorAll('.dropdown-toggle');

    toggles.forEach(function(btn){

        btn.addEventListener('click', function(e){

            e.preventDefault();

            var parent = btn.closest('.has-dropdown');

            if(!parent) return;

            var isOpen = parent.classList.contains('is-open');

            // close any other open dropdown first, so only one is open at a time
            document.querySelectorAll('.has-dropdown.is-open').forEach(function(li){

                if(li !== parent){

                    li.classList.remove('is-open');

                    var otherBtn = li.querySelector('.dropdown-toggle');

                    if(otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            });

            parent.classList.toggle('is-open', !isOpen);

            btn.setAttribute('aria-expanded', String(!isOpen));
        });
    });

    // tapping anywhere outside an open dropdown closes it
    document.addEventListener('click', function(e){

        if(e.target.closest('.has-dropdown')) return;

        document.querySelectorAll('.has-dropdown.is-open').forEach(function(li){

            li.classList.remove('is-open');

            var btn = li.querySelector('.dropdown-toggle');

            if(btn) btn.setAttribute('aria-expanded', 'false');
        });
    });

})();
