import {db} from "../../admin/js/firebase.js";
import {addDoc,collection,serverTimestamp} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
try{await addDoc(collection(db,"analyticsEvents"),{type:"page_view",page:location.pathname,createdAt:serverTimestamp()});}catch(error){console.warn("No se pudo registrar la visita",error);}
