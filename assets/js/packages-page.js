import { db } from "../../admin/js/firebase.js";
import { collection, getDocs, query, where, getDoc, doc, addDoc, serverTimestamp, limit } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = (selector) => document.querySelector(selector);
const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const config = {
  diseno: {title:"Diseño gráfico & branding", eyebrow:"01 / IDENTIDAD VISUAL", intro:"Ideas, conceptos y sistemas gráficos que construyen marcas reconocibles.", aliases:["diseño gráfico & branding","diseño gráfico","branding"], terms:["diseno","diseño","branding","marca","identidad","grafico","gráfico","publicidad","logo","logotipo"], fallback:[]},
  fotografia: {title:"Fotografía profesional", eyebrow:"02 / IMAGEN Y RETRATO", intro:"Creamos imágenes que cuentan historias. Encuentra la sesión o cobertura adecuada para tu proyecto.", aliases:["fotografía profesional","fotografía"], terms:["foto","fotografia","fotografía","sesion","sesión","retrato","cobertura","evento","producto","estudio","exterior"], fallback:[
    {name:"Sesión Esencial",category:"Fotografía · Exteriores",price:65,description:"Una sesión para crear fotografías naturales y cuidadas.",features:["1 hora de sesión","11 fotografías editadas","Entrega digital","Perfeccionamiento de detalles"]},
    {name:"Sesión Profesional",category:"Fotografía · Estudio",price:85,description:"Una experiencia de estudio con atención al detalle y acabado profesional.",features:["1 hora de sesión","11 fotografías editadas","Entrega digital","Perfeccionamiento de detalles"]},
    {name:"Evento / Cobertura Especial",category:"Fotografía · Eventos",price:70,description:"Cobertura fotográfica adaptada al tipo y duración del evento.",features:["Cobertura según evento","Selección y edición fotográfica","Entrega digital","Cotización según requerimientos"]}
  ]},
  audiovisual: {title:"Producción audiovisual", eyebrow:"03 / PRODUCCIÓN VISUAL", intro:"Producciones audiovisuales pensadas para transmitir, emocionar y captar atención.", aliases:["producción audiovisual","audiovisual"], terms:["audiovisual","video","vídeo","reel","produccion","producción","film","grabacion","grabación","edicion","edición"], fallback:[]},
  digitales: {title:"Gestión de redes & creación de contenidos", eyebrow:"04 / GESTIÓN DIGITAL", intro:"Estrategia, gestión de redes sociales y producción de contenidos para construir una presencia digital consistente.", aliases:["paquetes digitales","gestión de redes + creación de contenidos","gestion de redes y creacion de contenidos","gestión digital","comunicación digital"], terms:["digital","contenido","redes","social","community","campana","campaña","marketing","publicaciones"], fallback:[]}
};
const category = document.body.dataset.category;
const current = config[category] || config.fotografia;
const whatsapp = "593980478748";
async function trackPage(){try{await addDoc(collection(db,"analyticsEvents"),{type:"page_view",page:location.pathname,createdAt:serverTimestamp()});}catch(e){console.warn("No se pudo registrar la visita",e);}}

function whatsappLink(name) {
  const message = `Hola JEYR DESIGN, deseo información sobre el paquete ${name}.`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
function render(items, usingFallback = false) {
  const grid = $("#package-list");
  if (!items.length) {
    grid.innerHTML = `<div class="package-empty"><span>PRÓXIMAMENTE</span><h2>Estamos preparando esta categoría.</h2><p>Cuéntanos qué necesitas y elaboraremos una propuesta para tu proyecto.</p><a class="btn btn-primary" href="${whatsappLink(current.title)}" target="_blank" rel="noopener">Solicitar una propuesta ↗</a></div>`;
    $("#package-count").textContent = "Paquetes personalizados bajo cotización.";
    return;
  }
  grid.innerHTML = items.map((item, index) => `
    <article class="package-card ${index === 1 ? "featured" : ""}">
      <span>${esc(item.category || current.title)}</span>
      <h2>${esc(item.name || "Paquete JEYR DESIGN")}</h2>
      <p class="price">Desde <b>$${Number(item.price || 0).toLocaleString("es-EC",{minimumFractionDigits:0,maximumFractionDigits:2})}</b></p>
      <p class="package-description">${esc(item.description || "Solución creativa desarrollada según tus objetivos.")}</p>
      ${Array.isArray(item.features) && item.features.length ? `<ul>${item.features.map(feature => `<li>${esc(feature)}</li>`).join("")}</ul>` : ""}
      <a class="package-cta" href="${whatsappLink(item.name || current.title)}" target="_blank" rel="noopener">Consultar este paquete <b>↗</b></a>
    </article>`).join("");
  $("#package-count").textContent = usingFallback ? "Opciones iniciales de fotografía. Confirma disponibilidad y detalles por WhatsApp." : `${items.length} paquete(s) disponible(s) en esta categoría.`;
}

async function init() {
  $("#category-eyebrow").textContent = current.eyebrow;
  $("#category-title").textContent = current.title;
  $("#category-intro").textContent = current.intro;
  document.title = `${current.title} | JEYR DESIGN`;
  try {
    const snapshot = await getDocs(query(collection(db, "packages"), where("published", "==", true), limit(100)));
    const raw = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
    const seen = new Set();
    const all = raw.filter(item => {const key=`${normalize(item.name)}|${normalize(item.category)}`;if(seen.has(key))return false;seen.add(key);return true;});
    const aliases=(current.aliases||[]).map(normalize);
    const filtered = all.filter(item => {
      const categoryName=normalize(item.category||"");
      if(aliases.some(alias=>categoryName===alias||categoryName.includes(alias)||alias.includes(categoryName))) return true;
      if(category==="digitales") return /digital|redes|social|contenido|community|marketing/.test(categoryName);
      return current.terms.some(term => categoryName.includes(normalize(term)));
    });
    if (filtered.length) render(filtered);
    else render(current.fallback, current.fallback.length > 0);
  } catch (error) {
    console.error("No se pudieron cargar los paquetes", error);
    render(current.fallback, current.fallback.length > 0);
    if (!current.fallback.length) $("#package-count").textContent = "No pudimos conectar con el catálogo en este momento. Puedes consultarnos por WhatsApp.";
  }
  try {
    const settings = await getDoc(doc(db, "siteSettings", "public"));
    if (settings.exists()) {
      const phone = String(settings.data().whatsapp || whatsapp).replace(/\D/g, "");
      document.querySelectorAll("[data-whatsapp]").forEach(link => link.setAttribute("data-jeyr-destination", `https://wa.me/${phone}`));
    }
  } catch (error) { console.warn("No se pudo leer la configuración pública", error); }
  trackPage();
}
init();
