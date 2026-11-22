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


## Paso obligatorio de Firebase para Gestión digital
Después de subir el código, abre Firebase Console → Firestore Database → Rules, incorpora la regla `match /socialBrands/{id}` que aparece en `firebase/firestore.rules` y pulsa **Publish**. No recrees el proyecto, no borres las colecciones actuales ni cambies el usuario administrador. Sin publicar esa regla, la nueva página de gestión digital no podrá leer las marcas y el administrador no podrá guardarlas.
