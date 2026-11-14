# JEYR DESIGN — Sitio web + administrador

Proyecto estático listo para alojar en GitHub Pages con dominio propio. Incluye sitio público, panel privado, Firebase Authentication, Cloud Firestore y Firebase Storage.

## Estructura

- `index.html`: página pública.
- `assets/css/style.css`: diseño responsive.
- `assets/js/site.js`: carga dinámica de proyectos, marcas y paquetes; formulario de contacto y métricas.
- `admin/`: inicio de sesión y panel administrativo.
- `firebase/firestore.rules`: reglas de seguridad de Firestore.
- `firebase/storage.rules`: reglas de seguridad de Storage.

## Enlaces esperados

- Sitio público: `https://www.jeyrdesign.com/`
- Administrador: `https://www.jeyrdesign.com/admin/`

## Firebase

Se conserva la configuración web del proyecto `jeyr-design-admin` que estaba en el paquete de administrador facilitado por el usuario.

Para activar el sistema:
1. En Firebase Console, confirma que está creado Cloud Firestore.
2. En Authentication > Sign-in method, habilita Email/Password.
3. Crea o confirma el usuario `jeyrdesign@gmail.com` en Authentication.
4. Copia el UID exacto de ese usuario.
5. En Firestore crea `admins/{UID}` con:
   - `active`: boolean `true`
   - `email`: string con el correo del administrador
   - `role`: string `owner`
6. Publica el contenido de `firebase/firestore.rules` en Firestore > Reglas.
7. Para permitir subir fotos y videos desde el panel, habilita Firebase Storage y publica `firebase/storage.rules`.

**Importante:** las reglas y el código deben probarse en el proyecto Firebase real después de publicarlos. No compartas contraseñas ni claves privadas. La configuración web de Firebase incluida es visible desde el navegador; la protección depende de Authentication y las reglas.

## GitHub Pages

1. Descomprime el ZIP.
2. Sube el contenido interior de `JEYR_DESIGN_COMPLETO` a la raíz del repositorio (no subas la carpeta contenedora como una carpeta adicional).
3. En GitHub > Settings > Pages, selecciona la rama principal y `/ (root)`.
4. Conserva el archivo `CNAME` si ya tienes uno en el repositorio. Si no existe, crea un archivo llamado `CNAME` en la raíz que contenga `www.jeyrdesign.com`.
5. Espera la publicación y verifica HTTPS.

## Cómo usar el administrador

Entra a `/admin/` con el usuario autorizado. Desde el panel podrás:
- Crear, editar, publicar u ocultar proyectos de foto/video.
- Añadir marcas y logotipos.
- Crear y editar paquetes, precios y características.
- Revisar consultas y marcar su estado.
- Editar datos públicos de contacto.
- Consultar métricas básicas de visitas y consultas.

Los archivos multimedia se suben a Firebase Storage. Revisa límites de almacenamiento y tráfico del plan Spark. Para videos pesados, es preferible insertar enlaces de YouTube en una futura mejora.

## Contenido inicial

La página pública incluye textos y paquetes iniciales referenciales. Los paquetes se muestran desde Firestore cuando existan registros publicados; si no existen, se muestran las tarjetas iniciales del HTML. No se han inventado marcas ni proyectos visuales: el portafolio y los logotipos se alimentan desde el administrador.

## Antes de considerar terminado

- Probar inicio y cierre de sesión.
- Probar alta/edición de un proyecto, marca y paquete.
- Probar envío de formulario desde una ventana privada.
- Confirmar que los documentos no publicados no aparezcan en la página pública.
- Probar en móvil y escritorio.
- Confirmar el dominio y certificado HTTPS.


## Paquetes fotográficos iniciales para cargar desde el administrador

- **Sesión Esencial** — categoría Fotografía; precio desde USD 65; exteriores; 1 hora; 11 fotografías retocadas profesionalmente; entrega digital y perfeccionamiento de detalles. Bonus: hasta 1 hora y media dependiendo de disponibilidad del fotógrafo.
- **Sesión Profesional** — categoría Fotografía; precio desde USD 85; estudio; 1 hora; 11 fotografías retocadas profesionalmente; entrega digital y perfeccionamiento de detalles.
- **Eventos / Cobertura Especial** — categoría Coberturas; precio desde USD 70; cobertura según evento; selección y edición; entrega digital; cotización final según evento.

Estos paquetes aparecen como contenido inicial de respaldo en la web. Para que el panel los administre dinámicamente, créalos también en **Servicios y paquetes** dentro de `/admin/`.
