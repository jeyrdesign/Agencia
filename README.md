# JEYR DESIGN — Web v2 para GitHub Pages

## Archivos principales
- `index.html`: portada, categorías, sección de marcas y paquetes desplegables.
- `fotografia.html`, `diseno.html`, `audiovisual.html`, `branding.html`: páginas independientes para cada categoría del portafolio.
- `css/style.css`: diseño responsive.
- `js/main.js`: enlaces de WhatsApp/Instagram y comportamiento de paquetes.
- `assets/portfolio/`: fotografías y muestras de trabajo.
- `assets/marcas/`: logotipos PNG de marcas/clientes.

## Publicar
Sube TODO el contenido del ZIP a la raíz de tu repositorio GitHub (al mismo nivel que `index.html`). En Settings > Pages elige Deploy from a branch, `main`, `/ (root)`.

## Contacto
Edita `js/main.js`:
- Cambia `593XXXXXXXXX` por el WhatsApp real: código 593 y número sin el cero inicial.
- Cambia `TU_USUARIO` por el usuario de Instagram sin @.

## Añadir fotografías a las páginas
Sube las imágenes a la carpeta indicada y conserva estos nombres (o modifica la ruta `src` en el HTML).

Fotografía (`assets/portfolio/fotografia/`): `retrato-01.jpg`, `deportivo-01.jpg`, `evento-01.jpg`, `comercial-01.jpg`, `editorial-01.jpg`, `sesion-01.jpg`.

Diseño (`assets/portfolio/diseno/`): `redes-01.jpg`, `flyer-01.jpg`, `portada-01.jpg`, `editorial-01.jpg`, `comercial-01.jpg`, `promocional-01.jpg`.

Audiovisual (`assets/portfolio/audiovisual/`): `reel-01.jpg`, `promocional-01.jpg`, `evento-01.jpg`, `comercial-01.jpg`.

Branding (`assets/portfolio/branding/`): `identidad-01.jpg`, `logo-01.jpg`, `aplicaciones-01.jpg`, `sistema-01.jpg`.

Las tarjetas de imagen que aún no tengan archivo se ocultan automáticamente. Puedes añadir más figuras copiando un bloque `<figure>` en la página de esa categoría.

## Añadir logotipos PNG
Sube los PNG transparentes a `assets/marcas/`. En `index.html`, busca la sección `id="marcas"` y reemplaza cada bloque `<div class="brand-slot"><span>AGREGA LOGO PNG 01</span></div>` por:
`<div class="brand-slot"><img src="assets/marcas/nombre-marca.png" alt="Nombre de la marca"></div>`
Duplica el bloque para cada marca adicional. Utiliza logos cuyo uso tengas autorizado.

## Paquetes
En la portada, los paquetes están ocultos hasta que haces clic en el nombre del servicio. Edita los textos y precios dentro de los elementos `<article class="package">` de `index.html`. Los precios de fotografía ($65, $85 y $65) son referencias previas y deben confirmarse antes de publicar.
