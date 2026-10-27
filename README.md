# Ingenia Cyber · Servicios de ciberseguridad

Frontend de demostración en React, TypeScript, Vite y Tailwind CSS. Diseño claro con catálogo público y portal del cliente.

## Desarrollo

Requiere Node.js 20.19+ o 22.12+ y npm.

```sh
npm ci --cache /tmp/clarity-npm-cache
npm run dev
```

## Validación y producción

```sh
npm run build
npm run preview
```

## Arquitectura

- `src/main.tsx`: layout compartido, navegación, componentes `Status`, catálogo y detalle de servicios, carrito, cotización y vistas del portal.
- `src/style.css`: sistema visual, Tailwind CSS y estilos responsive.
- `vite.config.ts`: integración de React y Tailwind CSS.

El catálogo usa datos simulados. El carrito vive en memoria y se reinicia al recargar. El formulario valida los campos y muestra una confirmación local; no envía datos. Los documentos descargables son ejemplos en texto. El acceso administrativo se integra con Keycloak (requiere configuración). No hay pagos, backend ni reservas reales. Los precios son estimados en COP y no incluyen impuestos. Los indicadores comerciales y de auditoría son demostrativos.

Para producción se requiere conectar API, autenticación/autorización, persistencia, documentos privados, cotizaciones y pagos. No introducir credenciales en el frontend.

## Editar servicios sin código

Abre **Administración** en el menú lateral y pulsa **Editar** en un servicio. Puedes cambiar el nombre, categoría, descripción, precio en COP, duración, etiqueta y entregables. **Guardar cambios** actualiza el catálogo, el detalle, el formulario y el carrito en ese navegador.

Este editor requiere un rol administrativo en Keycloak; los datos continúan siendo de demostración y no hay backend. Guarda el catálogo en `localStorage`: no se comparte con otras personas, no modifica GitHub y puede perderse al borrar los datos del navegador o cambiar la dirección de acceso del Codespace. Usa **Exportar copia** para descargar un JSON e **Importar copia** para recuperarlo en otro navegador. Las importaciones se validan antes de confirmar el reemplazo; **Restaurar originales** también requiere confirmación.

- `src/catalog.ts`: datos iniciales, validación y persistencia local.
- `src/components/AdminPanel.tsx`: editor, exportación/importación y restauración.
- `scripts/admin-smoke.cjs`: prueba de navegador para edición, persistencia, integración con el catálogo/carrito, copias y recuperación. Requiere Playwright y Chromium disponibles; con el servidor activo ejecuta `node scripts/admin-smoke.cjs`. En instalaciones externas puedes indicar `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH`.

La administración compartida requiere además un backend con autorización y almacenamiento persistente. No guardes secretos ni información privada en este editor.


## Público y administración

El público puede acceder a Inicio, Catálogo, detalle, carrito y cotización. El portal y la administración requieren una sesión de Keycloak y el rol `admin` de realm o del cliente configurado. Google se conecta mediante Keycloak. Sin configuración, el área administrativa está cerrada.

Consulta [la guía de Keycloak y Google](docs/keycloak.md) y completa `.env.local` a partir de `.env.example`. No se han configurado credenciales ni probado SSO real. La API y los documentos privados reales siguen pendientes de implementar; la autorización de frontend no sustituye los controles de un backend.

Las pruebas `scripts/auth-smoke.cjs` y `scripts/admin-smoke.cjs` necesitan Playwright y Chromium. Para el servidor con proveedor **simulado solo en las pruebas**, inicia Vite en el puerto 5174 con `VITE_KEYCLOAK_URL=https://identity.example.test VITE_KEYCLOAK_REALM=ingenia VITE_KEYCLOAK_CLIENT_ID=ingenia-web VITE_KEYCLOAK_GOOGLE_IDP=google npm run dev -- --port 5174`; mantén otro servidor sin configuración en el 5175 (`VITE_KEYCLOAK_URL= VITE_KEYCLOAK_REALM= VITE_KEYCLOAK_CLIENT_ID= npm run dev -- --port 5175`). Ejecuta después `node scripts/auth-smoke.cjs` y `node scripts/admin-smoke.cjs`. Estas URL de prueba no sirven para iniciar sesión real.

## Vista previa del panel

En **Acceso administrativo → Ver demo del panel** puedes recorrer las seis secciones sin configurar Keycloak. La demostración usa exclusivamente datos ficticios de `src/components/DemoWorkspace.tsx`; no inicia sesión, no cambia roles y no permite editar servicios ni consultar documentos privados. **Salir de la demo** vuelve a la pantalla de acceso. Las pantallas administrativas reales siguen exigiendo el rol de Keycloak.

El botón **Hablar con un experto** está destacado en Inicio, Catálogo y Carrito para visitantes; no se muestra en acceso administrativo, demo ni sesiones administrativas. El logotipo horizontal se sirve desde `public/ingenia-cyber-logo.png`.

`scripts/preview-smoke.cjs` verifica la vista previa, el CTA público, la ausencia de escrituras y la navegación móvil con el servidor local del puerto 5173 activo. Requiere Playwright y Chromium, igual que las demás pruebas de navegador.

## Perfil del usuario

El avatar de la esquina superior derecha aparece en la demo y en sesiones autenticadas. Abre **Mi perfil**. En la demo puedes probar nombre, correo, teléfono, empresa, cargo y foto con datos ficticios: solo se mantienen en memoria, no se envían ni se guardan en localStorage. Recargar restablece el perfil inicial. A diferencia del resto de la demo, el formulario de perfil permite esta edición simulada. Las fotos admiten PNG, JPG o WebP de hasta 2 MB.

Para usuarios autenticados, el perfil muestra el nombre y correo de la sesión; **Actualizar mis datos** abre el portal oficial de cuenta de Keycloak. Allí se actualizan los atributos habilitados por la organización. Los datos vinculados a Google pueden requerir cambios desde Google. El frontend reflejará los cambios al renovar la sesión. La actualización contra un servidor real sigue pendiente de configurar y validar.

`scripts/profile-smoke.cjs` verifica avatar, edición, foto, cancelación, móvil y apertura del portal con SDK simulado. Usa los mismos servidores y requisitos que `auth-smoke.cjs`.

Las direcciones actuales proporcionadas para ambos Codespaces y los campos exactos que registrar en Keycloak están en [Conectar los Codespaces actuales](docs/keycloak-codespaces.md). El cliente público fue confirmado y `.env.development` carga esos datos automáticamente en desarrollo. Reinicia Vite después de actualizar. `.env.local` o variables del proceso tienen prioridad; producción requiere su propia configuración.


## Inicio de sesión voluntario

Inicio y Catálogo no comprueban SSO mediante redirecciones al cargar. El SDK procesa el retorno de un inicio de sesión explícito, pero no usa `onLoad: check-sso` ni `login-required`. Abrir la pantalla de acceso tampoco redirige: hay que pulsar **Entrar con Keycloak** o **Continuar con Google**. Tras recargar, si no se está procesando un callback válido, la aplicación vuelve al modo público; la sesión del proveedor puede reutilizarse al pulsar Entrar. Los tokens no se persisten en el navegador.

`scripts/public-login-smoke.cjs` usa el SDK real y una respuesta interceptada del proveedor de prueba para verificar que cargar, navegar y recargar no contacta al proveedor, y que el inicio explícito usa el retorno raíz y PKCE S256. No sustituye la validación del servidor Keycloak real.

### Opciones de cuenta y cierre de sesión

**Mi perfil** agrupa **Datos personales** y **Seguridad y sesión**. Muestra el tipo de cuenta, el usuario y el estado de verificación del correo cuando Keycloak lo incluye. Los botones de seguridad y dispositivos abren la consola de cuenta de Keycloak, donde se gestionan las opciones habilitadas por el servidor.

**Cerrar sesión** está disponible tanto dentro del perfil como en el menú lateral para cualquier usuario autenticado, tenga o no rol administrativo. Desde el perfil vuelve a Inicio y retira inmediatamente el acceso local, incluso si falla el proveedor o termina una renovación de token pendiente. El cierre remoto usa el logout oficial de Keycloak con retorno al origen actual. La cuenta de Google del navegador permanece independiente. En la demo se ofrece **Salir de la demostración**, sin simular un cierre de cuenta real.

`scripts/profile-logout-smoke.cjs` prueba estos casos con el SDK simulado, incluidas la expiración de permisos al cerrar y una respuesta de renovación tardía. La validación con el servidor de identidad real corresponde al despliegue configurado.
