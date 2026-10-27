# Conectar los Codespaces actuales

## Direcciones proporcionadas

- Keycloak: `https://sturdy-barnacle-r4w5gvjjjj4rhp455-8081.app.github.dev`
- Realm: `clientes-dev`
- Cliente del frontend: `clientid-web-react` (debe ser público: Client authentication OFF y Standard flow ON).
- Proveedor de identidad: `google`.
- Aplicación: `https://infamous-spooky-tomb-g46vqwgggvvw39gjw-5173.app.github.dev/`
- Rol propuesto: `admin` (pendiente de crear/asignar si todavía no existe).

## Ajustes del cliente en Keycloak

En el realm **clientes-dev → Clients → clientid-web-react** comprueba:

- **Client authentication: OFF**.
- **Standard flow: ON**.
- **Implicit flow: OFF**, **Direct access grants: OFF**.
- PKCE obligatorio con **S256**.

El cliente `clientid-web-react` es el del frontend. No cambies el cliente de una API ni pongas un client secret en React.

Registra estas direcciones en el cliente público:

**Valid redirect URIs**

```text
https://infamous-spooky-tomb-g46vqwgggvvw39gjw-5173.app.github.dev/
```

**Valid post logout redirect URIs**

```text
https://infamous-spooky-tomb-g46vqwgggvvw39gjw-5173.app.github.dev/
```

**Web origins** (sin barra final)

```text
https://infamous-spooky-tomb-g46vqwgggvvw39gjw-5173.app.github.dev
```

Configura el hostname/proxy de Keycloak para que su documento de descubrimiento anuncie la URL HTTPS externa, no `localhost` ni HTTP. Comprueba desde el navegador:

```text
https://sturdy-barnacle-r4w5gvjjjj4rhp455-8081.app.github.dev/realms/clientes-dev/.well-known/openid-configuration
```

El `issuer` debe ser `https://sturdy-barnacle-r4w5gvjjjj4rhp455-8081.app.github.dev/realms/clientes-dev` y los endpoints deben usar el mismo host HTTPS. El entorno de desarrollo de Codex no pudo validar esta URL: su proxy devolvió `403 Forbidden` al establecer el túnel. Eso no determina si funciona desde tu navegador.

## Permisos y Google

Crea un rol de realm `admin` y asígnalo manualmente al usuario autorizado. Iniciar sesión con Google no concede este rol automáticamente.

En **Identity providers → google**, copia el Redirect URI que Keycloak muestra y regístralo en el cliente OAuth de Google Cloud. Para este hostname y alias, normalmente será:

```text
https://sturdy-barnacle-r4w5gvjjjj4rhp455-8081.app.github.dev/realms/clientes-dev/broker/google/endpoint
```

Usa el URI mostrado por tu servidor como referencia definitiva. Client ID y Client Secret de Google se guardan solo en Keycloak. Ambas máquinas deben estar activas y el navegador debe poder acceder a Keycloak; la protección del puerto de Codespaces puede impedir las solicitudes CORS/token desde otro origen. Conserva el puerto de la aplicación privado. Para un servicio estable utiliza un servidor de identidad con dominio y HTTPS persistentes, sin la pantalla de autenticación de un puerto de desarrollo delante de sus endpoints.

## Activar la configuración local

Los valores públicos del Codespace están guardados en `.env.development`, que Vite utiliza en desarrollo. `.env.local` y las variables del proceso tienen prioridad: si ya existen, comprueba que no contengan direcciones anteriores. Para producción configura las variables en el entorno de compilación; `.env.development` no se utiliza en `npm run build`.

```sh
git pull origin main
npm ci
```

Reinicia Vite para cargar la configuración:

```sh
npm run dev
```

Prueba Keycloak y Google con un usuario sin rol y con uno administrativo. Verifica acceso denegado al primero, acceso a las seis secciones al segundo, cierre de sesión y portal de perfil. Todavía no se ha realizado esta validación real. La demo sigue disponible y no requiere activar estas variables.
