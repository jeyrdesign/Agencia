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


## Nueva estructura del portafolio fotográfico

Al entrar en **Fotografía**, el visitante encontrará seis subcategorías independientes:

1. Fotografía deportiva — `fotografia-deportiva.html`
2. Sesiones en estudio — `fotografia-estudio.html`
3. Sesiones de XV años — `fotografia-xv.html`
4. Coberturas fotográficas — `fotografia-coberturas.html`
5. Fotografía comercial — `fotografia-comercial.html`
6. Sesiones en exteriores — `fotografia-exteriores.html`

Cada categoría tiene su propia galería y carpeta. Sube tus fotografías reales usando estos nombres:

| Categoría | Carpeta | Archivos |
|---|---|---|
| Deportiva | `assets/portfolio/fotografia/deportiva/` | `portada.jpg`, `partido-01.jpg`, `accion-01.jpg`, `equipo-01.jpg`, `entrenamiento-01.jpg`, `evento-01.jpg`, `detalle-01.jpg` |
| Estudio | `assets/portfolio/fotografia/estudio/` | `portada.jpg`, `retrato-01.jpg`, `editorial-01.jpg`, `concepto-01.jpg`, `perfil-01.jpg`, `detalle-01.jpg`, `sesion-01.jpg` |
| XV años | `assets/portfolio/fotografia/xv-anos/` | `portada.jpg`, `retrato-01.jpg`, `vestuario-01.jpg`, `exteriores-01.jpg`, `detalle-01.jpg`, `editorial-01.jpg`, `sesion-01.jpg` |
| Coberturas | `assets/portfolio/fotografia/coberturas/` | `portada.jpg`, `evento-01.jpg`, `protagonistas-01.jpg`, `ambiente-01.jpg`, `detalles-01.jpg`, `accion-01.jpg`, `momentos-01.jpg` |
| Comercial | `assets/portfolio/fotografia/comercial/` | `portada.jpg`, `producto-01.jpg`, `marca-01.jpg`, `espacio-01.jpg`, `detalle-01.jpg`, `campana-01.jpg`, `catalogo-01.jpg` |
| Exteriores | `assets/portfolio/fotografia/exteriores/` | `portada.jpg`, `retrato-01.jpg`, `pareja-01.jpg`, `familia-01.jpg`, `locacion-01.jpg`, `lifestyle-01.jpg`, `sesion-01.jpg` |

Puedes sustituir los archivos por tus fotografías conservando los nombres. Si quieres más imágenes, duplica una etiqueta `<figure>` en el HTML de la categoría y cambia la ruta y el texto alternativo.

## Actualización de tipografía y estilo

La web ahora utiliza **Outfit** para titulares y **Manrope** para textos y navegación. El lenguaje visual mantiene la identidad oscura con azul eléctrico y celeste, pero incorpora más aire, tarjetas redondeadas, contrastes suaves y animaciones discretas para transmitir frescura y modernidad.


## Logo oficial y eslogan

El logo vectorial oficial está integrado en `assets/brand/jeyr-design.svg` y se muestra en el encabezado y pie de página de todas las secciones. El archivo se ha ajustado en su área visible para evitar márgenes vacíos del lienzo original. Como el SVG original es negro y el sitio tiene fondo oscuro, se muestra en blanco mediante un filtro CSS, sin modificar el archivo fuente ni sus formas.

Eslogan oficial: **«Los mejores, con los mejores»**. Está incorporado en la portada y en los pies de página.

## Tarjetas de fotografía

Las seis subcategorías se presentan como tarjetas visuales con imagen de fondo, degradado para mejorar la lectura, indicador de categoría y microinteracciones. Para que las tarjetas luzcan completas, reemplaza cada `portada.jpg` indicado en la sección anterior por una fotografía propia de esa categoría.


## Icono de la página (favicon)

El isotipo de JEYR DESIGN ya está configurado como icono de pestaña del navegador en todas las páginas. Se incluyen `favicon.svg`, `favicon.ico`, versiones PNG y `apple-touch-icon.png` para dispositivos móviles. Si GitHub Pages conserva el icono anterior por caché, recarga el sitio con Ctrl + F5 o prueba en una ventana privada.


## Actualización v7 — Hero holográfico
- La portada mantiene el fondo oscuro y sus degradados originales.
- El contenido se distribuye en dos columnas: texto a la izquierda y panel holográfico a la derecha.
- Se conserva el degradado azul-cian del botón «Explorar portafolio».
- El panel muestra datos descriptivos del sitio: 4 áreas creativas, 6 líneas fotográficas y ubicación en Babahoyo.
- El panel se adapta a móviles y reduce movimiento si el dispositivo tiene esa preferencia configurada.
