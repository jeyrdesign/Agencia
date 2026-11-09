# JEYR ADMIN — programación preparada

Incluye acceso privado, dashboard responsive, CRUD de portafolio (fotos/videos), marcas (logos), paquetes (precios y características), bandeja de mensajes, configuración básica y métricas propias de eventos.

## Proyecto Firebase configurado
Project ID: jeyr-design-admin. SDK web 13.2.0. Se incorpora la configuración pública compartida.

## Antes de usar
- El enlace `jeyr-design-admin-default-rtdb.firebaseio.com` es Realtime Database. Este código requiere **Cloud Firestore**, no Realtime Database.
- Crear Cloud Firestore Standard en Firebase Console.
- Crear el documento `admins/P1Cul9yW8fdtsqRoCwAHa3WRsSj1` con `active` Boolean true, `email` String `jeyrdesign@gmail.com`, `role` String `owner`.
- Publicar `firebase/firestore.rules` en Firestore > Reglas.
- Crear Firebase Storage y publicar `firebase/storage.rules`.
- La cuenta ya creada en Authentication debe ser la única cuenta habilitada. No hay registro público.

## Integración con web pública
`admin/js/tracking.js` exporta `trackPageView()` y `trackLead()` para registrar visitas y consultas. El formulario público deberá crear documentos `messages` con name, email, phone, service, message, status:'new' y createdAt:serverTimestamp(). La integración del formulario y lectura pública de proyectos/logos/precios debe hacerse sobre los archivos actuales del sitio para no romperlo.

## Estadísticas
El panel cuenta eventos propios almacenados en Firestore. No son un sustituto de Google Analytics 4: GA4 se integrará después para fuentes de tráfico, sesiones y métricas avanzadas.

## Publicación
Subir la carpeta `admin` al repositorio del sitio y servirla bajo `/admin/` mediante HTTPS. No abrir HTML directamente desde el disco.

## Nota técnica
La carga de archivos requiere Firebase Storage habilitado y sus reglas publicadas. El panel está preparado en código, pero no puede funcionar hasta completar Firestore, Storage y el documento de propietario.
