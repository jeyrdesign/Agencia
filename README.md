# JEYR DESIGN — Administrador integrado (sin Firebase Storage)

## Estructura
- `/` conserva la web pública actual.
- `/admin/` abre el inicio de sesión privado.
- `/admin/dashboard.html` contiene el panel.
- `public/js/jeyr-firebase.js` conecta la web pública con Firestore.
- No utiliza Firebase Storage, no necesita Blaze ni facturación.

## Datos Firebase utilizados
Proyecto: `jeyr-design-admin`
Firestore: región creada por el usuario `southamerica-east1`.
Authentication: proveedor Correo/Contraseña.
Administrador propietario: UID `P1Cul9yW8fdtsqRoCwAHa3WRsSj1`.
Documento requerido: `admins/P1Cul9yW8fdtsqRoCwAHa3WRsSj1` con `active=true`, `email="jeyrdesign@gmail.com"`, `role="owner"`.

## Instalación en GitHub Pages con dominio propio
1. Haz una copia de seguridad del repositorio actual.
2. Copia la carpeta `admin/` a la raíz del repositorio (al mismo nivel que `index.html`).
3. Copia `public/js/jeyr-firebase.js` a `public/js/`.
4. Copia el contenido de `firebase/firestore.rules` a Firestore > Reglas y pulsa Publicar.
5. No cambies DNS ni dominio. GitHub Pages servirá `/admin/` como ruta del mismo dominio.
6. Prueba `https://www.jeyrdesign.com/admin/`.

## Activar la web pública dinámica
En cada página donde quieras mostrar contenido administrable, añade un contenedor:
- Portafolio: `<div id="jeyr-portfolio"></div>`
- Marcas: `<div id="jeyr-brands"></div>`
- Paquetes: `<div id="jeyr-packages"></div>`

Al final del HTML, antes de `</body>`, añade un módulo:
```html
<script type="module">
  import {renderPortfolio,renderBrands,renderPackages,trackPageView} from './public/js/jeyr-firebase.js';
  trackPageView();
  renderPortfolio('#jeyr-portfolio');
  renderBrands('#jeyr-brands');
  renderPackages('#jeyr-packages');
</script>
```
Ajusta la ruta relativa del import según la profundidad de cada página. En páginas dentro de subcarpetas, utiliza la ruta correcta desde la raíz, por ejemplo `/public/js/jeyr-firebase.js` si el dominio publica el repositorio en la raíz.

## Formulario de contacto
El formulario público debe tener campos con estos `name`: `name`, `email`, `phone`, `service`, `message`. Ejemplo:
```html
<form id="contact-form">
  <input name="name" required>
  <input name="email" type="email">
  <input name="phone">
  <input name="service">
  <textarea name="message" required></textarea>
  <button>Enviar consulta</button>
  <p id="contact-status"></p>
</form>
<script type="module">
  import {sendContact} from '/public/js/jeyr-firebase.js';
  const form=document.querySelector('#contact-form');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const status=document.querySelector('#contact-status');
    try { await sendContact(form); status.textContent='Tu mensaje fue enviado.'; form.reset(); }
    catch(err) { status.textContent=err.message || 'No se pudo enviar el mensaje.'; }
  });
</script>
```

## Subida de fotos, logos y videos sin Storage
Sube los archivos al repositorio en `assets/portfolio/` y `assets/brands/`. Usa URLs públicas HTTPS, por ejemplo enlaces `raw.githubusercontent.com` o rutas públicas del propio dominio. Luego registra esa URL desde el administrador.
Videos grandes: utiliza YouTube y pega el enlace de reproducción. No alojes archivos MP4 grandes en GitHub Pages.

## Verificación
- Inicia sesión con la cuenta de Firebase Authentication existente.
- El panel verifica que el UID tenga el documento propietario activo.
- Prueba crear un proyecto con URL HTTPS, editarlo y ocultarlo.
- Comprueba las secciones públicas después de integrar los módulos.
- Envía un formulario de contacto de prueba y revisa Mensajes.

## Importante sobre el alcance
Este paquete incorpora un administrador completo y el módulo de conexión pública, pero no sobrescribe ni reconstruye las páginas HTML actuales de JEYR DESIGN. Para integrar los contenedores en el diseño real sin romper la composición, hace falta el ZIP actual del sitio o acceso a los archivos del repositorio. Mantén una copia de seguridad antes de subir cambios.
