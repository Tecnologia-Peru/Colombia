# Microsoft Entra ID · Ingenia Cyber

La autenticación activa usa `@azure/msal-browser`, Authorization Code con PKCE y un tenant concreto. No utiliza Google ni Keycloak. Abrir Inicio, Catálogo o Acceso administrativo no inicia una redirección: el usuario pulsa **Entrar con Microsoft**.

## Configuración proporcionada

| Campo | Valor |
| --- | --- |
| Tenant | `53770323-9420-426e-b424-32979b5ea334` |
| Client ID de la SPA | `232ff5c3-6ffb-40dd-8e01-58488bbab3e8` |
| App Role administrativo (valor, no etiqueta) | `administrator` |
| URI de plataforma actual | `https://paranormal-hobgoblin-69jp6r6x9r93rp5v-5173.app.github.dev/` |
| API | `906e3302-bbfb-4fe7-a064-a9fd96f0166b` |

Scopes delegados, como dos entradas distintas:

```text
api://906e3302-bbfb-4fe7-a064-a9fd96f0166b/Productos.Leer
api://906e3302-bbfb-4fe7-a064-a9fd96f0166b/Productos.Escribir
```

Los valores están en `.env.development` y `.env.example`. `.env.local` o las variables del proceso tienen prioridad. En producción configura los mismos valores públicos en el entorno de compilación o en un archivo local ignorado antes de `npm run build`; `.env.development` no se carga en builds de producción. No se requieren ni se deben incluir client secrets, contraseñas o tokens.

El retorno y el post-logout se calculan con `window.location.origin + '/'`: registra el origen de cada entorno utilizado. La autoridad es exclusivamente `https://login.microsoftonline.com/53770323-9420-426e-b424-32979b5ea334`, sin `common`, cuentas personales ni Google.

## Ajustes requeridos en Entra

1. En **Registros de aplicaciones**, abre la SPA con Client ID `232ff5c3-6ffb-40dd-8e01-58488bbab3e8`.
2. Selecciona **Solo las cuentas de este directorio organizativo** como tipos de cuenta admitidos.
3. En **Autenticación**, añade la URI anterior en una plataforma **Single-page application (SPA)**. No la registres únicamente como Web. El flujo es Authorization Code + PKCE; no habilites implicit grant ni añadas un secret a React.
4. En **Roles de aplicación**, crea/habilita el rol cuyo **Value** sea exactamente `administrator`, con miembros Usuarios/Grupos. El nombre mostrado puede ser Administrador.
5. En **Aplicaciones empresariales → la aplicación web → Usuarios y grupos**, asigna el rol a los administradores. Debe incluirse en `roles` del **ID token de la SPA**. Tener un rol con nombre similar en otra aplicación o ser administrador del tenant no sustituye esta asignación.
6. En **Permisos de API**, agrega los permisos **delegados** `Productos.Leer` y `Productos.Escribir` de la API indicada. Concede consentimiento de administrador si la política o los permisos lo requieren. La API debe haber expuesto esos scopes y permitir su uso a esta SPA.
7. Cierra sesión y vuelve a entrar después de cambiar roles o permisos.

## Código y flujo

- `src/auth/entraConfig.ts`: tenant, client, scopes, autoridad y opciones de MSAL.
- `src/auth/AuthProvider.tsx`: inicialización, retorno del login, sesión, roles, acceso al token de API y cierre.
- `src/auth/AdminAccess.tsx`: botón único de Microsoft y explicación cuando falta el rol.
- `src/components/UserProfile.tsx`: perfil, acceso a Mi cuenta de Microsoft y cierre.

`loginRedirect()` solicita los scopes OIDC y los dos scopes de la API. MSAL prepara `state`, `nonce` y PKCE y procesa el retorno mediante `handleRedirectPromise()`. El panel exige que el ID token corresponda al client y tenant configurados y tenga `roles: ["administrator"]`.

`useAuth().getApiAccessToken()` utiliza `acquireTokenSilent()` para obtener el access token destinado a la API. Si falta consentimiento o se requiere interacción, rechaza la promesa; el consumidor debe mostrar la necesidad de volver a iniciar sesión, sin registrar tokens. No hay endpoint de API proporcionado ni se han añadido llamadas reales al backend. El catálogo y las auditorías siguen siendo simulados.

Las cuentas se conservan mediante la caché **sessionStorage de MSAL**, de modo que una recarga puede recuperar la sesión de esa pestaña. No hay caché propia de tokens ni se imprimen sus valores. Una renovación que requiere interacción retira el acceso local y ofrece iniciar sesión, sin redirigir automáticamente al público. Logout revoca el acceso local inmediatamente y solicita el cierre a Microsoft. Mi perfil abre `https://myaccount.microsoft.com/` para los datos, dispositivos y seguridad permitidos por la organización.

## La API debe validar sus propios permisos

El ID token identifica al usuario frente a la SPA; no se envía como autorización a la API. Usa el **access token** para `Authorization: Bearer ...`. El servidor debe validar firma, issuer, tenant, vencimiento, audiencia de su registro y el claim `scp` con los permisos necesarios. En access tokens v2, la audiencia esperada de esta API es normalmente su Client ID `906e3302-bbfb-4fe7-a064-a9fd96f0166b`; confirma la versión de tokens configurada en el registro de la API. La comprobación de roles en React no sustituye autorización del backend.

## Keycloak conservado, inactivo

- Sus variables permanecen **comentadas** al final de `.env.development` y `.env.example`.
- El proveedor anterior está íntegramente comentado en `src/auth/KeycloakAuthProvider.legacy.ts`.
- Se retiró `keycloak-js` de las dependencias y no se importa su SDK.
- Las guías y pruebas anteriores son históricas; las pruebas están en `scripts/legacy-keycloak/` y no verifican la integración activa.

## Verificación

Con el servidor de desarrollo activo en 5173 y Playwright/Chromium disponibles:

```sh
node scripts/entra-smoke.cjs
node scripts/entra-sdk-smoke.cjs
node scripts/preview-smoke.cjs
```

Puedes especificar `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH` si las herramientas están fuera de la resolución estándar. Las dos primeras pruebas usan, respectivamente, MSAL simulado y el SDK real con respuestas HTTPS sintéticas de Microsoft. Prueban navegación pública, PKCE, scopes, intercambio del código, tenant, audiencias del ID token, roles, recarga y cierre. No prueban una cuenta o consentimiento real del tenant.

Para completar la validación real, entra desde el Codespace con un usuario asignado a `administrator`, comprueba el panel y cierra la sesión. Repite con una cuenta sin el rol y verifica que se deniegue el área administrativa. No compartas access tokens, ID tokens, códigos ni refresh tokens.
