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

El catálogo usa datos simulados. El carrito vive en memoria y se reinicia al recargar. El formulario valida los campos y muestra una confirmación local; no envía datos. Los documentos descargables son ejemplos en texto. No hay autenticación, pagos, backend ni reservas reales. Los precios son estimados en COP y no incluyen impuestos. Los indicadores comerciales y de auditoría son demostrativos.

Para producción se requiere conectar API, autenticación/autorización, persistencia, documentos privados, cotizaciones y pagos. No introducir credenciales en el frontend.

## Editar servicios sin código

Abre **Administración** en el menú lateral y pulsa **Editar** en un servicio. Puedes cambiar el nombre, categoría, descripción, precio en COP, duración, etiqueta y entregables. **Guardar cambios** actualiza el catálogo, el detalle, el formulario y el carrito en ese navegador.

Este editor es una demostración sin autenticación ni backend. Guarda el catálogo en `localStorage`: no se comparte con otras personas, no modifica GitHub y puede perderse al borrar los datos del navegador o cambiar la dirección de acceso del Codespace. Usa **Exportar copia** para descargar un JSON e **Importar copia** para recuperarlo en otro navegador. Las importaciones se validan antes de confirmar el reemplazo; **Restaurar originales** también requiere confirmación.

- `src/catalog.ts`: datos iniciales, validación y persistencia local.
- `src/components/AdminPanel.tsx`: editor, exportación/importación y restauración.
- `scripts/admin-smoke.cjs`: prueba de navegador para edición, persistencia, integración con el catálogo/carrito, copias y recuperación. Requiere Playwright y Chromium disponibles; con el servidor activo ejecuta `node scripts/admin-smoke.cjs`. En instalaciones externas puedes indicar `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH`.

La administración compartida real requiere un backend con autorización y almacenamiento persistente. No guardes secretos ni información privada en este editor.
