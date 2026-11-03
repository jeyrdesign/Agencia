// Cambia estos datos por los contactos oficiales de JEYR DESIGN.
const JEYR={whatsapp:"593XXXXXXXXX",instagram:"TU_USUARIO"};
const wa=m=>`https://wa.me/${JEYR.whatsapp}?text=${encodeURIComponent(m)}`;
document.querySelectorAll(".whatsapp-link").forEach(a=>{a.href=wa(a.dataset.message||"Hola, quiero información sobre JEYR DESIGN.");a.target="_blank";a.rel="noopener";});
document.querySelectorAll("[data-whatsapp-general]").forEach(a=>{a.href=wa("Hola, quiero información sobre los servicios de JEYR DESIGN.");a.target="_blank";a.rel="noopener";});
const ig=document.querySelector("#instagram-link");if(ig&&JEYR.instagram!=="TU_USUARIO")ig.href=`https://instagram.com/${JEYR.instagram}`;
document.querySelectorAll(".service-toggle").forEach(btn=>btn.addEventListener("click",()=>{const item=btn.closest(".service-item");const open=item.classList.toggle("open");btn.setAttribute("aria-expanded",String(open));}));
document.querySelectorAll(".year").forEach(el=>el.textContent=new Date().getFullYear());
