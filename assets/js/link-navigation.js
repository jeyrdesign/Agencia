/* JEYR DESIGN — navegación sin vista previa de URL en la barra de estado.
   Conserva la apariencia de los enlaces, pero delega la navegación a JavaScript. */
(() => {
  const selector = 'a[href]';
  const convert = (root) => {
    const anchors = [];
    if (root?.matches?.(selector)) anchors.push(root);
    root?.querySelectorAll?.(selector).forEach(anchor => anchors.push(anchor));
    anchors.forEach(anchor => {
      if (anchor.hasAttribute('data-jeyr-destination')) return;
      const destination = anchor.getAttribute('href');
      if (!destination || destination.startsWith('javascript:')) return;
      anchor.setAttribute('data-jeyr-destination', destination);
      if (anchor.hasAttribute('target')) anchor.setAttribute('data-jeyr-target', anchor.getAttribute('target'));
      if (anchor.hasAttribute('download')) anchor.setAttribute('data-jeyr-download', anchor.getAttribute('download') || '');
      anchor.removeAttribute('href');
      anchor.setAttribute('role', 'link');
      anchor.setAttribute('tabindex', '0');
    });
  };

  convert(document);
  if ('MutationObserver' in window) {
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) convert(node);
    })));
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  const navigate = (anchor) => {
    const destination = anchor?.getAttribute('data-jeyr-destination');
    if (!destination) return;
    if (anchor.hasAttribute('data-jeyr-download')) {
      const downloadUrl = new URL(destination, location.href);
      const temporary = document.createElement('a');
      temporary.href = downloadUrl.href;
      temporary.download = anchor.getAttribute('data-jeyr-download') || '';
      document.body.appendChild(temporary);
      temporary.click();
      temporary.remove();
      return;
    }
    let url;
    try { url = new URL(destination, location.href); }
    catch { return; }
    const target = anchor.getAttribute('data-jeyr-target');
    if (target === '_blank') {
      window.open(url.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && url.hash) {
      const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (section) {
        section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', url.hash);
        document.querySelector('#main-nav')?.classList.remove('open');
        return;
      }
    }
    location.assign(url.href);
  };

  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[data-jeyr-destination]');
    if (!anchor) return;
    event.preventDefault();
    navigate(anchor);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const anchor = event.target.closest?.('a[data-jeyr-destination][role="link"]');
    if (!anchor) return;
    event.preventDefault();
    navigate(anchor);
  });
})();
