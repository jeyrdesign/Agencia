# JEYR DESIGN — revisión técnica y mejoras

Esta versión parte de `JEYR_DESIGN_Navegacion_Misma_Pestana.zip` y conserva la configuración de Firebase, el acceso de administración, Cloudinary, el dominio y la navegación interna en la misma pestaña.

## Cambios aplicados

### Sitio público
- Se retiró el bloque intermedio «UNA FIRMA. UNA FORMA DE CREAR».
- Se retiró el logotipo del pie de página en la página principal, categorías de paquetes y galería. El logotipo permanece en los encabezados.
- La frase «Los mejores, con los mejores» queda como cierre discreto en el pie.
- Se alternaron fondos azul noche, azul profundo y azul petróleo para separar visualmente las secciones sin saturar la paleta.
- Las tarjetas recibieron contraste, bordes y estados hover más claros.
- Las imágenes alojadas en Cloudinary usan transformaciones de entrega `f_auto`, `q_auto` y anchos adecuados para reducir peso sin reemplazar los originales.
- Se añadieron carga diferida y decodificación asíncrona a imágenes dinámicas.
- Las consultas públicas de portafolio y marcas tienen límites razonables para evitar descargas excesivas.
- Las listas públicas eliminan duplicados visuales heredados por nombre/categoría o URL.

### Dashboard y datos
- Se corrigió la carga de la sección Marcas; antes se dibujaba sin consultar Firestore.
- Se unificó la lectura de colecciones y se añadió caché en memoria para no volver a descargar listas ya cargadas durante la misma sesión del administrador.
- Se corrigió el contador del resumen: muestra vistas de página de los últimos 30 días.
- Estadísticas: rangos de 7, 30 y 90 días, actividad diaria, vistas de página, mensajes realmente recibidos, eventos y proyectos publicados.
- El conteo de consultas se calcula desde la colección `messages`, por lo que no depende del registro secundario de un evento `lead`.
- Se añadió límite de 5.000 eventos/mensajes por consulta para evitar lecturas descontroladas; el panel avisa si alcanza el límite.
- Las estadísticas representan vistas de página y mensajes, no usuarios únicos. Para usuarios únicos, fuentes de tráfico y demografía se necesita Google Analytics 4.
- Se evita el doble envío del formulario del administrador mientras se guarda.
- La configuración de Cloudinary se consulta una vez por sesión de administrador y se invalida al guardar cambios.
- Las imágenes de las tarjetas del administrador usan carga diferida.

### Prevención de duplicados
- Paquetes: no permite registrar de nuevo el mismo nombre dentro de la misma categoría.
- Galerías: no permite repetir título/categoría; calcula huellas SHA-256 para detectar archivos iguales dentro de una galería.
- Marcas: no permite repetir el nombre ni volver a subir el mismo archivo de logotipo.
- Los nuevos registros reciben identificadores deterministas derivados de su clave normalizada, como protección adicional contra dobles clics y envíos simultáneos.
- En la web pública se filtran duplicados antiguos para que no aparezcan repetidos.
- Al editar una galería se pueden marcar fotografías individuales para quitarlas; el evento y las demás fotos se conservan.
- Los registros antiguos no se borran ni se migran automáticamente.

## Configuración que se conserva

- Firebase project: `jeyr-design-admin`.
- Cloudinary cloud name: `bktloafr`.
- Cloudinary unsigned upload preset: `jeyr_unsigned`.
- Dominio: `www.jeyrdesign.com` (archivo `CNAME` incluido).
- WhatsApp: `+593 980 478 748`.
- No se modifica el proyecto Firebase, la cuenta administradora ni los datos existentes.
- Las reglas de Firestore incluidas se mantienen compatibles con los eventos `page_view` y `lead` que registra el sitio; no se ha añadido una nueva colección ni se requiere migrar datos.

## Instalación

1. Descarga el ZIP completo.
2. Descomprime y sube el contenido de la carpeta raíz al repositorio `jeyrdesign-patch-2`, reemplazando los archivos correspondientes.
3. Conserva `CNAME` con `www.jeyrdesign.com`.
4. No borres el proyecto Firebase, los documentos de Firestore, el usuario administrador ni la configuración de Cloudinary.
5. Espera a que GitHub Pages publique los cambios y prueba el sitio y `/admin/`.

## Alcance de las pruebas

Se comprobaron la sintaxis de todos los archivos JavaScript, la estructura de los HTML, las rutas locales referenciadas y la integridad del ZIP. No fue posible ejecutar una prueba real contra Firebase/Cloudinary ni abrir un navegador de producción desde este entorno; por eso no se afirma que la autenticación, las reglas remotas o las cargas reales hayan sido verificadas en vivo.

## Límite técnico pendiente de conocer

Las fotografías de cada galería siguen siendo compatibles con el formato anterior `galleryImages` dentro del documento del evento. Firestore limita cada documento a 1 MiB. La prevención de duplicados y el filtrado están aplicados, pero una galería extraordinariamente grande podría alcanzar ese límite. Para colecciones de cientos o miles de fotos por evento, la evolución correcta sería migrar las fotos a una subcolección de Firestore; no se hizo aquí para evitar alterar el esquema y arriesgar las galerías existentes.
