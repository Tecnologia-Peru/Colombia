# Clarity · Servicios de ciberseguridad

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

El catálogo usa datos simulados. El carrito vive en memoria y se reinicia al recargar. El formulario valida los campos y muestra una confirmación local; no envía datos. Los documentos descargables son ejemplos en texto. No hay autenticación, pagos, backend ni reservas reales. Los precios son estimados en COP y no incluyen impuestos. Los indicadores comerciales y de auditoría son demostrativos.

Para producción se requiere conectar API, autenticación/autorización, persistencia, documentos privados, cotizaciones y pagos. No introducir credenciales en el frontend.
