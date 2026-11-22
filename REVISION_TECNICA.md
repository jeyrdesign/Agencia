# JEYR DESIGN — Revisión técnica final

## Cambios aplicados
- La animación de aparición ahora es reversible: los elementos entran al área visible al desplazarse hacia abajo y vuelven a ocultarse suavemente al salir; al subir, se revelan otra vez. Se mantiene el respeto por `prefers-reduced-motion`.
- Se centralizó el observador de animación para evitar crear observadores repetidos cada vez que se actualiza contenido dinámico.
- Se optimizaron las URLs de imágenes de Cloudinary, incluyendo URLs que ya tenían transformaciones, para negociar formato automático, compresión y ancho adecuado sin duplicar parámetros básicos.
- Los logotipos de marcas se solicitan a un ancho máximo de 320 px con compresión económica; las primeras marcas se priorizan y las restantes usan carga diferida. Se añadieron dimensiones y `sizes` para reducir saltos de diseño.
- Se aplicó la misma lógica de optimización de imágenes a portadas y galerías.
- Se conserva la estructura visual, el encabezado, el pie de página, el lema, los datos y la configuración existente de Firebase/Cloudinary.

## Comprobaciones realizadas
- Sintaxis de todos los archivos JavaScript comprobada con Node.js.
- HTML comprobado con parser y revisión de IDs duplicados.
- Referencias locales a CSS, JavaScript e imágenes comprobadas.
- Estructura e integridad del ZIP comprobadas.

## Límites de la revisión
No se ejecutó una sesión real en el dominio publicado ni se pudo confirmar el rendimiento real de Firestore/Cloudinary desde el navegador del visitante. Por eso, la publicación debe verificarse después en escritorio y móvil, especialmente el acceso al administrador, el envío de formularios y la carga de logotipos.

- El administrador optimiza automáticamente cada imagen raster que supera 9,5 MB antes de subirla a Cloudinary: convierte a WebP, ajusta calidad y reduce dimensiones progresivamente hasta quedar bajo el límite individual de 10 MB. El límite es por archivo, no por galería; las fotografías nuevas se cargan secuencialmente para reducir picos de memoria y poder identificar cuál falla. Los SVG se conservan como vector y, si superan el límite, se solicita optimizarlos por separado. Los videos ahora se administran mediante enlaces de YouTube y no se cargan a Cloudinary.

- Se añadió el apartado Administración > Videos de YouTube para registrar, editar, publicar, ocultar y eliminar videos mediante URL.
- Los videos publicados se incorporan al portafolio completo, respetan los filtros por disciplina y abren una página con el reproductor de YouTube en modo de privacidad mejorada.
- Se añadió la regla Firestore para la colección `videos`: lectura pública solo para registros publicados y escritura exclusiva del administrador propietario.
- Cloudinary queda destinado a logotipos y fotografías; ya no se requiere permitir MP4/WEBM en el preset unsigned.


## Ajuste de navegación y miniaturas (18-11-2026)
- Las tarjetas de servicios abren el portafolio de su categoría al pulsar fuera del enlace «Explorar paquetes»; el enlace de paquetes mantiene su destino independiente.
- La portada muestra cuatro miniaturas de categorías (diseño/branding, fotografía, audiovisual y comunicación digital). Cada miniatura abre la categoría correspondiente.
- La presentación anterior de miniaturas por categoría fue sustituida en esta entrega por miniaturas con altura automática y proporción natural; no se fuerza una relación 4:5 ni se recorta la fotografía.
- La página de portafolio completo conserva el filtro general y todas las categorías disponibles.


## Ajustes de galería y filtros (18-11-2026)
- Las miniaturas dentro de cada proyecto conservan la proporción intrínseca de cada fotografía: altura automática, sin recorte ni deformación, tanto en escritorio como en móvil. En celulares se muestran en una sola columna, manteniendo el formato horizontal original de las imágenes.
- Los filtros se muestran únicamente en el listado del portafolio completo. Se ocultan de forma efectiva en las galerías individuales de proyectos y en las páginas de detalle de videos.
- Se corrigió la prioridad del atributo `hidden` frente al estilo `display:flex`, que podía dejar visible el grupo de filtros incluso cuando se solicitaba ocultarlo.
- En móvil, los filtros del portafolio completo se desplazan horizontalmente para evitar que ocupen demasiadas filas.
- Al seleccionar una categoría en el portafolio completo, la selección se conserva en la URL para permitir recargar o compartir el filtro aplicado.


## Gestión digital, paquetes y ajustes visuales (21-11-2026)
- La cuarta tarjeta de servicios ahora representa **Gestión de redes + creación de contenidos**. Pulsar el cuerpo de la tarjeta abre el espacio de marcas; el enlace interior abre los paquetes y precios, manteniendo dos destinos separados.
- Se añadió `gestion-digital.html`: lista las marcas publicadas y abre una ficha individual con seguidores, alcance, interacciones, reproducciones, periodo y fecha de actualización, evolución mensual y publicaciones.
- Se añadió `Administración > Gestión digital`, con alta/edición/eliminación y publicación de marcas, estadísticas manuales, historial mensual, enlaces de Reels/YouTube con métricas individuales opcionales de alcance, reproducciones e interacciones, y carga de fotografías/diseños a Cloudinary. Los datos de estadísticas son manuales, no se consultan automáticamente desde Instagram.
- La nueva colección Firestore es `socialBrands`. La regla incluida permite lectura pública solo a documentos publicados y escritura únicamente al administrador propietario. **Esta regla debe publicarse en Firebase Console > Firestore Database > Rules** antes de activar la sección.
- Los paquetes conservan la colección `packages`. Se añadió la categoría canónica `Gestión de redes + creación de contenidos`, manteniendo compatibilidad con registros antiguos de `Paquetes Digitales` y `Comunicación digital`.
- Los precios de Gestión digital ya no se muestran en la tarjeta 04 de la página principal. Los paquetes y precios se consultan al entrar a la sección de paquetes digitales. El administrador muestra categoría y precio y permite editarlos desde el mismo registro.
- El holograma del hero conserva su recurso visual existente. Se retiró el bloque de avatares y el texto «Creatividad con propósito · Diseño · Fotografía · Audiovisual», junto con el espacio que ocupaba.

## Verificación de esta entrega
- Sintaxis de los archivos JavaScript comprobada con Node.js en modo módulo.
- HTML de las 10 páginas analizado; sin IDs duplicados ni referencias locales rotas.
- SVG del holograma, favicon y logotipo comprobados como XML válido.
- Balance de llaves de los archivos CSS comprobado.
- Se intentó una prueba de navegación con Chromium local, pero el entorno bloqueó la navegación del navegador a `127.0.0.1` (`ERR_BLOCKED_BY_ADMINISTRATOR`). Por ello no se declara una prueba real de navegador, ni se afirma que Firebase/Cloudinary hayan sido verificados en producción. La conexión real depende de publicar las reglas actualizadas y probar con el proyecto Firebase existente.


## Ajustes solicitados (22-11-2026)
- En «Quiénes somos» se reemplazó únicamente el texto de presentación por el texto cristocéntrico aprobado; se conservaron el encabezado, la estructura, el enlace y los estilos del bloque.
- Se retiró el bloque de texto e iconos situado debajo de las acciones del hero, eliminando también su espacio.
- La tarjeta 04 de la página principal ya no consulta ni muestra precios de paquetes. El enlace «Ver paquetes y precios» conserva su destino a la página de paquetes digitales.
- En Administración > Portafolio se añadió la opción «Mostrar este proyecto en 03 / TRABAJO SELECCIONADO». La página principal muestra hasta cuatro proyectos seleccionados y enlaza cada miniatura a su galería individual. Si todavía no hay proyectos seleccionados, se conserva la vista previa de categorías como alternativa.
- Las miniaturas de «Trabajo seleccionado» y de la vista previa conservan la proporción original de las portadas: ancho adaptable, altura automática y sin recorte ni estiramiento.


## Ajuste de iconografía de categorías (22-11-2026)
- Los cuatro iconos de las tarjetas de servicios usan el mismo color de marca (cian `#00BFFF`), eliminando el tono menta.
- Se normalizaron los contenedores a 46 × 46 px y los dibujos SVG a 42 × 42 px, con el mismo grosor de trazo y tratamiento visual.
- Fotografía y Producción audiovisual ahora usan SVG para igualar el tamaño óptico de los iconos de Diseño y Gestión de redes.
- No se modificaron los textos, destinos ni comportamiento de las tarjetas.
- Verificación realizada: sintaxis JS, estructura HTML, balance CSS e integridad del ZIP. No se realizó prueba visual en navegador ni prueba de producción.
