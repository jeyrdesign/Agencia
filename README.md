# JEYR DESIGN

Paquete completo actualizado para publicar en la raíz del repositorio.

## Publicación
1. Descomprime el ZIP.
2. Sube todos los archivos y carpetas a la raíz del repositorio, reemplazando los archivos anteriores.
3. Conserva `CNAME` y `firebase/firestore.rules`.
4. No elimines ni recrees el proyecto Firebase, usuarios administradores, documentos o colecciones de Firestore.
5. Espera a que GitHub Pages termine el despliegue y revisa el sitio en escritorio y móvil.

## Portafolio
- `index.html`: página principal con selección de proyectos y acceso al portafolio completo.
- `galeria.html`: portafolio completo con filtros; `galeria.html?id=ID` abre una galería individual.

## Rendimiento y movimiento
Los logotipos de marcas usan versiones optimizadas de Cloudinary y carga priorizada/diferida. Las animaciones de entrada se repiten al entrar y salir del área visible al desplazarse en ambas direcciones; los usuarios con movimiento reducido no reciben animaciones de desplazamiento.

Consulta `REVISION_TECNICA.md` para conocer las comprobaciones y sus límites.

## Gestión digital de marcas
- `gestion-digital.html` muestra marcas con gestión de redes y creación de contenidos.
- El panel `Administración > Gestión digital` permite registrar estadísticas manuales, evolución mensual, enlaces a Reels/YouTube y fotos/diseños en Cloudinary.
- Debe publicarse la regla `socialBrands` de `firebase/firestore.rules` en Firebase Console para permitir lectura pública de marcas publicadas y escritura exclusiva del administrador.
- Los precios públicos se leen de la colección `packages`; administra nombre, categoría, precio y estado de publicación desde `Administración > Servicios y paquetes`.
- Para mantener uniformes las tarjetas de categorías del inicio, puedes subir una miniatura personalizada desde la edición de un video de YouTube (Producción audiovisual) o desde un paquete de «Gestión de redes + creación de contenidos»; activa la casilla para usarla en la categoría inicial. Las imágenes se guardan en Cloudinary y no reemplazan ni modifican el contenido del portafolio.


## Paso obligatorio de Firebase para Gestión digital
Después de subir el código, abre Firebase Console → Firestore Database → Rules, incorpora la regla `match /socialBrands/{id}` que aparece en `firebase/firestore.rules` y pulsa **Publish**. No recrees el proyecto, no borres las colecciones actuales ni cambies el usuario administrador. Sin publicar esa regla, la nueva página de gestión digital no podrá leer las marcas y el administrador no podrá guardarlas.


### Presentación uniforme del portafolio
- Las tarjetas del portafolio y las galerías usan un marco de proporción fija 4:3 y mantienen dimensiones consistentes dentro de cada cuadrícula.
- Las fotografías se muestran completas, centradas y con `object-fit: contain`: no se recortan ni se estiran. Las verticales y cuadradas quedan centradas; las horizontales conservan su proporción dentro del marco.
