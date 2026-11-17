import { db } from "../../admin/js/firebase.js";
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const whatsappDefault = "593980478748";
$("#year").textContent = new Date().getFullYear();
$("#menu-toggle").addEventListener("click", () => $("#main-nav").classList.toggle("open"));
document.querySelectorAll("#main-nav a").forEach(a => a.addEventListener("click", () => $("#main-nav").classList.remove("open")));

async function getPublished(name) {
  try {
    const q = query(collection(db, name), where("published", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (e) {
    console.warn(`No se pudo cargar ${name}`, e);
    return [];
  }
}
async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "siteSettings", "public"));
    if (!snap.exists()) return;
    const s = snap.data();
    const phone = String(s.whatsapp || whatsappDefault).replace(/\D/g, "");
    $("#whatsapp-float").href = `https://wa.me/${phone}`;
    const detail = document.querySelector(".contact-detail b");
    if (detail) detail.textContent = `+${phone}`;
    if (s.instagram) document.querySelector('a[href*="instagram.com"]')?.setAttribute("href", s.instagram);
    if (s.welcomeMessage) document.querySelector(".contact-left>p").textContent = s.welcomeMessage;
  } catch(e) { console.warn("Configuración pública no disponible", e); }
}
function renderPortfolio(items) {
  const grid = $("#portfolio-grid");
  if (!grid) return;
  if (!items.length) return;
  grid.innerHTML = items.slice(0,9).map((x,i) => {
    const cover=x.coverUrl||x.mediaUrl||x.imageUrl||"";
    const count=Number(x.galleryCount??x.galleryImages?.length??0);
    return `<a class="portfolio-item portfolio-event" href="galeria.html?id=${encodeURIComponent(x.id)}" target="_blank" rel="noopener" aria-label="Abrir galería ${esc(x.title)}">
      ${cover ? `<img src="${esc(cover)}" alt="${esc(x.title)}" loading="lazy">` : `<div class="portfolio-event-empty">JEYR DESIGN</div>`}
      <div class="portfolio-caption"><small>${esc(x.category || "PROYECTO")} · ${count} FOTOGRAFÍAS</small><b>${esc(x.title || "JEYR DESIGN")}</b><span class="portfolio-open">Ver galería ↗</span></div>
    </a>`;
  }).join("");
  $("#portfolio-note").textContent = "Selecciona un evento para explorar su galería completa.";
  document.dispatchEvent(new Event("jeyr:content-updated"));
}
function renderBrands(items) {
  const row = $("#brands-row");
  if (!row) return;
  if (!items.length) {
    row.innerHTML = `<div class="brand-tile brand-placeholder">Tu marca podría estar aquí</div><div class="brand-tile brand-placeholder">Creamos juntos</div><div class="brand-tile brand-placeholder">JEYR DESIGN</div>`;
    return;
  }
  row.innerHTML = items.slice(0,12).map(x => `
    <div class="brand-tile" title="${esc(x.name || 'Marca colaboradora')}">
      ${x.logoUrl
        ? `<img class="brand-logo" src="${esc(x.logoUrl)}" alt="${esc(x.name || 'Logotipo de marca')}" loading="lazy">`
        : `<span class="brand-name-fallback">${esc(x.name || 'Marca colaboradora')}</span>`}
    </div>`).join("");
  row.querySelectorAll(".brand-logo").forEach(img => img.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "brand-name-fallback";
    fallback.textContent = img.alt || "Marca colaboradora";
    img.replaceWith(fallback);
  }, {once:true}));
}
async function track(type, extra={}) {
  try { await addDoc(collection(db,"analyticsEvents"), {type, page:location.pathname, ...extra, createdAt:serverTimestamp()}); }
  catch(e) { /* Las reglas pueden estar pendientes de publicar. */ }
}
$("#contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget, button = form.querySelector("button"), status = $("#form-status");
  const data = Object.fromEntries(new FormData(form));
  if (!data.name || !data.message) return;
  button.disabled = true; button.textContent = "Enviando...";
  try {
    await addDoc(collection(db,"messages"), {...data, status:"new", createdAt:serverTimestamp()});
    status.textContent = "¡Consulta enviada! Gracias por escribirnos. Pronto nos pondremos en contacto.";
    form.reset(); await track("lead", {service:data.service || "Sin especificar"});
  } catch(err) {
    console.error(err);
    status.textContent = "No se pudo enviar el formulario. Escríbenos directamente por WhatsApp.";
  } finally { button.disabled = false; button.innerHTML = 'Enviar consulta <span>↗</span>'; }
});
(async function init(){
  await Promise.all([loadSettings(), getPublished("portfolio").then(renderPortfolio), getPublished("brands").then(renderBrands)]);
  track("page_view");
})();
