# Ingenia Cyber · Servicios de ciberseguridad

Frontend React, TypeScript, Vite y Tailwind CSS. Tema claro, catálogo público, carrito, cotización y portal administrativo con Microsoft Entra ID. Los servicios, solicitudes, auditorías, reservas y documentos siguen siendo datos de demostración.

## Desarrollo

Requiere Node.js 20.19+ o 22.12+ y npm.

```sh
npm ci
npm run dev
```

En Codespaces abre el puerto 5173 con visibilidad privada. Inicio y Catálogo funcionan sin iniciar sesión. **Acceso administrativo → Entrar con Microsoft** inicia el flujo de Entra. **Ver demo del panel** permite revisar el diseño con datos ficticios sin conceder permisos reales.

## Identidad activa: Microsoft Entra ID

La configuración pública proporcionada está en `.env.development`; `.env.example` documenta los mismos valores. Tenant exclusivo de la organización, Client ID de la SPA `232ff5c3-6ffb-40dd-8e01-58488bbab3e8`, App Role `administrator` y scopes `Productos.Leer` y `Productos.Escribir`. No hay Google ni Keycloak activos.

Registra la URL de retorno como **SPA**, asigna el App Role a tu usuario y configura los permisos delegados de API y el consentimiento requerido. Consulta [la guía de Microsoft Entra ID](docs/entra-id.md) con las direcciones exactas, archivos y pasos. Nunca agregues un client secret a React. `.env.local` y las variables del proceso tienen prioridad; reinicia Vite tras editarlas.

Las variables antiguas de Keycloak están comentadas y su proveedor se conserva comentado en `src/auth/KeycloakAuthProvider.legacy.ts`. Las guías y pruebas de Keycloak son solo referencia histórica; las pruebas están en `scripts/legacy-keycloak/`.

## Compilación

```sh
npm run build
npm run preview
```

Los builds de producción necesitan sus variables Entra en el entorno de compilación o en un archivo `.env.local` ignorado; no utilizan `.env.development`. La URI de retorno es siempre el origen actual con `/` final y debe estar registrada en Entra.

## Componentes y comportamiento

- `src/main.tsx`: layout, navegación, catálogo, detalle, carrito y vistas del portal.
- `src/auth/entraConfig.ts` y `AuthProvider.tsx`: MSAL, tenant, roles, scopes, renovación, tokens de API y logout.
- `src/catalog.ts`: datos iniciales, validación y almacenamiento local del catálogo.
- `src/components/AdminPanel.tsx`: edición y copias JSON del catálogo, con rol administrativo.
- `src/components/DemoWorkspace.tsx`: vista previa independiente de solo lectura.
- `src/components/UserProfile.tsx`: datos, seguridad y sesión; la demo permite edición ficticia en memoria.
- `src/style.css`: diseño responsive y Tailwind.

El carrito vive en memoria. La cotización solo valida y muestra una confirmación local: no hay correos, pagos ni almacenamiento de datos personales. Los documentos descargables son ejemplos de texto.

La edición de servicios se conserva en `localStorage` del navegador, se refleja en catálogo/detalle/carrito y permite exportar/importar una copia JSON. No modifica GitHub ni publica cambios para otros visitantes. La demo no modifica el catálogo; su perfil editable se reinicia al recargar.

Para usuarios reales, Mi perfil abre Mi cuenta de Microsoft para las opciones habilitadas por la organización. Cerrar sesión vuelve al sitio público y solicita el cierre a Microsoft. El frontend ofrece `getApiAccessToken()` para la API indicada, pero no hay una URL de backend proporcionada ni peticiones reales a esa API. Antes de usar información real se necesita un backend que valide tokens, scopes y autorización por operación/documento.

## Pruebas de navegador

Con Playwright y Chromium disponibles y Vite en 5173:

```sh
node scripts/entra-smoke.cjs
node scripts/entra-sdk-smoke.cjs
node scripts/preview-smoke.cjs
```

Las pruebas Entra usan identidades y respuestas sintéticas. La segunda utiliza el SDK MSAL real para verificar el flujo OAuth/PKCE, sin credenciales reales. No sustituyen la prueba de inicio de sesión, roles y consentimiento con tu tenant.
