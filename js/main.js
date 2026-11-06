// Cambia estos datos por los contactos oficiales de JEYR DESIGN.
const JEYR={whatsapp:"593980478748",instagram:"TU_USUARIO"};
const wa=m=>`https://wa.me/${JEYR.whatsapp}?text=${encodeURIComponent(m)}`;
document.querySelectorAll(".whatsapp-link").forEach(a=>{a.href=wa(a.dataset.message||"Hola, quiero información sobre JEYR DESIGN.");a.target="_blank";a.rel="noopener";});
document.querySelectorAll("[data-whatsapp-general]").forEach(a=>{a.href=wa("Hola, quiero información sobre los servicios de JEYR DESIGN.");a.target="_blank";a.rel="noopener";});
const ig=document.querySelector("#instagram-link");if(ig&&JEYR.instagram!=="TU_USUARIO")ig.href=`https://instagram.com/${JEYR.instagram}`;
document.querySelectorAll(".service-toggle").forEach(btn=>btn.addEventListener("click",()=>{const item=btn.closest(".service-item");const open=item.classList.toggle("open");btn.setAttribute("aria-expanded",String(open));}));
document.querySelectorAll(".year").forEach(el=>el.textContent=new Date().getFullYear());

// Menú móvil accesible: abre/cierra con el botón, cierra al navegar y con Escape.
document.querySelectorAll(".menu-toggle").forEach(button=>{
  const header=button.closest(".header");
  const closeMenu=()=>{header.classList.remove("menu-open");button.setAttribute("aria-expanded","false");button.setAttribute("aria-label","Abrir menú");};
  button.addEventListener("click",()=>{
    const isOpen=header.classList.toggle("menu-open");
    button.setAttribute("aria-expanded",String(isOpen));
    button.setAttribute("aria-label",isOpen?"Cerrar menú":"Abrir menú");
  });
  header.querySelectorAll("nav a").forEach(link=>link.addEventListener("click",closeMenu));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();});
});


// Galerías fotográficas automáticas para GitHub Pages.
// Coloca 01.jpg, 02.jpg, 03.jpg... en la carpeta indicada por data-photo-gallery.
// También admite .jpeg, .png y .webp. La secuencia debe ser continua, sin saltos.
(async function initNumberedPhotoGalleries(){
  const galleries = document.querySelectorAll('[data-photo-gallery]');
  if (!galleries.length) return;

  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const maxPhotos = 99;

  function findNumberedImage(folder, number) {
    const filename = String(number).padStart(2, '0');
    return new Promise(resolve => {
      let extensionIndex = 0;
      const probe = new Image();
      const tryNextExtension = () => {
        if (extensionIndex >= extensions.length) {
          resolve(null);
          return;
        }
        const url = `${folder}${filename}.${extensions[extensionIndex++]}`;
        probe.onload = () => resolve(url);
        probe.onerror = tryNextExtension;
        probe.src = url;
      };
      tryNextExtension();
    });
  }

  for (const gallery of galleries) {
    const folder = gallery.dataset.photoGallery;
    const title = gallery.dataset.galleryTitle || 'Fotografía';
    let total = 0;

    for (let number = 1; number <= maxPhotos; number++) {
      const src = await findNumberedImage(folder, number);
      if (!src) break;

      const figure = document.createElement('figure');
      const img = document.createElement('img');
      const caption = document.createElement('figcaption');
      img.src = src;
      img.alt = `${title} · Fotografía ${String(number).padStart(2, '0')} — JEYR DESIGN`;
      img.loading = number <= 6 ? 'eager' : 'lazy';
      caption.textContent = `${title} · ${String(number).padStart(2, '0')}`;
      figure.append(img, caption);
      gallery.appendChild(figure);
      total++;
    }

    if (!total) {
      const empty = document.createElement('div');
      empty.className = 'empty-note';
      empty.textContent = `Próximamente: fotografías de ${title.toLowerCase()}.`;
      gallery.appendChild(empty);
    }
  }
})();
