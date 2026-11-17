import { db } from "../../admin/js/firebase.js";
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const whatsappDefault = "593980478748";
let allPackages = [];
let activePackageCategory = "all";
const packageTerms = {diseno:["diseno","diseño","branding","marca","identidad","grafico","gráfico","publicidad"],fotografia:["foto","fotografia","fotografía","sesion","sesión","retrato","cobertura","evento","producto"],audiovisual:["audiovisual","video","vídeo","reel","produccion","producción","film"],digital:["digital","contenido","redes","social","community","campaña","campana"]};
const normalize = value => String(value||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"");

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
  if (!items.length) return;
  grid.innerHTML = items.slice(0,6).map((x,i) => `
    <article class="portfolio-item">
      ${x.mediaType === "video" ? `<video src="${esc(x.mediaUrl)}" muted controls playsinline preload="metadata"></video>` : `<img src="${esc(x.mediaUrl || x.imageUrl || "")}" alt="${esc(x.title)}" loading="lazy">`}
      <div class="portfolio-caption"><small>${esc(x.category || "PROYECTO")}</small><b>${esc(x.title || "JEYR DESIGN")}</b></div>
    </article>`).join("");
  $("#portfolio-note").textContent = "Proyectos seleccionados de JEYR DESIGN.";
}
function renderPackages(items) {
  allPackages = items;
  drawPackages();
}
function drawPackages() {
  const grid = $("#package-grid");
  const status = $("#package-filter-status");
  const terms = packageTerms[activePackageCategory] || [];
  const filtered = activePackageCategory === "all" ? allPackages : allPackages.filter(item => {
    const haystack = normalize([item.category,item.name,item.description,...(item.features||[])].join(" "));
    return terms.some(term => haystack.includes(normalize(term)));
  });
  const fallback = activePackageCategory === "all" && !allPackages.length;
  if (fallback) {
    grid.innerHTML = `
      <article class="package-card"><span>FOTOGRAFÍA</span><h3>Sesión Esencial</h3><p class="price">Desde <b>$65</b></p><p>1 hora de sesión · 11 fotografías retocadas profesionalmente · entrega digital. Bonus: hasta 1 hora y media según disponibilidad del fotógrafo.</p><a href="#contacto" data-package="Sesión Esencial">Consultar disponibilidad ↗</a></article>
      <article class="package-card featured"><span>FOTOGRAFÍA</span><h3>Sesión Profesional</h3><p class="price">Desde <b>$85</b></p><p>1 hora de sesión · 11 fotografías retocadas profesionalmente · entrega digital y perfeccionamiento de detalles.</p><a href="#contacto" data-package="Sesión Profesional">Consultar disponibilidad ↗</a></article>
      <article class="package-card"><span>COBERTURAS</span><h3>Evento / Cobertura</h3><p class="price">Desde <b>$70</b></p><p>Cobertura según el evento, selección y edición de fotografías y entrega digital.</p><a href="#contacto" data-package="Evento / Cobertura">Consultar disponibilidad ↗</a></article>`;
    status.textContent = "Opciones iniciales de fotografía. Los demás paquetes aparecerán al publicarlos desde el administrador.";
  } else if (!filtered.length) {
    grid.innerHTML = `<div class="empty-dynamic"><b>Aún no hay paquetes publicados en esta categoría.</b><p>Escríbenos y prepararemos una propuesta para tu proyecto.</p><a class="btn btn-primary" href="#contacto">Solicitar una propuesta ↗</a></div>`;
    status.textContent = "Categoría seleccionada: " + (document.querySelector(`[data-service-category="${activePackageCategory}"] h3`)?.innerText.replace(/\s+/g," ") || "Servicio");
  } else {
    grid.innerHTML = filtered.map((x,i) => `
      <article class="package-card ${i===1?"featured":""}">
        <span>${esc(x.category || "SERVICIO")}</span><h3>${esc(x.name)}</h3>
        <p class="price">Desde <b>$${Number(x.price || 0).toFixed(0)}</b></p>
        <p>${esc(x.description || "")}</p>
        ${Array.isArray(x.features) && x.features.length ? `<ul>${x.features.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>` : ""}
        <a href="#contacto" data-package="${esc(x.name)}">Consultar este paquete ↗</a>
      </article>`).join("");
    status.textContent = activePackageCategory === "all" ? "Todos nuestros paquetes disponibles." : `Mostrando ${filtered.length} paquete(s) de esta categoría.`;
  }
  document.querySelectorAll("[data-package]").forEach(a => a.addEventListener("click", () => {
    const select = document.querySelector('[name="service"]');
    if (select) select.value = a.dataset.package;
  }));
}
function selectServiceCategory(category) {
  activePackageCategory = category;
  drawPackages();
  location.hash = "paquetes";
  setTimeout(() => $("#paquetes")?.scrollIntoView({behavior:"smooth",block:"start"}), 40);
}
document.querySelectorAll("[data-service-category]").forEach(card => {
  card.addEventListener("click", () => selectServiceCategory(card.dataset.serviceCategory));
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectServiceCategory(card.dataset.serviceCategory); } });
});

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
  await Promise.all([loadSettings(), getPublished("portfolio").then(renderPortfolio), getPublished("packages").then(renderPackages), getPublished("brands").then(renderBrands)]);
  track("page_view");
})();
