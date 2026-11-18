import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = s => document.querySelector(s);
const S = { user:null, data:{portfolio:[],brands:[],packages:[],messages:[]}, loaded:{}, kind:null, item:null, busy:false, analytics:[] };
const CLOUDINARY_DEFAULTS = { cloudName:"bktloafr", uploadPreset:"jeyr_unsigned" };
let cloudConfigPromise = null;
const names = {overview:"Resumen general",portfolio:"Portafolio",brands:"Marcas colaboradoras",packages:"Servicios y paquetes",messages:"Mensajes",analytics:"Estadísticas",settings:"Configuración"};
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
    if(view==="brands"){await rows("brands");drawBrands();}
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
async function uploadToCloudinary(file,folder,resourceType="image") {
  if(!file||!file.size) throw new Error("Selecciona un archivo.");
  const isVideo=resourceType==="video", max=isVideo?100*1024*1024:10*1024*1024;
  if(file.size>max) throw new Error(`El archivo supera el límite de ${isVideo?"100 MB":"10 MB"}.`);
  const allowed=isVideo?["video/mp4","video/webm"]:["image/jpeg","image/png","image/webp","image/svg+xml"];
  if(!allowed.includes(file.type)) throw new Error(isVideo?"Usa MP4 o WEBM.":"Usa JPG, PNG, WEBP o SVG.");
  const {cloudName,uploadPreset}=await cloudinaryConfig();
  const body=new FormData(); body.append("file",file); body.append("upload_preset",uploadPreset); body.append("folder",`jeyr-design/${folder}`);
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
function duplicateKey(kind,data) {
  if(kind==="brands") return normalize(data.name);
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
    <label>Categoría<input name="category" maxlength="60" value="${esc(item?.category||"Fotografía")}"></label>
    <label class="wide">Descripción<textarea name="description" maxlength="1200">${esc(item?.description)}</textarea></label>
    <label>Portada del evento<input name="cover" type="file" accept="image/png,image/jpeg,image/webp"></label>
    <label>Fotografías de la galería<input name="gallery" type="file" accept="image/png,image/jpeg,image/webp" multiple></label>
    <p class="hint wide">Puedes seleccionar varias fotos. Se omitirán archivos repetidos dentro de esta galería y se conservarán las fotografías ya guardadas.</p>
    ${Array.isArray(item?.galleryImages)&&item.galleryImages.length?`<div class="wide existing-gallery-wrap"><b>Fotografías actuales</b><p class="hint">Marca las que deseas quitar de esta galería.</p><div class="existing-gallery">${item.galleryImages.map((photo,i)=>{const url=typeof photo==="string"?photo:photo?.url;const name=typeof photo==="object"?(photo.name||`Fotografía ${i+1}`):`Fotografía ${i+1}`;return `<label class="existing-photo"><input type="checkbox" name="removeGallery" value="${i}"><img src="${esc(url||"")}" alt=""><span>${esc(name)}</span></label>`;}).join("")}</div></div>`:""}
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>
    <div class="wide hint">${item?.galleryImages?.length||0} fotografías guardadas.</div>`;
  if(kind==="brands") html=`
    <label>Nombre de la marca<input name="name" required maxlength="100" value="${esc(item?.name)}"></label>
    <label>Logotipo<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" ${item?"":"required"}></label>
    <label>Enlace<input name="url" type="url" value="${esc(item?.url)}"></label>
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>`;
  if(kind==="packages") html=`
    <label>Nombre<input name="name" required maxlength="100" value="${esc(item?.name)}"></label>
    <label>Categoría<select name="category" required>
      ${["Diseño gráfico & branding","Fotografía profesional","Producción audiovisual","Paquetes Digitales",...(item?.category&&!['Diseño gráfico & branding','Fotografía profesional','Producción audiovisual','Paquetes Digitales'].includes(item.category)?[item.category]:[])].map(v=>`<option value="${esc(v)}" ${item?.category===v?"selected":""}>${esc(v)}</option>`).join("")}
    </select></label>
    <label>Precio desde USD<input name="price" type="number" min="0" step=".01" required value="${esc(item?.price)}"></label>
    <label>Publicado<select name="published"><option value="true" ${item?.published!==false?"selected":""}>Sí</option><option value="false" ${item?.published===false?"selected":""}>No</option></select></label>
    <label class="wide">Descripción<textarea name="description" maxlength="1200">${esc(item?.description)}</textarea></label>
    <label class="wide">Incluye (una línea por elemento)<textarea name="features">${esc((item?.features||[]).join("\n"))}</textarea></label>`;
  $("#editor-title").textContent=(item?"Editar ":"Nuevo ")+({portfolio:"proyecto",brands:"marca",packages:"paquete"}[kind]);
  $("#fields").innerHTML=html; $("#editor").showModal();
}
$("#close").onclick=$("#cancel").onclick=()=>$("#editor").close();
$("#new-portfolio").onclick=()=>editor("portfolio"); $("#new-brand").onclick=()=>editor("brands"); $("#new-package").onclick=()=>editor("packages");
$("#editor-form").addEventListener("submit",async e=>{
  e.preventDefault(); if(S.busy)return; S.busy=true;
  const form=e.currentTarget, submit=form.querySelector('button[type="submit"]')||form.querySelector('footer button:last-child');
  if(submit){submit.disabled=true;submit.textContent="Guardando…";}
  const f=new FormData(form),kind=S.kind,item=S.item;
  const data={published:f.get("published")==="true",updatedAt:serverTimestamp()};
  try {
    if(kind==="portfolio") {
      data.title=String(f.get("title")||"").trim(); data.category=String(f.get("category")||"Fotografía").trim(); data.description=String(f.get("description")||"").trim();
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
        let index=0; const workers=Array.from({length:Math.min(3,newFiles.length)},async()=>{while(index<newFiles.length){const current=newFiles[index++];current.url=await uploadToCloudinary(current.file,"portfolio/galleries");}});
        await Promise.all(workers);
        newFiles.forEach(x=>galleryImages.push({url:x.url,name:x.file.name,hash:x.hash,size:x.file.size,createdAt:Date.now()}));
      }
      if(!galleryImages.length&&item?.mediaUrl&&!item?.galleryImages?.length&&item.mediaType!=="video") galleryImages.push({url:item.mediaUrl,name:item.title||"Fotografía"});
      Object.assign(data,{coverUrl,mediaUrl:coverUrl,mediaType:"image",galleryImages,galleryCount:galleryImages.length});
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
    if(kind==="packages") {
      data.name=String(f.get("name")||"").trim(); data.category=String(f.get("category")||"").trim(); data.price=Number(f.get("price"));
      data.description=String(f.get("description")||"").trim(); data.features=String(f.get("features")||"").split("\n").map(x=>x.trim()).filter(Boolean);
      if(!Number.isFinite(data.price)||data.price<0) throw new Error("El precio debe ser un número válido mayor o igual a cero.");
      const key=duplicateKey(kind,data), local=S.data.packages.find(x=>x.id!==item?.id&&duplicateKey(kind,x)===key);
      if(local) throw new Error("Ya existe un paquete con ese nombre en esta categoría. Edita el existente.");
    }
    await saveRecord(kind,item,data);
    $("#editor").close(); note("Registro guardado correctamente.");
    await rows(kind,true);
    ({portfolio:drawPortfolio,brands:drawBrands,packages:drawPackages}[kind])();
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
    try{await deleteDoc(doc(db,b.dataset.del,b.dataset.id));await rows(b.dataset.del,true);({portfolio:drawPortfolio,brands:drawBrands,packages:drawPackages}[b.dataset.del])();await overview();note("Registro eliminado.");}
    catch(err){console.error(err);note(readableError(err));b.disabled=false;}
  });
}
function drawPortfolio(){const a=S.data.portfolio;$("#portfolio-list").innerHTML=a.map(x=>`<article class="card">${(x.coverUrl||x.mediaUrl)?`<img src="${esc(x.coverUrl||x.mediaUrl)}" alt="${esc(x.title)}" loading="lazy" decoding="async">`:""}<h3>${esc(x.title)}</h3><p>${esc(x.category)} · ${Number(x.galleryCount??x.galleryImages?.length??0)} fotografías · ${x.published?"Publicado":"Oculto"}</p>${cardActions("portfolio",x.id)}</article>`).join("")||"Sin eventos todavía.";bindCards();}
function drawBrands(){const a=S.data.brands;$("#brands-list").innerHTML=a.map(x=>`<article class="card"><img src="${esc(x.logoUrl||"")}" alt="${esc(x.name)}" loading="lazy" decoding="async"><h3>${esc(x.name)}</h3><p>${x.published?"Publicado":"Oculto"}</p>${cardActions("brands",x.id)}</article>`).join("")||"Sin marcas.";bindCards();}
function drawPackages(){const a=S.data.packages;$("#packages-list").innerHTML=a.map(x=>`<article class="card"><h3>${esc(x.name)}</h3><b>$${Number(x.price||0).toFixed(2)} desde</b><p>${esc(x.description)}</p><ul>${(x.features||[]).map(y=>`<li>${esc(y)}</li>`).join("")}</ul><p>${x.published?"Publicado":"Oculto"}</p>${cardActions("packages",x.id)}</article>`).join("")||"Sin paquetes.";bindCards();}
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
