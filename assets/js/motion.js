/* Movimiento JEYR DESIGN: revelado reversible, ligero y accesible. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('page-enter');
  const revealTargets = '.section-kicker,.intro-grid>*,.section-heading>*,.service-card,.portfolio-item,.portfolio-placeholder,.brands-head>*,.brand-tile,.contact-left>*,.contact-form,.category-panel,.package-card,.package-empty,.gallery-photo';
  let revealObserver = null;

  if (!reduce && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Al salir del área visible se revierte el estado; al volver a entrar se anima otra vez.
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  }

  const reveal = (root = document) => {
    const items = [...root.querySelectorAll(revealTargets)].filter(el => !el.classList.contains('motion-ready'));
    items.forEach((el, i) => {
      el.classList.add('motion-ready');
      if (reduce) {
        el.classList.add('is-visible');
        return;
      }
      el.classList.add('motion-reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(i % 4, 3) * 55}ms`);
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  };

  reveal(document);

  // Parallax muy ligero del holograma en escritorio; nunca en táctil ni con movimiento reducido.
  const heroArt = document.querySelector('.hero-art');
  if (heroArt && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let frame = 0;
    heroArt.addEventListener('pointermove', event => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = heroArt.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        heroArt.style.setProperty('--hero-x', `${x * 9}px`);
        heroArt.style.setProperty('--hero-y', `${y * 9}px`);
        frame = 0;
      });
    }, { passive: true });
    heroArt.addEventListener('pointerleave', () => {
      heroArt.style.setProperty('--hero-x', '0px');
      heroArt.style.setProperty('--hero-y', '0px');
    }, { passive: true });
  }

  document.addEventListener('jeyr:content-updated', () => reveal(document));

  // Resalta el enlace de navegación de la sección visible.
  const navLinks = [...document.querySelectorAll('#main-nav a[data-jeyr-destination]')];
  const sections = navLinks.map(a => {
    try {
      const url = new URL(a.dataset.jeyrDestination, location.href);
      return url.origin === location.origin && url.hash ? document.querySelector(url.hash) : null;
    } catch { return null; }
  }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => {
        let hash = '';
        try { hash = new URL(a.dataset.jeyrDestination, location.href).hash; } catch {}
        a.classList.toggle('nav-current', hash === `#${entry.target.id}`);
      });
    }), { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => spy.observe(section));
  }

  if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cardSelector = '.service-card,.category-panel,.package-card,.brand-tile,.portfolio-event';
  const bindCard = card => {
    if (card.dataset.motionBound) return;
    card.dataset.motionBound = 'true';
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      if (!card.matches('.brand-tile,.portfolio-event')) {
        card.style.setProperty('--tilt-x', `${(.5 - y) * 2.5}deg`);
        card.style.setProperty('--tilt-y', `${(x - .5) * 3}deg`);
      }
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    }, { passive: true });
  };
  document.querySelectorAll(cardSelector).forEach(bindCard);
  if ('MutationObserver' in window) {
    const mutationObserver = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.(cardSelector)) bindCard(node);
        node.querySelectorAll?.(cardSelector).forEach(bindCard);
      });
    }));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
