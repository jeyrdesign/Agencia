/* Microinteracciones JEYR DESIGN: progresivas, accesibles y ligeras. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [
    '.section-kicker', '.intro-grid > *', '.section-heading > *',
    '.service-card', '.portfolio-item', '.portfolio-placeholder',
    '.brands-head > *', '.brand-tile', '.contact-left > *', '.contact-form',
    '.category-panel', '.package-card', '.package-empty'
  ].join(',');
  const targets = [...document.querySelectorAll(revealTargets)];
  if (!reduce && 'IntersectionObserver' in window) {
    targets.forEach((el, i) => {
      el.classList.add('motion-reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(i % 4, 3) * 75}ms`);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    targets.forEach(el => observer.observe(el));
  } else targets.forEach(el => el.classList.add('is-visible'));

  if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const bindCard = card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      if (!card.matches('.brand-tile')) {
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 4}deg`);
      }
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  };
  document.querySelectorAll('.service-card, .category-panel, .package-card, .brand-tile').forEach(bindCard);
  const packageRoot = document.querySelector('#package-list');
  if (packageRoot && 'MutationObserver' in window) {
    new MutationObserver(() => packageRoot.querySelectorAll('.package-card').forEach(card => {
      if (!card.dataset.motionBound) { card.dataset.motionBound = 'true'; bindCard(card); card.classList.add('motion-reveal','is-visible'); }
    })).observe(packageRoot, {childList:true});
  }
})();
