// Phone/tablet menu for the shared PAPA J's header, plus the cart badge shortcut.
(function () {
  var header = document.querySelector('header');
  var nav = header && header.querySelector('.navbar');
  if (!header || !nav || !nav.querySelector('a')) return;

  // The dropdown is positioned against the header, so it must be a positioned box.
  if (getComputedStyle(header).position === 'static') header.style.position = 'relative';

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu-toggle';
  button.setAttribute('aria-label', 'Menu');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(button);

  function setOpen(open) {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  button.addEventListener('click', function () {
    setOpen(!nav.classList.contains('open'));
  });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1100) setOpen(false);
  });

  // On the products page the cart sits below the products on small screens.
  var cart = document.querySelector('.header-content .cart');
  var sidebar = document.querySelector('.sidebar');
  if (cart && sidebar) {
    cart.addEventListener('click', function () {
      if (window.innerWidth <= 1100) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
