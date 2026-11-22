import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = s => document.querySelector(s);
const S = { user:null, data:{portfolio:[],videos:[],brands:[],socialBrands:[],packages:[],messages:[]}, loaded:{}, kind:null, item:null, busy:false, analytics:[] };
const CLOUDINARY_DEFAULTS = { cloudName:"bktloafr", uploadPreset:"jeyr_unsigned" };
let cloudConfigPromise = null;
const names = {social:"Gestión digital",overview:"Resumen general",portfolio:"Portafolio",videos:"Videos de YouTube",brands:"Marcas colaboradoras",packages:"Servicios y paquetes",messages:"Mensajes",analytics:"Estadísticas",settings:"Configuración"};
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const note = s => { $("#notice").textContent = s; };
const dateOf = v => v?.toDate ? v.toDate() : (v instanceof Date ? v : null);

function readableError(err) {
  if (err?.code?.includes("permission-denied")) return "Firestore denegó el permiso. Verifica la cuenta administradora y las reglas.";
  if (err?.code?.includes("failed-precondition")) return "Firestore necesita revisar un índice o una regla. Consulta la consola del navegador.";
  return `No se pudo guardar. ${err?.message || "Comprueba la conexión e inténtalo nuevamente."}`;
}
async function rows(name, force=false) {
  if (!force && S.loaded[name]) return S.data[name];
  const snap = await getDocs(collection(db,name));
  const data = snap.docs.map(d=>({id:d.id,...d.data()}));
  data.sort((a,b)=>(dateOf(b.createdAt)?.getTime()||0)-(dateOf(a.createdAt)?.getTime()||0));
  S.data[name]=data; S.loaded[name]=true;
  return data;
}
async function go(view) {
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===view));
  document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  $("#title").textContent=names[view]||"JEYR ADMIN";
  try {
    if(view==="portfolio"){await rows("portfolio");drawPortfolio();}
    if(view==="videos"){await rows("videos");drawVideos();}
    if(view==="brands"){await rows("brands");drawBrands();}
    if(view==="social"){await rows("socialBrands");drawSocialBrands();}
    if(view==="packages"){await rows("packages");drawPackages();}
    if(view==="messages") await drawMessages();
    if(view==="analytics") await analytics();
    if(view==="settings") await settingsLoad();
  } catch(err){console.error(err);note(readableError(err));}
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
$("#logout").addEventListener("click",async()=>{await signOut(auth);location.href="./index.html";});
onAuthStateChanged(auth,async user=>{
  if(!user){location.replace("./index.html");return;}
  S.user=user; $("#admin-email").textContent=user.email||"Administrador";
  try {
    const admin=await getDoc(doc(db,"admins",user.uid));
    if(!admin.exists()||admin.data().active!==true||admin.data().role!=="owner") { await signOut(auth); location.replace("./index.html"); return; }
    await overview();
  } catch(err) { console.error(err); note("No se pudo validar el administrador. Comprueba Firestore y sus reglas."); }
});

async function getAnalytics(days=30) {
  const start=Timestamp.fromDate(new Date(Date.now()-days*86400000));
  const snap=await getDocs(query(collection(db,"analyticsEvents"),where("createdAt",">=",start),orderBy("createdAt","desc"),limit(5000)));
  return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(dateOf(a.createdAt)?.getTime()||0)-(dateOf(b.createdAt)?.getTime()||0));
}
async function overview() {
  const [portfolio,messages,packages,events]=await Promise.all([rows("portfolio"),rows("messages"),rows("packages"),getAnalytics(30).catch(err=>{console.warn("Analytics no disponible",err);return []})]);
  S.analytics=events;
  $("#projects").textContent=portfolio.filter(x=>x.published===true).length;
  $("#active-packages").textContent=packages.filter(x=>x.published===true).length;
  const unread=messages.filter(x=>(x.status||"new")==="new").length;
  $("#new-messages").textContent=unread; $("#unread").textContent=unread||"";
  $("#visits").textContent=events.filter(x=>x.type==="page_view").length;
  $("#recent").innerHTML=messages.slice(0,4).map(x=>`<div class="message"><b>${esc(x.name||"Sin nombre")}</b><p>${esc(x.message||"")}</p></div>`).join("")||"Sin mensajes todavía.";
}

async function cloudinaryConfig() {
  if(!cloudConfigPromise) cloudConfigPromise=(async()=>{
    const snap=await getDoc(doc(db,"siteSettings","public"));
    const cfg=snap.exists()?snap.data():{};
    const cloudName=String(cfg.cloudinaryCloudName||CLOUDINARY_DEFAULTS.cloudName).trim();
    const uploadPreset=String(cfg.cloudinaryUploadPreset||CLOUDINARY_DEFAULTS.uploadPreset).trim();
    if(!cloudName||!uploadPreset) throw new Error("Falta configurar Cloudinary en Configuración.");
    return {cloudName,uploadPreset};
  })().catch(err=>{cloudConfigPromise=null;throw err;});
  return cloudConfigPromise;
}
const IMAGE_LIMIT = 10*1024*1024;
const IMAGE_TARGET = 9.5*1024*1024;

async function compressImageIfNeeded(file) {
  if(file.size<=IMAGE_TARGET) return file;
  if(file.type==="image/svg+xml") throw new Error("Este SVG supera 10 MB. Optimízalo como SVG o expórtalo a PNG/WebP antes de subirlo.");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Formato de imagen no compatible para optimización. Usa JPG, PNG, WEBP o SVG.");
  note(`Optimizando ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)…`);
  let bitmap;
  try {
    bitmap=await createImageBitmap(file);
    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx) throw new Error("El navegador no pudo preparar la imagen.");
    let scale=Math.min(1,3000/Math.max(bitmap.width,bitmap.height));
    let blob=null;
    for(let resize=0;resize<8;resize++){
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));
      canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for(const quality of [0.88,0.82,0.76,0.70,0.64,0.58,0.52]){
        blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",quality));
        if(blob&&blob.size<=IMAGE_TARGET) {
          const base=file.name.replace(/\.[^.]+$/,"")||"imagen";
          const optimized=new File([blob],`${base}.webp`,{type:"image/webp",lastModified:Date.now()});
          note(`Imagen optimizada: ${(file.size/1024/1024).toFixed(1)} MB → ${(optimized.size/1024/1024).toFixed(1)} MB.`);
          return optimized;
        }
      }
      scale*=0.82;
    }
    throw new Error("No se pudo reducir esta imagen por debajo de 10 MB sin una pérdida excesiva. Reduce sus dimensiones y vuelve a intentarlo.");
  } catch(err) {
    if(err?.message?.includes("10 MB")||err?.message?.includes("SVG")||err?.message?.includes("compatible")) throw err;
    throw new Error(err?.message||"No se pudo optimizar la imagen en este navegador.");
  } finally {
    bitmap?.close?.();
  }
}

async function uploadToCloudinary(file,folder,resourceType="image") {
  if(!file||!file.size) throw new Error("Selecciona un archivo.");
  const isVideo=resourceType==="video", max=isVideo?100*1024*1024:IMAGE_LIMIT;
  if(isVideo&&file.size>max) throw new Error("El video supera el límite de 100 MB.");
  const allowed=isVideo?["video/mp4","video/webm"]:["image/jpeg","image/png","image/webp","image/svg+xml"];
  if(!allowed.includes(file.type)) throw new Error(isVideo?"Usa MP4 o WEBM.":"Usa JPG, PNG, WEBP o SVG.");
  const uploadFile=isVideo?file:await compressImageIfNeeded(file);
  if(uploadFile.size>max) throw new Error(`La fotografía sigue superando el límite individual de 10 MB después de optimizarla.`);
  const {cloudName,uploadPreset}=await cloudinaryConfig();
  const body=new FormData(); body.append("file",uploadFile); body.append("upload_preset",uploadPreset); body.append("folder",`jeyr-design/${folder}`);
  const endpoint=`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${isVideo?"video":"image"}/upload`;
  let response;
  try { response=await fetch(endpoint,{method:"POST",body}); } catch { throw new Error("No se pudo conectar con Cloudinary. Comprueba tu conexión."); }
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(result?.error?.message||`Cloudinary rechazó la carga (HTTP ${response.status}).`);
  if(!result.secure_url) throw new Error("Cloudinary no devolvió una URL segura.");
  return result.secure_url;
}
async function fingerprint(file) {
  if(globalThis.crypto?.subtle) {
    const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  return `${normalize(file.name)}-${file.size}-${file.lastModified}`;
}
function parseYouTubeId(value) {
  const raw=String(value||"").trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  let url; try { url=new URL(raw); } catch { return ""; }
  const host=url.hostname.toLowerCase().replace(/^www\./,"");
  if(!(host==="youtu.be"||host==="youtube.com"||host.endsWith(".youtube.com")||host==="youtube-nocookie.com")) return "";
  let id="";
  if(host==="youtu.be") id=url.pathname.split("/").filter(Boolean)[0]||"";
  else if(url.pathname==="/watch") id=url.searchParams.get("v")||"";
  else { const parts=url.pathname.split("/").filter(Boolean); if(["embed","shorts","live","v"].includes(parts[0])) id=parts[1]||""; }
  return /^[A-Za-z0-9_-]{11}$/.test(id)?id:"";
}

function duplicateKey(kind,data) {
  if(kind==="brands"||kind==="socialBrands") return normalize(data.name);
  if(kind==="packages") return `${normalize(data.name)}|${normalize(data.category)}`;
  return `${normalize(data.title)}|${normalize(data.category)}`;
}
async function saveRecord(kind,item,data) {
  const key=duplicateKey(kind,data);
  let ref;
  if(item) ref=doc(db,kind,item.id);
  else {
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key));
    const id=[...new Uint8Array(bytes)].slice(0,20).map(b=>b.toString(16).padStart(2,"0")).join("");
    ref=doc(db,kind,`unique_${id}`);
  }
  await runTransaction(db,async tx=>{
    const existing=await tx.get(ref);
    if(item&&!existing.exists()) throw new Error("Este registro ya no existe. Actualiza la lista e inténtalo de nuevo.");
    if(!item&&existing.exists()) throw new Error("Ya existe un registro con ese nombre y categoría. Edita el existente para evitar duplicados.");
    if(item) tx.update(ref,{...data,normalizedName:key});
    else tx.set(ref,{...data,normalizedName:key,createdAt:serverTimestamp()});
  });
}

function editor(kind,item=null) {
  S.kind=kind; S.item=item;
  let html="";
  if(kind==="portfolio") html=`
    <label>Título del evento/proyecto<input name="title" required maxlength="100" value="${esc(item?.title)}"></label>
    <label>Categoría<select name="category" required>
      ${["Fotografía","Eventos","Deportes","XV años","Diseño gráfico","Branding","Producción audiovisual",...(item?.category&&!['Fotografía','Eventos','Deportes','XV años','Diseño gráfico','Branding','Producción audiovisual'].includes(item.category)?[item.category]:[])].map(v=>`<option value="${esc(v)}" ${item?.category===v?"selected":(!item&&v==="Fotografía"?"selected":"")}>${esc(v)}</option>`).join("")}
    </select></label>
    <label class="wide">Descripción<textarea name="description" maxlength="1200">${esc(item?.description)}</textarea></label>
    <label>Portada del evento<input name="cover" type="file" accept="image/png,image/jpeg,image/webp"></label>
    <label class="wide featured-toggle"><input type="checkbox" name="featured" value="true" ${item?.featured===true?"checked":""}><span>Mostrar este proyecto en «03 / TRABAJO SELECCIONADO»</span></label>
    <p class="hint wide">En la página principal se mostrarán hasta cuatro proyectos seleccionados. La portada conservará su proporción original.</p>
    <label>Fotografías de la galería<input name="gallery" type="file" accept="image/png,image/jpeg,image/webp" multiple></label>
    <p class="hint wide">Puedes seleccionar varias fotos. El límite de 10 MB se aplica a cada fotografía por separado, no al peso total de la galería. Las imágenes que superen 9,5 MB se optimizan automáticamente. Se omitirán archivos repetidos y se conservarán las fotografías ya guardadas.</p>
    ${Array.isArray(item?.galleryImages)&&item.galleryImages.length?`<div class="wide existing-gallery-wrap"><b>Fotografías actuales</b><p class="hint">Marca las que deseas quitar de esta galería.</p><div class="existing-gallery">${item.galleryImages.map((photo,i)=>{const url=typeof photo==="string"?photo:photo?.url;const name=typeof photo==="object"?(photo.name||`Fotografía ${i+1}`):`Fotografía ${i+1}`;return `<label class="existing-photo"><input type="checkbox" name="removeGallery" value="${i}"><img src="${esc(url||"")}" alt=""><span>${esc(name)}</span></label>`;}).join("")}</div></div>`:""}
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>
    <div class="wide hint">${item?.galleryImages?.length||0} fotografías guardadas.</div>`;
  if(kind==="videos") html=`
    <label class="wide">Título del video<input name="title" required maxlength="100" value="${esc(item?.title)}"></label>
    <label>Categoría<select name="category" required>
      ${["Producción audiovisual","Fotografía","Eventos","Deportes","XV años","Diseño gráfico","Branding",...(item?.category&&!['Producción audiovisual','Fotografía','Eventos','Deportes','XV años','Diseño gráfico','Branding'].includes(item.category)?[item.category]:[])].map(v=>`<option value="${esc(v)}" ${item?.category===v?"selected":(!item&&v==="Producción audiovisual"?"selected":"")}>${esc(v)}</option>`).join("")}
    </select></label>
    <label class="wide">Enlace de YouTube<input name="youtubeUrl" type="url" required placeholder="https://www.youtube.com/watch?v=..." value="${esc(item?.youtubeUrl)}"></label>
    <p class="hint wide">Acepta enlaces de YouTube normales, Shorts y youtu.be. El video debe estar Público o No listado para poder reproducirse en la web.</p>
    <label class="wide">Descripción<textarea name="description" maxlength="1200">${esc(item?.description)}</textarea></label>
    <label class="wide">Imagen de miniatura para la categoría<input name="categoryCover" type="file" accept="image/png,image/jpeg,image/webp"></label>
    ${item?.categoryCoverUrl?`<div class="wide category-cover-preview"><img src="${esc(item.categoryCoverUrl)}" alt="Miniatura audiovisual actual"><span>Miniatura personalizada actual. Si no seleccionas otra imagen, se conservará.</span></div>`:""}
    <label class="wide featured-toggle"><input type="checkbox" name="featured" value="true" ${item?.featured===true?"checked":""}><span>Usar esta miniatura en la categoría «Producción audiovisual» del panel inicial</span></label>
    <p class="hint wide">Si subes una imagen y activas esta opción, se usará esa imagen en la tarjeta inicial. Si no subes una, se utilizará la miniatura automática de YouTube. El video seguirá apareciendo en el portafolio completo.</p>
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>`;
  if(kind==="brands") html=`
    <label>Nombre de la marca<input name="name" required maxlength="100" value="${esc(item?.name)}"></label>
    <label>Logotipo<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" ${item?"":"required"}></label>
    <label>Enlace<input name="url" type="url" value="${esc(item?.url)}"></label>
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>`;
  if(kind==="socialBrands") html=`
    <label>Nombre de la marca<input name="name" required maxlength="100" value="${esc(item?.name)}"></label>
    <label>Logotipo (opcional)<input name="socialLogo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
    <label class="wide">Enlace del perfil social<input name="profileUrl" type="url" placeholder="https://www.instagram.com/marca/" value="${esc(item?.profileUrl)}"></label>
    <label class="wide">Descripción<textarea name="description" maxlength="800">${esc(item?.description)}</textarea></label>
    <div class="wide"><h3>Estadísticas actuales</h3><p class="hint">Registra los datos desde Instagram Insights o Meta Business Suite. No son cifras en tiempo real.</p></div>
    <label>Seguidores<input name="followers" type="number" min="0" step="1" value="${esc(item?.stats?.followers??"")}"></label>
    <label>Alcance<input name="reach" type="number" min="0" step="1" value="${esc(item?.stats?.reach??"")}"></label>
    <label>Interacciones<input name="interactions" type="number" min="0" step="1" value="${esc(item?.stats?.interactions??"")}"></label>
    <label>Reproducciones<input name="views" type="number" min="0" step="1" value="${esc(item?.stats?.views??"")}"></label>
    <label>Periodo analizado<input name="period" placeholder="Últimos 30 días" value="${esc(item?.stats?.period||"Últimos 30 días")}"></label>
    <label>Fecha de actualización<input name="updatedAtText" placeholder="20/11/2026" value="${esc(item?.stats?.updatedAt||"")}"></label>
    <label class="wide">Evolución mensual (una línea por mes: AAAA-MM|seguidores|alcance|interacciones|reproducciones)<textarea name="history" rows="5" placeholder="2026-09|10500|62000|1400|72000&#10;2026-10|11200|71000|1650|89000&#10;2026-11|12500|85200|1900|120000">${esc((item?.history||[]).map(h=>[h.month,h.followers,h.reach??"",h.interactions??"",h.views??""].join("|")).join("\n"))}</textarea></label>
    <label class="wide">Publicaciones (tipo|título|URL|alcance|reproducciones|interacciones). Los tres últimos datos son opcionales.<textarea name="posts" rows="5" placeholder="Reel|Campaña de temporada|https://www.instagram.com/reel/.../|24000|32000|1800&#10;Diseño|Promoción de noviembre|https://res.cloudinary.com/...|6500||420">${esc((item?.posts||[]).map(p=>[p.type,p.title,p.url||p.mediaUrl||"",p.reach??"",p.views??"",p.interactions??""].join("|")).join("\n"))}</textarea></label>
    <label class="wide">Subir fotografías y diseños<input name="socialMedia" type="file" accept="image/png,image/jpeg,image/webp" multiple></label>
    <p class="hint wide">Los enlaces de Instagram deben ser públicos y permitir inserción. Las imágenes que subas se alojan en Cloudinary. Los vídeos se muestran desde Instagram o YouTube mediante enlace.</p>
    <label>Mostrar en la web<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>`;
  if(kind==="packages") html=`
    <label>Nombre<input name="name" required maxlength="100" value="${esc(item?.name)}"></label>
    <label>Categoría<select name="category" required>
      ${["Diseño gráfico & branding","Fotografía profesional","Producción audiovisual","Gestión de redes + creación de contenidos","Paquetes Digitales",...(item?.category&&!['Diseño gráfico & branding','Fotografía profesional','Producción audiovisual','Gestión de redes + creación de contenidos','Paquetes Digitales'].includes(item.category)?[item.category]:[])].map(v=>`<option value="${esc(v)}" ${item?.category===v?"selected":""}>${esc(v)}</option>`).join("")}
    </select></label>
    <label>Precio desde USD<input name="price" type="number" min="0" step=".01" required value="${esc(item?.price)}"></label>
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>
    <label class="wide">Descripción<textarea name="description" maxlength="1200">${esc(item?.description)}</textarea></label>
    <label class="wide">Incluye (una línea por elemento)<textarea name="features">${esc((item?.features||[]).join("\n"))}</textarea></label>
    <label class="wide">Imagen de miniatura para Gestión de redes / Comunicación digital<input name="categoryCover" type="file" accept="image/png,image/jpeg,image/webp"></label>
    ${item?.categoryCoverUrl?`<div class="wide category-cover-preview"><img src="${esc(item.categoryCoverUrl)}" alt="Miniatura digital actual"><span>Miniatura personalizada actual. Si no seleccionas otra imagen, se conservará.</span></div>`:""}
    <label class="wide featured-toggle"><input type="checkbox" name="categoryFeatured" value="true" ${item?.categoryFeatured===true?"checked":""}><span>Usar esta imagen como miniatura de la categoría en el panel inicial</span></label>
    <p class="hint wide">Esta opción se aplica cuando la categoría del paquete es «Gestión de redes + creación de contenidos». La miniatura es independiente de las imágenes y publicaciones de cada marca.</p>`;
  $("#editor-title").textContent=(item?"Editar ":"Nuevo ")+({portfolio:"proyecto",videos:"video de YouTube",brands:"marca",socialBrands:"marca digital",packages:"paquete"}[kind]);
  $("#fields").innerHTML=html; $("#editor").showModal();
}
$("#close").onclick=$("#cancel").onclick=()=>$("#editor").close();
$("#new-portfolio").onclick=()=>editor("portfolio"); $("#new-video").onclick=()=>editor("videos"); $("#new-brand").onclick=()=>editor("brands"); $("#new-social").onclick=()=>editor("socialBrands"); $("#new-package").onclick=()=>editor("packages");
$("#editor-form").addEventListener("submit",async e=>{
  e.preventDefault(); if(S.busy)return; S.busy=true;
  const form=e.currentTarget, submit=form.querySelector('button[type="submit"]')||form.querySelector('footer button:last-child');
  if(submit){submit.disabled=true;submit.textContent="Guardando…";}
  const f=new FormData(form),kind=S.kind,item=S.item;
  const data={published:f.get("published")==="true",updatedAt:serverTimestamp()};
  try {
    if(kind==="portfolio") {
      data.title=String(f.get("title")||"").trim(); data.category=String(f.get("category")||"Fotografía").trim(); data.description=String(f.get("description")||"").trim(); data.featured=f.get("featured")==="true";
      const key=duplicateKey(kind,data), local=S.data.portfolio.find(x=>x.id!==item?.id&&duplicateKey(kind,x)===key);
      if(local) throw new Error("Ya existe un proyecto con ese título y categoría. Abre el existente para actualizarlo.");
      const cover=f.get("cover"); let coverUrl=item?.coverUrl||item?.mediaUrl||item?.imageUrl||"";
      if(cover?.size) coverUrl=await uploadToCloudinary(cover,"portfolio/covers");
      if(!coverUrl) throw new Error("Selecciona una imagen de portada para el evento.");
      const files=Array.from(f.getAll("gallery")).filter(x=>x instanceof File&&x.size);
      const removeIndexes=new Set(f.getAll("removeGallery").map(Number));
      const galleryImages=Array.isArray(item?.galleryImages)?item.galleryImages.filter((photo,i)=>!removeIndexes.has(i)).filter((photo,i,all)=>{const url=typeof photo==="string"?photo:photo?.url;return url&&all.findIndex(other=>(typeof other==="string"?other:other?.url)===url)===i;}):[];
      const hashes=new Set(galleryImages.map(x=>typeof x==="object"?(x.hash||""):"").filter(Boolean));
      const newFiles=[];
      for(const file of files){const hash=await fingerprint(file);if(hashes.has(hash))continue;hashes.add(hash);newFiles.push({file,hash});}
      if(newFiles.length){
        // El límite de 10 MB se aplica a CADA archivo individual, nunca a la suma de la galería.
        // La carga secuencial evita picos de memoria y facilita identificar exactamente qué foto falla.
        for(const current of newFiles){
          try {
            note(`Subiendo fotografía ${newFiles.indexOf(current)+1} de ${newFiles.length}: ${current.file.name}`);
            current.url=await uploadToCloudinary(current.file,"portfolio/galleries");
          } catch(uploadError) {
            throw new Error(`No se pudo subir "${current.file.name}": ${uploadError?.message||"error de carga"}`);
          }
        }
        newFiles.forEach(x=>galleryImages.push({url:x.url,name:x.file.name,hash:x.hash,size:x.file.size,createdAt:Date.now()}));
      }
      if(!galleryImages.length&&item?.mediaUrl&&!item?.galleryImages?.length&&item.mediaType!=="video") galleryImages.push({url:item.mediaUrl,name:item.title||"Fotografía"});
      Object.assign(data,{coverUrl,mediaUrl:coverUrl,mediaType:"image",galleryImages,galleryCount:galleryImages.length});
    }
    if(kind==="videos") {
      data.title=String(f.get("title")||"").trim();
      data.category=String(f.get("category")||"Producción audiovisual").trim();
      data.description=String(f.get("description")||"").trim();
      data.featured=f.get("featured")==="true";
      const categoryCover=f.get("categoryCover");
      data.categoryCoverUrl=item?.categoryCoverUrl||"";
      if(categoryCover?.size) data.categoryCoverUrl=await uploadToCloudinary(categoryCover,"category-covers/audiovisual");
      const suppliedUrl=String(f.get("youtubeUrl")||"").trim();
      const youtubeId=parseYouTubeId(suppliedUrl);
      if(!youtubeId) throw new Error("El enlace no parece ser un video válido de YouTube. Comprueba la URL.");
      if(S.data.videos.some(x=>x.id!==item?.id&&x.youtubeId===youtubeId)) throw new Error("Este video de YouTube ya está registrado.");
      data.youtubeId=youtubeId;
      data.youtubeUrl=`https://www.youtube.com/watch?v=${youtubeId}`;
      data.platform="youtube";
    }
    if(kind==="brands") {
      data.name=String(f.get("name")||"").trim(); data.url=String(f.get("url")||"").trim();
      const key=duplicateKey(kind,data), local=S.data.brands.find(x=>x.id!==item?.id&&duplicateKey(kind,x)===key);
      if(local) throw new Error("Esta marca ya está registrada. Edita el registro existente en lugar de crear otro.");
      const file=f.get("media");
      if(file?.size){const hash=await fingerprint(file);if(S.data.brands.some(x=>x.id!==item?.id&&x.logoHash===hash))throw new Error("Este mismo archivo de logotipo ya está registrado.");if(item?.logoHash===hash){data.logoUrl=item.logoUrl;data.logoHash=hash;}else{data.logoUrl=await uploadToCloudinary(file,"brands");data.logoHash=hash;}}
      else if(item?.logoUrl){data.logoUrl=item.logoUrl;data.logoHash=item.logoHash||null;}
      else throw new Error("Selecciona el logotipo de la marca.");
    }
    if(kind==="socialBrands") {
      data.name=String(f.get("name")||"").trim();data.description=String(f.get("description")||"").trim();data.profileUrl=String(f.get("profileUrl")||"").trim();
      const duplicate=S.data.socialBrands.find(x=>x.id!==item?.id&&normalize(x.name)===normalize(data.name));if(duplicate)throw new Error("Esta marca digital ya está registrada.");
      let logoUrl=item?.logoUrl||"";const logo=f.get("socialLogo");if(logo?.size)logoUrl=await uploadToCloudinary(logo,"social-brands/logos");data.logoUrl=logoUrl;
      const numberField=name=>{const raw=String(f.get(name)||"").trim();if(raw==="")return 0;const n=Number(raw);if(!Number.isFinite(n)||n<0)throw new Error(`El campo ${name} debe ser un número igual o mayor que cero.`);return n;};
      data.stats={followers:numberField("followers"),reach:numberField("reach"),interactions:numberField("interactions"),views:numberField("views"),period:String(f.get("period")||"").trim(),updatedAt:String(f.get("updatedAtText")||"").trim()};
      data.history=String(f.get("history")||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const [month,followers,reach,interactions,views]=line.split("|").map(x=>x.trim());if(!/^\d{4}-\d{2}$/.test(month)||![followers,reach,interactions,views].every(v=>v===""||Number.isFinite(Number(v))&&Number(v)>=0))throw new Error(`Línea de evolución inválida: ${line}`);return {month,followers:Number(followers||0),reach:Number(reach||0),interactions:Number(interactions||0),views:Number(views||0)};});
      if(data.history.length>24)throw new Error("Registra como máximo 24 meses de evolución por marca.");
      data.posts=String(f.get("posts")||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const [type,title,url,reach,views,interactions]=line.split("|").map(x=>x.trim());if(!type||!title||!url)throw new Error(`Publicación inválida: ${line}. Usa tipo|título|URL y, opcionalmente, alcance|reproducciones|interacciones.`);if(!/^https:\/\//i.test(url))throw new Error(`La URL de esta publicación no es válida: ${url}`);const post={type,title,url};for(const [key,value] of [["reach",reach],["views",views],["interactions",interactions]])if(value!==undefined&&value!==""){const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error(`Métrica inválida en la publicación: ${line}`);post[key]=n;}return post;});
      if(data.posts.length>30)throw new Error("Registra como máximo 30 publicaciones por marca para mantener la página ligera.");
      const mediaFiles=Array.from(f.getAll("socialMedia")).filter(x=>x instanceof File&&x.size);if(data.posts.length+mediaFiles.length>30)throw new Error("El máximo es de 30 publicaciones por marca. Guarda los cambios y agrega el resto después.");for(const file of mediaFiles){const url=await uploadToCloudinary(file,"social-brands/content");data.posts.push({type:"Diseño / fotografía",title:file.name,url,mediaUrl:url});}
      if(data.profileUrl&&!/^https:\/\//i.test(data.profileUrl))throw new Error("El enlace del perfil debe comenzar con https://.");
    }
    if(kind==="packages") {
      data.name=String(f.get("name")||"").trim(); data.category=String(f.get("category")||"").trim(); data.price=Number(f.get("price"));
      data.description=String(f.get("description")||"").trim(); data.features=String(f.get("features")||"").split("\n").map(x=>x.trim()).filter(Boolean);
      data.categoryFeatured=f.get("categoryFeatured")==="true";
      data.categoryCoverUrl=item?.categoryCoverUrl||"";
      const categoryCover=f.get("categoryCover");
      if(categoryCover?.size) data.categoryCoverUrl=await uploadToCloudinary(categoryCover,"category-covers/digital");
      if(!Number.isFinite(data.price)||data.price<0) throw new Error("El precio debe ser un número válido mayor o igual a cero.");
      if(data.categoryFeatured&&normalize(data.category).includes("gestion de redes")&&!data.categoryCoverUrl) throw new Error("Sube una imagen de miniatura antes de activar esta opción.");
      const key=duplicateKey(kind,data), local=S.data.packages.find(x=>x.id!==item?.id&&duplicateKey(kind,x)===key);
      if(local) throw new Error("Ya existe un paquete con ese nombre en esta categoría. Edita el existente.");
    }
    await saveRecord(kind,item,data);
    $("#editor").close(); note("Registro guardado correctamente.");
    await rows(kind,true);
    ({portfolio:drawPortfolio,videos:drawVideos,brands:drawBrands,socialBrands:drawSocialBrands,packages:drawPackages}[kind])();
    await overview();
  } catch(err){console.error(err);note(readableError(err));}
  finally{S.busy=false;if(submit){submit.disabled=false;submit.textContent="Guardar";}}
});

function cardActions(kind,id){return `<div class="actions"><button type="button" data-edit="${kind}" data-id="${esc(id)}">Editar</button><button type="button" data-del="${kind}" data-id="${esc(id)}">Eliminar</button></div>`;}
function bindCards(){
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editor(b.dataset.edit,S.data[b.dataset.edit].find(x=>x.id===b.dataset.id)));
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{
    if(!confirm("¿Eliminar este registro? Esta acción no se puede deshacer."))return;
    b.disabled=true;
    try{await deleteDoc(doc(db,b.dataset.del,b.dataset.id));await rows(b.dataset.del,true);({portfolio:drawPortfolio,videos:drawVideos,brands:drawBrands,socialBrands:drawSocialBrands,packages:drawPackages}[b.dataset.del])();await overview();note("Registro eliminado.");}
    catch(err){console.error(err);note(readableError(err));b.disabled=false;}
  });
}
function drawPortfolio(){const a=S.data.portfolio;$("#portfolio-list").innerHTML=a.map(x=>`<article class="card">${(x.coverUrl||x.mediaUrl)?`<img src="${esc(x.coverUrl||x.mediaUrl)}" alt="${esc(x.title)}" loading="lazy" decoding="async">`:""}<h3>${esc(x.title)}</h3><p>${esc(x.category)} · ${Number(x.galleryCount??x.galleryImages?.length??0)} fotografías · ${x.published?"Publicado":"Oculto"}</p><p>${x.featured?"★ Seleccionado para Trabajo seleccionado":"No destacado"}</p>${cardActions("portfolio",x.id)}</article>`).join("")||"Sin eventos todavía.";bindCards();}
function drawVideos(){const a=S.data.videos;$("#videos-list").innerHTML=a.map(x=>`<article class="card"><a class="video-admin-thumb" href="${esc(x.youtubeUrl||`https://www.youtube.com/watch?v=${x.youtubeId||""}`)}" target="_blank" rel="noopener"><img src="${esc(x.categoryCoverUrl||`https://img.youtube.com/vi/${encodeURIComponent(x.youtubeId||"")}/hqdefault.jpg`)}" alt="Miniatura de ${esc(x.title)}" loading="lazy" decoding="async"><span>▶</span></a><h3>${esc(x.title)}</h3><p>${esc(x.category)} · ${x.published?"Publicado":"Oculto"}${x.featured?" · ★ Miniatura de categoría en inicio":""}${x.categoryCoverUrl?" · Portada personalizada":""}</p><a class="video-admin-link" href="${esc(x.youtubeUrl||`https://www.youtube.com/watch?v=${x.youtubeId||""}`)}" target="_blank" rel="noopener">Ver en YouTube ↗</a>${cardActions("videos",x.id)}</article>`).join("")||"Todavía no has agregado videos.";bindCards();}
function drawBrands(){const a=S.data.brands;$("#brands-list").innerHTML=a.map(x=>`<article class="card"><img src="${esc(x.logoUrl||"")}" alt="${esc(x.name)}" loading="lazy" decoding="async"><h3>${esc(x.name)}</h3><p>${x.published?"Publicado":"Oculto"}</p>${cardActions("brands",x.id)}</article>`).join("")||"Sin marcas.";bindCards();}
function drawSocialBrands(){const a=S.data.socialBrands;$("#social-list").innerHTML=a.map(x=>`<article class="card">${x.logoUrl?`<img src="${esc(x.logoUrl)}" alt="${esc(x.name)}">`:""}<h3>${esc(x.name)}</h3><p>${Number(x.stats?.followers||0).toLocaleString("es-EC")} seguidores · ${Number(x.posts?.length||0)} publicaciones</p><p>${x.published?"Publicado":"Oculto"}</p>${cardActions("socialBrands",x.id)}</article>`).join("")||"Todavía no has registrado marcas de gestión digital.";bindCards();}
function drawPackages(){const a=S.data.packages;$("#packages-list").innerHTML=a.map(x=>`<article class="card">${x.categoryCoverUrl?`<img src="${esc(x.categoryCoverUrl)}" alt="Miniatura de ${esc(x.category||x.name)}" loading="lazy" decoding="async">`:""}<h3>${esc(x.name)}</h3><p class="package-admin-category">${esc(x.category||"Sin categoría")}</p><b>$${Number(x.price||0).toLocaleString("es-EC",{minimumFractionDigits:2,maximumFractionDigits:2})} desde</b><p>${esc(x.description)}</p><ul>${(x.features||[]).map(y=>`<li>${esc(y)}</li>`).join("")}</ul><p>${x.published?"Publicado":"Oculto"}${x.categoryFeatured?" · ★ Miniatura de categoría en inicio":""}</p>${cardActions("packages",x.id)}</article>`).join("")||"Sin paquetes.";bindCards();}
async function drawMessages(){const all=await rows("messages",true),filter=$("#message-filter").value,a=all.filter(x=>filter==="all"||(x.status||"new")===filter);$("#messages-list").innerHTML=a.map(x=>`<article class="message"><b>${esc(x.name||"Sin nombre")}</b> · ${esc(x.email||"")} · ${esc(x.phone||"")}<p>${esc(x.message||"")}</p><small>${esc(x.status||"new")}</small><div class="actions"><button type="button" data-read="${esc(x.id)}">Marcar leído</button><button type="button" data-replied="${esc(x.id)}">Respondido</button>${x.phone?`<a href="https://wa.me/${String(x.phone).replace(/\D/g,"")}" target="_blank" rel="noopener">WhatsApp</a>`:""}</div></article>`).join("")||"Sin mensajes.";
  document.querySelectorAll("[data-read],[data-replied]").forEach(b=>b.onclick=async()=>{b.disabled=true;const id=b.dataset.read||b.dataset.replied;try{await updateDoc(doc(db,"messages",id),{status:b.dataset.read?"read":"replied"});await drawMessages();await overview();}catch(err){console.error(err);note(readableError(err));b.disabled=false;}});
}
$("#message-filter").onchange=drawMessages;
async function settingsLoad(){try{const s=await getDoc(doc(db,"siteSettings","public"));if(s.exists())Object.entries(s.data()).forEach(([k,v])=>{const e=$("#settings-form").elements.namedItem(k);if(e)e.value=v;});}catch(err){console.error(err);note(readableError(err));}}
$("#settings-form").onsubmit=async e=>{e.preventDefault();try{await setDoc(doc(db,"siteSettings","public"),{...Object.fromEntries(new FormData(e.currentTarget)),updatedAt:serverTimestamp()},{merge:true});cloudConfigPromise=null;note("Configuración guardada correctamente.");}catch(err){console.error(err);note(readableError(err));}};

function drawAnalytics(events,days){
  const views=events.filter(x=>x.type==="page_view").length,leads=S.analyticsMessagesCount||0;
  $("#a-visits").textContent=views;$("#a-leads").textContent=leads;$("#a-events").textContent=events.length;
  $("#a-projects").textContent=S.data.portfolio.filter(x=>x.published===true).length;
  const map=new Map();
  for(let i=days-1;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;map.set(key,{label:d.toLocaleDateString("es-EC",{day:"2-digit",month:days<=7?"short":"2-digit"}),count:0});}
  events.forEach(x=>{const d=dateOf(x.createdAt);if(!d)return;const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;if(map.has(key))map.get(key).count++;});
  const max=Math.max(1,...[...map.values()].map(x=>x.count));
  $("#chart").innerHTML=`<div class="chart-heading"><b>Actividad diaria</b><span>${events.length} eventos registrados</span></div><div class="barrow" role="img" aria-label="Gráfico de eventos por día">${[...map.values()].map((x,i)=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(3,x.count/max*100)}%" title="${x.label}: ${x.count} eventos"></div><small>${days<=7|| (days<=30?i%3===0:i%7===0)?esc(x.label):""}</small></div>`).join("")}</div>${events.length>=5000?'<p class="hint">Se alcanzó el límite de lectura de 5.000 eventos para este período. Reduce el rango para ver datos completos.</p>':events.length===0?'<p class="hint">Todavía no hay actividad registrada en este período.</p>':""}`;
}
async function analytics(){const days=Number($("#range").value)||30;$("#chart").innerHTML='<p class="hint">Cargando estadísticas…</p>';try{const start=Timestamp.fromDate(new Date(Date.now()-days*86400000));const [events,messages]=await Promise.all([getAnalytics(days),getDocs(query(collection(db,"messages"),where("createdAt",">=",start),orderBy("createdAt","desc"),limit(5000)))]);S.analytics=events;S.analyticsMessagesCount=messages.size;drawAnalytics(events,days);}catch(err){console.error(err);$("#chart").innerHTML='<p class="hint">No se pudieron cargar las estadísticas. Revisa las reglas de analyticsEvents.</p>';note(readableError(err));}}
$("#range").onchange=analytics;
