# JEYR DESIGN — sitio web y panel administrativo

## Estructura
- `index.html`: sitio público.
- `admin/`: acceso y panel de administración.
- `assets/img/jeyr-logo.svg`: logotipo vectorial original suministrado.
- `firebase/`: reglas de Firestore y Storage.
- `CNAME`: dominio `www.jeyrdesign.com`.

## Publicación en GitHub Pages
1. Descomprime este paquete.
2. Sube el contenido completo a la raíz de la rama que publica GitHub Pages (`jeyrdesign-patch-2` en la configuración actual).
3. Conserva `CNAME` y `.nojekyll`.
4. En Settings → Pages, confirma `Deploy from a branch`, la rama correspondiente y `/ (root)`.

## Firebase
El sitio usa el proyecto Firebase ya configurado en `admin/js/firebase-config.js`. No reemplaces sus credenciales por las de otro proyecto.

Para habilitar cargas de imágenes, en Firebase Console → Storage → Rules, publica el contenido de `firebase/storage.rules`. Las reglas requieren una sesión autenticada y un documento `admins/{uid}` con `active: true` y `role: owner`. Las marcas admiten imágenes de hasta 10 MB. El portafolio admite imágenes y videos; los videos tienen un límite de 100 MB desde el panel.

Las reglas de Firestore se encuentran en `firebase/firestore.rules`. Si ya tienes reglas personalizadas, revisa y combina los cambios antes de reemplazarlas.

## Uso del panel
- Acceso: `https://www.jeyrdesign.com/admin/`
- Gestiona portafolio, marcas, paquetes, mensajes y estadísticas.
- Para que un paquete aparezca en una categoría pública, escribe una categoría descriptiva (por ejemplo `Diseño gráfico`, `Branding`, `Fotografía`, `Audiovisual` o `Contenido digital`) y publícalo.
- En el sitio público, al tocar una tarjeta de servicio se filtran los paquetes publicados de esa categoría.

## Notas
- El diseño es responsive y está optimizado para escritorio y celular.
- Los errores de carga muestran códigos y mensajes de Firebase más útiles.
- No se cambian usuarios, contraseñas ni documentos existentes de Firebase.
- Después de publicar, prueba inicio de sesión, carga de una marca y carga de un proyecto.
