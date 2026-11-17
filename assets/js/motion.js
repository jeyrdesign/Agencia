/* Movimiento JEYR DESIGN: navegación fluida, revelado progresivo y microinteracciones. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('page-enter');
  const revealTargets = '.section-kicker,.intro-grid>*,.section-heading>*,.service-card,.portfolio-item,.portfolio-placeholder,.brands-head>*,.brand-tile,.contact-left>*,.contact-form,.category-panel,.package-card,.package-empty,.gallery-photo';
  const reveal = root => {
    const items = [...(root||document).querySelectorAll(revealTargets)].filter(el => !el.classList.contains('motion-ready'));
    items.forEach((el,i)=>{el.classList.add('motion-ready');if(!reduce){el.classList.add('motion-reveal');el.style.setProperty('--reveal-delay',`${Math.min(i%4,3)*65}ms`)}});
    if(reduce||!('IntersectionObserver'in window)){items.forEach(el=>el.classList.add('is-visible'));return}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.1,rootMargin:'0px 0px -30px 0px'});
    items.forEach(el=>observer.observe(el));
  };
  reveal(document);
  document.addEventListener('jeyr:content-updated',()=>reveal(document));
  // Navegación por secciones: resalta el enlace correspondiente mientras se desplaza.
  const navLinks=[...document.querySelectorAll('#main-nav a[href*="#"]')];
  const sections=navLinks.map(a=>document.querySelector(a.getAttribute('href').split('#')[1] ? `#${CSS.escape(a.getAttribute('href').split('#')[1])}` : '')) .filter(Boolean);
  if('IntersectionObserver'in window&&sections.length){const spy=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>a.classList.toggle('nav-current',a.hash===`#${e.target.id}`))}}),{rootMargin:'-35% 0px -55% 0px'});sections.forEach(s=>spy.observe(s))}
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const target=document.querySelector(a.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});history.replaceState(null,'',a.getAttribute('href'));document.querySelector('#main-nav')?.classList.remove('open')}}));
  if(reduce||!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const bindCard=card=>{if(card.dataset.motionBound)return;card.dataset.motionBound='true';card.addEventListener('pointermove',event=>{const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;card.style.setProperty('--pointer-x',`${x*100}%`);card.style.setProperty('--pointer-y',`${y*100}%`);if(!card.matches('.brand-tile,.portfolio-event')){card.style.setProperty('--tilt-x',`${(.5-y)*2.5}deg`);card.style.setProperty('--tilt-y',`${(x-.5)*3}deg`)}});card.addEventListener('pointerleave',()=>{card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')})};
  document.querySelectorAll('.service-card,.category-panel,.package-card,.brand-tile,.portfolio-event').forEach(bindCard);
  if('MutationObserver'in window){const mo=new MutationObserver(()=>{document.querySelectorAll('.service-card,.category-panel,.package-card,.brand-tile,.portfolio-event').forEach(bindCard)});mo.observe(document.body,{childList:true,subtree:true})}
})();
