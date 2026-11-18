# JEYR DESIGN — versión gratuita con Cloudinary + Firebase Firestore

## Qué utiliza
- GitHub Pages: publica la web.
- Firebase Authentication + Firestore: usuarios administradores, paquetes, marcas, proyectos, mensajes y estadísticas.
- Cloudinary Free: almacena y entrega fotografías, logotipos y videos mediante CDN.
- **No utiliza Firebase Storage** y no requiere activar Blaze para subir medios.

## Antes de publicar
1. Crea una cuenta gratuita en https://cloudinary.com/users/register/free (no requiere tarjeta según el plan Free publicado por Cloudinary).
2. En Cloudinary Console, abre Settings → Upload → Upload presets → Add upload preset.
3. Crea un preset con nombre, por ejemplo `jeyr_unsigned`, y configura **Signing Mode: Unsigned**.
4. Restringe `Allowed formats` a `jpg,jpeg,png,webp,svg,mp4,webm`. Usa la carpeta `jeyr-design` si el panel permite definirla en el preset. No añadas API Secret al sitio.
5. En Cloudinary Console → Dashboard, copia el **Cloud name**. Copia también el nombre exacto del preset unsigned.
6. Publica los archivos de este ZIP en la raíz de la rama GitHub Pages que ya utilizas (`jeyrdesign-patch-2`). Conserva `CNAME` y `.nojekyll`.
7. Abre `https://www.jeyrdesign.com/admin/`, inicia sesión y entra en Configuración. Completa `Cloudinary Cloud name` y `Cloudinary Upload preset`, y pulsa Guardar. La configuración se guarda en el documento existente `siteSettings/public` de Firestore.
8. Prueba primero un logotipo pequeño, luego una fotografía. No elimines archivos ni documentos antiguos durante la prueba.

## Límites y seguridad
- Cloudinary Free publica 25 créditos mensuales; 1 crédito equivale a 1 GB de almacenamiento, 1 GB de ancho de banda de imagen o 1.000 transformaciones. El consumo se comparte entre esos recursos y el plan tiene límites; revisa el panel de uso.
- El límite de archivo de imagen del plan Free es 10 MB; video 100 MB. El panel valida 10 MB para imágenes y 100 MB para videos antes de subir.
- Un preset unsigned es visible en el código del navegador y cualquier persona que lo conozca podría intentar subir archivos. Por eso se deben restringir formatos y revisar el consumo. No es un sistema privado de carga; el panel sí exige iniciar sesión para guardar los registros de medios en Firestore.
- Nunca publiques `API Secret` en GitHub ni lo pegues en el panel. El navegador solo utiliza Cloud name y el nombre del preset unsigned.
- El plan gratuito no significa recursos ilimitados. Si se agotan los créditos o se supera el uso permitido, Cloudinary puede limitar el servicio o pedir una actualización; vigila Usage/Billing.

## Datos existentes
Los documentos de Firestore no se borran. Si ya existen registros con URLs de Firebase Storage que nunca llegaron a cargarse o que no funcionan, edítalos y vuelve a subir los archivos para reemplazar sus URLs por URLs de Cloudinary. Los archivos que ya existan en otro alojamiento no se migran automáticamente.

## Uso del panel
- Acceso: `https://www.jeyrdesign.com/admin/`
- Administra portafolio, marcas, paquetes, mensajes y estadísticas.
- Para publicar un paquete en una categoría, escribe una categoría coherente (Diseño gráfico, Branding, Fotografía, Audiovisual o Contenido digital).

## Firebase
No configures Firebase Storage ni publiques reglas de Storage. El archivo `admin/js/firebase.js` ya no inicializa Storage. Mantén Authentication y Firestore como están. Si tus reglas de Firestore actuales ya permiten a `owner` guardar documentos de `siteSettings/public`, no necesitas modificarlas.

## Publicación
1. Extrae el ZIP.
2. Sustituye el contenido del repositorio con todos los archivos del ZIP.
3. Haz commit y push en la rama configurada para GitHub Pages.
4. Espera la publicación y prueba el panel desde PC y celular.


## Ajustes visuales de interfaz
- Logotipo original JEYR DESIGN recortado a su proporción horizontal y reducido para cabecera, pie y panel administrativo.
- Favicon con isotipo original sobre fondo oscuro y acento turquesa eléctrico/azul.
- Retirada de la franja de valores 01–04 bajo “Dónde nace JEYR DESIGN”.
- Servicio “Contenido digital” renombrado a “Paquetes Digitales” en la interfaz pública.
- Sección de marcas con tarjetas uniformes, fondos claros y logotipos centrados para mantener una presentación ordenada.
- Paleta turquesa más azulada y eléctrica, sin tonos menta/pastel.


## Actualización del holograma de portada
- Se integró el retrato proporcionado como una proyección holográfica PNG con transparencia, color azul/turquesa eléctrico, brillo y líneas de escaneo.
- La fotografía se superpone dentro del mismo rectángulo inclinado `.hero-image`; no se cambian su estructura, órbitas, tarjetas flotantes, textos ni composición.
- El archivo está en `assets/img/hero-hologram.png`. Mantén esa ruta al publicar.
- Se redujo el logotipo original en cabecera y pie, con una escala menor adicional en móvil.

## Catálogo de paquetes en páginas independientes
- La página principal ya no contiene todos los paquetes en una sola sección.
- El menú y las tarjetas de servicios abren el catálogo en una pestaña nueva.
- `paquetes/index.html` funciona como índice de categorías.
- Cada categoría tiene su propia página: `paquetes/diseno.html`, `paquetes/fotografia.html`, `paquetes/audiovisual.html` y `paquetes/digitales.html`.
- Cada página consulta los paquetes publicados en Firestore y filtra por su categoría. En el administrador, al crear o editar un paquete, selecciona una de las cuatro categorías disponibles para que aparezca en la página correcta.
- Los botones de consulta abren WhatsApp con el nombre del paquete.
- Google Drive no forma parte de esta arquitectura. Cloudinary gestiona los medios y Firebase Firestore conserva los datos y enlaces.


### Actualización del holograma
El recurso `assets/img/hero-hologram.svg` reemplaza el retrato/silueta anterior por una composición vectorial abstracta de ondas, anillos y luz cian/azul. No contiene personas ni siluetas. `index.html` ya apunta al nuevo SVG.
