FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Optional trusted CA for corporate build proxies; never copied into the image.
RUN --mount=type=secret,id=npm_ca \
    if [ -s /run/secrets/npm_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/npm_ca; fi; \
    npm ci --no-audit --no-fund

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public

# Public SPA configuration, embedded by Vite at build time. Never pass secrets.
ARG VITE_ENTRA_TENANT_ID
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_ADMIN_ROLE=administrator
ARG VITE_ENTRA_ADMIN_OBJECT_IDS
ARG VITE_ENTRA_API_SCOPES
ENV VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID \
    VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID \
    VITE_ENTRA_ADMIN_ROLE=$VITE_ENTRA_ADMIN_ROLE \
    VITE_ENTRA_ADMIN_OBJECT_IDS=$VITE_ENTRA_ADMIN_OBJECT_IDS \
    VITE_ENTRA_API_SCOPES=$VITE_ENTRA_API_SCOPES
RUN test -n "$VITE_ENTRA_TENANT_ID" && test -n "$VITE_ENTRA_CLIENT_ID" && npm run build

FROM nginx:1.28-alpine AS runtime
COPY --chown=nginx:nginx --chmod=644 docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
