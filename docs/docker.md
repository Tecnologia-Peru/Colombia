# Imagen Docker · Ingenia Cyber

La imagen compila el frontend con Node.js y sirve únicamente los archivos de `dist/` con Nginx. El contenedor final no necesita Node, npm ni Vite, no ejecuta como root y escucha en el puerto **8080**.

## Construir y ejecutar

Desde la carpeta del repositorio, con Docker Engine y Docker Compose disponibles:

```sh
git pull origin main
docker compose --env-file .env.example up -d --build
```

Esto crea la imagen **ingenia-cyber:local** e inicia el servicio `web`. El archivo `.env.example` contiene exclusivamente la configuración pública de Entra proporcionada para este proyecto. Revisa esos valores si necesitas otra organización o aplicación.

El puerto predeterminado es **5173 en tu máquina → 8080 en el contenedor**. Detén Vite si ya utiliza 5173. Para usar otro puerto:

```sh
APP_PORT=8080 docker compose --env-file .env.example up -d --build
```

En Codespaces abre **Puertos → puerto elegido → Abrir en el navegador**, conservando visibilidad privada. La URL HTTPS de ese puerto, con `/` final, debe estar registrada como URI de redirección **SPA** en Entra. Si conservas el mismo puerto y Codespace, la URL del frontend permanece igual.

En tu computadora puedes abrir `http://localhost:5173/`. Para iniciar sesión, registra también esa URI SPA de desarrollo en Entra. Fuera de localhost, sirve la aplicación mediante HTTPS con el proxy/plataforma de alojamiento: MSAL requiere un contexto seguro.

## Comandos útiles

```sh
# Construir sin iniciar contenedores
docker compose --env-file .env.example build

# Estado y salud
docker compose --env-file .env.example ps

# Logs del servicio
docker compose --env-file .env.example logs -f web

# Detener y retirar el contenedor de este proyecto
docker compose --env-file .env.example down
```

También puedes ejecutar la imagen ya construida sin Compose:

```sh
docker run --rm --name ingenia-cyber -p 5173:8080 ingenia-cyber:local
```

Ese comando funciona con el usuario no root de la imagen. Compose añade sistema de archivos de solo lectura, `/tmp` temporal y retirada de capacidades.

## Configuración de Entra: en el build

Vite incorpora `VITE_*` a los archivos del navegador durante la compilación. Compose pasa explícitamente estos argumentos de construcción:

- `VITE_ENTRA_TENANT_ID`
- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_ADMIN_ROLE`
- `VITE_ENTRA_ADMIN_OBJECT_IDS`
- `VITE_ENTRA_API_SCOPES`

Cambiar estas variables con `docker run -e` **no cambia una imagen ya compilada**. Para modificar la configuración, prepara un archivo local, por ejemplo `.env.docker.local` (ignorado por Git), y reconstruye:

```sh
docker compose --env-file .env.docker.local up -d --build
```

El Dockerfile exige tenant y Client ID para evitar compilar una imagen aparentemente configurada pero sin autenticación. No usa `.env.development` ni copia `.env.local`: `.dockerignore` limita el contexto a los archivos de construcción. La configuración de Entra es pública; nunca pases client secrets, contraseñas o tokens como argumentos de construcción ni variables VITE.

## Salud y archivos estáticos

- `GET /healthz` devuelve `200` y `ok`; Docker lo utiliza como healthcheck.
- Las rutas de la SPA vuelven a `index.html`.
- Los archivos versionados de `/assets/` llevan caché inmutable; `index.html` exige revalidación.
- Los assets inexistentes devuelven `404` en lugar de HTML.

## Compartir la imagen

La construcción crea una imagen **local**, no la publica en Docker Hub ni en otro registro. Para guardarla como archivo:

```sh
docker save -o ingenia-cyber.tar ingenia-cyber:local
```

En otra máquina:

```sh
docker load -i ingenia-cyber.tar
docker run --rm --name ingenia-cyber -p 5173:8080 ingenia-cyber:local
```

La imagen contiene únicamente el frontend y su configuración pública. No incluye un backend, la base de datos, una sesión de Microsoft, el catálogo modificado en localStorage ni procesos del Codespace. No mantiene una web disponible cuando la máquina anfitriona se detiene. Para publicar la imagen en un registro hace falta elegir el destino y autenticarse allí.

## Validación realizada

Se construyó la imagen y se ejecutó con Compose en un puerto de prueba. Se verificaron estado `healthy`, usuario `nginx`, raíz de solo lectura, `nginx -t`, salud HTTP, carga de HTML/JS, configuración Entra compilada, reglas de caché, fallback SPA y 404 de assets. La prueba `scripts/entra-sdk-smoke.cjs` también pasó contra el frontend del contenedor usando MSAL real con respuestas Microsoft sintéticas; no valida credenciales reales del tenant.

La red del entorno de construcción utilizó su proxy y certificado de confianza. Para redes que necesitan una CA adicional, el Dockerfile admite el montaje opcional de BuildKit `npm_ca`; no desactiva TLS ni copia la CA al contenedor final. Los entornos con acceso directo al registro npm no necesitan ese montaje.
