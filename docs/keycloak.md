# Acceso administrativo con Keycloak y Google

Inicio, Catálogo, detalle, carrito y cotización son públicos. Mi dashboard, Mis solicitudes, Reservas, Auditorías, Documentos y Administración se muestran solo a una sesión autenticada con el rol administrativo. El indicador «Entorno seguro» se eliminó y los visitantes ya no ven el avatar ni las notificaciones administrativas.

## Estado actual

La aplicación usa el adaptador oficial `keycloak-js`, Authorization Code con PKCE S256 y tokens en memoria. Sin configuración, con un usuario sin rol, ante un fallo de inicio de sesión o al fallar la renovación, el área administrativa permanece cerrada. No hay cuentas demo que permitan saltar el inicio de sesión. El inicio de sesión de Google se realiza mediante un proveedor de identidad configurado en Keycloak.

La protección de esta versión es de navegación en el frontend. Los datos de servicios, reservas y auditorías siguen siendo simulados y los archivos de ejemplo no son privados reales: están incluidos en el frontend. No hay una API ni almacenamiento de documentos protegido. Antes de incorporar información real se necesita un backend que valide firma, issuer, audiencia, vencimiento y permisos del access token en cada operación, además de autorización para cada documento. Nunca usar la visibilidad del menú o localStorage como control de acceso del servidor.

## 1. Preparar Keycloak

En tu servidor Keycloak, servido mediante HTTPS:

1. Crea un realm para la empresa, por ejemplo `ingenia`.
2. Crea un cliente OpenID Connect público, por ejemplo `ingenia-web`: **Client authentication OFF**, **Standard flow ON**, **Implicit flow OFF** y **Direct access grants OFF**. Exige PKCE con **S256** en su configuración avanzada.
3. En **Valid redirect URIs** registra la raíz exacta de tu web con `/` al final. La aplicación devuelve el inicio de sesión a esa URL, sin rutas adicionales. En **Valid post logout redirect URIs** registra la misma URL. En **Web origins** registra su origen, sin ruta. Evita comodines para dominios.
4. Para Codespaces usa su URL HTTPS reenviada del puerto 5173, no el hostname interno del contenedor. Para desarrollo local puedes registrar también `http://localhost:5173/` y el origen `http://localhost:5173`.
5. Crea el rol de realm `admin` y asígnalo únicamente al personal autorizado. También se acepta un rol de cliente `admin` perteneciente a `ingenia-web`. Comprueba que el access token incluye el claim de roles correspondiente. Las cuentas sin ese rol no tendrán acceso administrativo.
6. Comprueba que el issuer de Keycloak y sus endpoints sean accesibles desde el navegador y que CORS permita el origen de la aplicación.

## 2. Configurar el frontend

Copia `.env.example` a `.env.local` y completa estos parámetros **públicos**:

```dotenv
VITE_KEYCLOAK_URL=https://identidad.tu-dominio.com
VITE_KEYCLOAK_REALM=ingenia
VITE_KEYCLOAK_CLIENT_ID=ingenia-web
VITE_KEYCLOAK_ADMIN_ROLE=admin
VITE_KEYCLOAK_GOOGLE_IDP=google
```

Son ejemplos; debes reemplazar la URL y usar los nombres reales de tu servidor. Si aún no configuraste Google, deja `VITE_KEYCLOAK_GOOGLE_IDP` vacío. El botón de Google aparecerá cuando declares el alias.

```sh
npm ci
npm run dev
```

Reinicia Vite tras editar las variables. Para producción, las variables se incorporan al ejecutar `npm run build`: no se cambian dinámicamente después de la compilación. Toda variable `VITE_*` será visible en el frontend. No pongas contraseñas, access tokens, client secrets ni credenciales de Google en ellas.

## 3. Conectar Google en Keycloak

1. Crea un cliente OAuth web en Google Cloud, con su pantalla de consentimiento y usuarios de prueba si corresponde.
2. En Keycloak añade el proveedor de identidad Google con alias `google`. Usa el redirect URI que muestra Keycloak como **Authorized redirect URI** en Google Cloud. El callback pertenece a Keycloak, no al frontend.
3. Introduce el client ID y el client secret de Google **solo en el servidor Keycloak**. No los guardes en este repositorio ni en variables `VITE_*`.
4. Configura un flujo de primer acceso que evite vinculación automática insegura de cuentas; requiere verificación o reautenticación para vincular cuentas existentes.
5. Asigna `admin` explícitamente a las cuentas administrativas, incluso si entran con Google. No lo concedas como rol por defecto a nuevos usuarios.

## 4. Verificación real pendiente

Cuando el servidor esté disponible, verifica: un visitante solo ve las páginas públicas; un usuario sin rol recibe acceso denegado; un administrador ve las seis secciones; el botón Google redirige al proveedor correcto; cerrar sesión oculta inmediatamente la zona privada; un fallo de renovación retira el acceso.

No se ha probado SSO contra un servidor real en esta implementación porque todavía no se ha configurado. Las pruebas automatizadas usan un doble del SDK exclusivamente en el navegador de prueba. Ese doble no se importa en la aplicación ni se incluye en el build de producción.

## Vista previa sin iniciar sesión

El botón **Ver demo del panel** de la pantalla de acceso abre una maqueta independiente de solo lectura. Usa datos ficticios incluidos en `DemoWorkspace`, no cambia el estado de autenticación ni muestra el editor o los documentos de una sesión real. Permite revisar el diseño mientras se configura Keycloak. Salir de la demo devuelve al acceso protegido.

## Datos personales y portal de cuenta

El avatar de usuarios autenticados abre **Mi perfil**. El botón **Actualizar mis datos** usa `keycloak.accountManagement()` para abrir la consola oficial del realm. Habilita la consola de cuenta de Keycloak y configura los atributos editables/verificaciones de correo según la política de la organización. Los datos leídos del token se actualizan en la interfaz al renovar la sesión; no se sobrescriben con datos del navegador. No se han validado cambios reales porque no hay servidor configurado.

La demo tiene un formulario separado que solo modifica un perfil ficticio en memoria, incluida una foto local. No modifica Keycloak, Google, roles ni almacenamiento persistente.
