import { db } from "../../admin/js/firebase.js";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, limit } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const whatsappDefault = "593980478748";
const normalize = value => String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g," ").trim();
function uniqueBy(items,keyFn){const seen=new Set();return items.filter(item=>{const key=keyFn(item);if(!key||seen.has(key))return false;seen.add(key);return true;});}
function optimizedImage(url,width=1000,quality="auto:good"){
  const value=String(url||"");
  const marker="/image/upload/";
  if(!value.includes("res.cloudinary.com")||!value.includes(marker))return value;
  const start=value.indexOf(marker)+marker.length;
  const rest=value.slice(start);
  const first=rest.split("/")[0];
  const isVersion=/^v\d+$/.test(first);
  const isTransform=!isVersion&&(first.includes(",")||/^(?:f_|q_|w_|h_|c_|dpr_|e_|g_|ar_|r_|bo_|b_|t_)/.test(first));
  const existing=isTransform?first.split(","):[];
  const preserved=existing.filter(token=>!/^f_/.test(token)&&!/^q_/.test(token)&&!/^w_/.test(token)&&!/^c_limit$/.test(token));
  const transform=["f_auto",`q_${quality}`,`w_${Math.max(80,Math.round(width))}`,"c_limit",...preserved].join(",");
  const remainder=isTransform?rest.slice(first.length+1):rest;
  return value.slice(0,start)+transform+"/"+remainder;
}

$("#year").textContent = new Date().getFullYear();
$("#menu-toggle").addEventListener("click", () => $("#main-nav").classList.toggle("open"));
document.querySelectorAll("#main-nav a").forEach(a => a.addEventListener("click", () => $("#main-nav").classList.remove("open")));

// La tarjeta completa abre el portafolio de su categoría; el enlace interno conserva su destino de paquetes.
document.querySelectorAll(".service-card[data-portfolio-url]").forEach(card => {
  const navigateToCategory = event => {
    if (event.target.closest(".service-action")) return;
    const destination = card.dataset.portfolioUrl;
    if (destination) window.location.assign(new URL(destination, document.baseURI).href);
  };
  card.addEventListener("click", navigateToCategory);
  card.addEventListener("keydown", event => {
    if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    navigateToCategory(event);
  });
});

async function getPublished(name) {
  try {
    const cap = name === "portfolio" ? 60 : 80;
    const q = query(collection(db, name), where("published", "==", true), limit(cap));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({id:d.id, ...d.data()}));
    items.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
    return items;
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
    $("#whatsapp-float").setAttribute("data-jeyr-destination", `https://wa.me/${phone}`);
    const detail = document.querySelector(".contact-detail b");
    if (detail) detail.textContent = `+${phone}`;
    if (s.instagram) document.querySelector('a[data-jeyr-destination*="instagram.com"]')?.setAttribute("data-jeyr-destination", s.instagram);
    if (s.welcomeMessage) document.querySelector(".contact-left>p").textContent = s.welcomeMessage;
  } catch(e) { console.warn("Configuración pública no disponible", e); }
}
const portfolioPreviewCategories = [
  {key:"diseno-branding",label:"Diseño gráfico & branding",terms:["diseno","diseño","branding","marca","identidad","logotipo","logo","pieza grafica","publicidad"]},
  {key:"fotografia-profesional",label:"Fotografía profesional",terms:["fotografia","fotografía","foto","sesion","sesión","retrato","producto","evento","cobertura","deporte","deportiva","xv","quince"]},
  {key:"audiovisual",label:"Producción audiovisual",terms:["audiovisual","video","vídeo","reel","produccion","producción","contenido audiovisual"]},
  {key:"digitales",label:"Comunicación digital",terms:["digital","redes","social","community","campana","campaña","marketing","publicaciones","contenido"]}
];
function projectMatchesPreviewCategory(item, category) {
  const text = normalize(`${item.category||""} ${item.title||""} ${item.description||""}`);
  return category.terms.some(term => text.includes(normalize(term)));
}
function renderPortfolio(items) {
  const grid = $("#portfolio-grid");
  if (!grid) return;
  const uniqueItems = uniqueBy(items, x => `${normalize(x.title)}|${normalize(x.category)}`);
  grid.classList.add("portfolio-category-grid");
  grid.innerHTML = portfolioPreviewCategories.map((category,index) => {
    const project = uniqueItems.find(item => projectMatchesPreviewCategory(item,category));
    const cover = project?.coverUrl || project?.mediaUrl || project?.imageUrl || "";
    const target = `galeria.html?categoria=${encodeURIComponent(category.key)}`;
    const image = cover
      ? `<img src="${esc(optimizedImage(cover,760))}" alt="${esc(category.label)}" loading="lazy" decoding="async">`
      : `<div class="portfolio-category-fallback"><span>${String(index+1).padStart(2,"0")}</span><b>${esc(category.label)}</b></div>`;
    return `<a class="portfolio-item portfolio-category-card" href="${target}" aria-label="Ver todos los proyectos de ${esc(category.label)}">
      ${image}
      <div class="portfolio-caption"><small>CATEGORÍA ${String(index+1).padStart(2,"0")}</small><b>${esc(category.label)}</b><span class="portfolio-open">Explorar categoría ↗</span></div>
    </a>`;
  }).join("");
  $("#portfolio-note").textContent = "Una vista previa de nuestras cuatro áreas creativas. Explora cada categoría o visita el portafolio completo.";
  document.dispatchEvent(new Event("jeyr:content-updated"));
}
function renderBrands(items) {
  items=uniqueBy(items,x=>x.logoHash||x.logoUrl||normalize(x.name));
  const row = $("#brands-row");
  if (!row) return;
  if (!items.length) {
    row.innerHTML = `<div class="brand-tile brand-placeholder">Tu marca podría estar aquí</div><div class="brand-tile brand-placeholder">Creamos juntos</div><div class="brand-tile brand-placeholder">JEYR DESIGN</div>`;
    return;
  }
  row.innerHTML = items.slice(0,12).map((x,i) => `
    <div class="brand-tile" title="${esc(x.name || 'Marca colaboradora')}">
      ${x.logoUrl
        ? `<img class="brand-logo" src="${esc(optimizedImage(x.logoUrl,320,"auto:eco"))}" alt="${esc(x.name || 'Logotipo de marca')}" width="150" height="72" loading="lazy" decoding="async"${i<3?' fetchpriority="high"':''} sizes="(max-width: 650px) 42vw, 150px">`
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
  track("page_view");
  await Promise.all([loadSettings(), getPublished("portfolio").then(renderPortfolio), getPublished("brands").then(renderBrands)]);
})();
