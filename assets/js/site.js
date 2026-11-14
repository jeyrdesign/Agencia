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
  if (!items.length) return;
  grid.innerHTML = items.slice(0,6).map((x,i) => `
    <article class="portfolio-item">
      ${x.mediaType === "video" ? `<video src="${esc(x.mediaUrl)}" muted controls playsinline preload="metadata"></video>` : `<img src="${esc(x.mediaUrl || x.imageUrl || "")}" alt="${esc(x.title)}" loading="lazy">`}
      <div class="portfolio-caption"><small>${esc(x.category || "PROYECTO")}</small><b>${esc(x.title || "JEYR DESIGN")}</b></div>
    </article>`).join("");
  $("#portfolio-note").textContent = "Proyectos seleccionados de JEYR DESIGN.";
}
function renderPackages(items) {
  if (!items.length) return;
  $("#package-grid").innerHTML = items.slice(0,6).map((x,i) => `
    <article class="package-card ${i===1?"featured":""}">
      <span>${esc(x.category || "SERVICIO")}</span><h3>${esc(x.name)}</h3>
      <p class="price">Desde <b>$${Number(x.price || 0).toFixed(0)}</b></p>
      <p>${esc(x.description || "")}</p>
      ${Array.isArray(x.features) && x.features.length ? `<ul>${x.features.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      <a href="#contacto" data-package="${esc(x.name)}">Consultar este paquete ↗</a>
    </article>`).join("");
  document.querySelectorAll("[data-package]").forEach(a => a.addEventListener("click", () => {
    const select = document.querySelector('[name="service"]');
    if (select) select.value = a.dataset.package;
  }));
}
function renderBrands(items) {
  if (!items.length) return;
  $("#brands-row").innerHTML = items.slice(0,8).map(x => x.logoUrl
    ? `<img class="brand-logo" src="${esc(x.logoUrl)}" alt="${esc(x.name)}" loading="lazy">`
    : `<span>${esc(x.name)}</span>`).join("");
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
