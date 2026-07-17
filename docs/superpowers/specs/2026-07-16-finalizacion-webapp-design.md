# MARIEL'LA — Finalización total de la webapp (2026-07-16)

Mandato de Brian: terminar, mejorar, optimizar y revisar toda la webapp hoy, para que Mariela pueda administrarla sola. Sesión autónoma pre-aprobada ("agregar lo que necesites, sin parar").

## Hallazgo crítico
El proyecto Supabase `MARIELLA` (zlguzxaxkmxxjaahxqcj) está **pausado** por el límite de 2 proyectos activos del plan free (ocupados por TWF y volea-web, ambos producción — no se tocan). Resultado: la web en producción no persiste nada desde ~abril; corre con datos demo de `constants.ts`.

## Decisiones de arquitectura
1. **Base de datos**: migrar a un "tenant" dentro del proyecto activo `volea-web` (scftuxrtflfowohiewsc, región sa-east-1, mejor latencia UY). Tablas con prefijo `mariella_*`, función `mariella_is_admin()` + tabla `mariella_admins` (patrón espejo del `is_admin()` de Volea pero 100% independiente — ningún admin cruza entre sitios). Bucket de storage propio `mariella`. Cero impacto en Volea (solo cambios aditivos).
2. **Seguridad**: se elimina la password client-side (`VITE_ADMIN_PASSWORD`, comparación en el bundle + escritura anónima abierta en RLS = cualquiera podía borrar la base). Ahora: Supabase Auth con usuario `admin@mariel-la.vercel.app` (email sintético fijo en código; Mariela solo escribe su contraseña, la misma de siempre) y RLS de escritura restringida a `mariella_is_admin()`. Sesión persistente (no se desloguea al refrescar).
3. **Config**: URL + anon key de Supabase hardcodeadas en `supabaseClient.ts` (las anon keys son públicas por diseño; evita drift de env vars en Vercel, que hoy apuntan al proyecto pausado).
4. **Tailwind**: del CDN (~300KB runtime, no apto producción) a build local v3.4 + plugin typography (los `prose` del blog hoy no hacen nada). Paleta leather y fuentes en `tailwind.config.js`; estilos custom en `index.css`. Se elimina el importmap muerto de aistudiocdn.
5. **Routing**: HashRouter → BrowserRouter (URLs limpias, SEO), rewrites SPA en `vercel.json`, shim de redirección para links viejos `/#/...`, sitemap/robots actualizados.
6. **Datos**: `storageService` distingue error (→ fallback demo) de vacío real (→ lista vacía honesta), propaga errores; el StoreProvider hace rollback y muestra toast si un guardado falla (antes fallaba en silencio con UI optimista). Se agrega columna `is_sold_out` (el SQL viejo no la tenía).

## Mejoras de producto (fase UX)
Toasts globales; feedback al agregar al carrito (toast + bounce del badge); ESC cierra modales/carrito; lightbox con flechas y teclado; botón "Consultar por WhatsApp" por producto; badge "Pieza única"; catálogo con orden (destacadas/precio/recientes) + contador + skeletons; blog con URLs navegables reales; fix del bug de timezone en fechas de ferias (new Date('YYYY-MM-DD') mostraba el día anterior en UY); home con sección "Cómo comprar" y CTA de Instagram; fix collage Conoce a Mariela; footer con link a Historia (página huérfana) y ubicación Piriápolis; scroll-to-top; prefers-reduced-motion; scope correcto del CSS global de inputs (rompía checkboxes); aria-labels. Admin: pestaña **Ayuda** con guía simple para Mariela, toggles rápidos Destacado/Agotado, upload de foto en Historia, errores visibles.

## Verificación
tsc + build + recorrido E2E de todas las rutas en preview (desktop/mobile), CRUD admin real contra Supabase (crear→editar→borrar producto de prueba), test negativo de RLS (anon no escribe), consola/red limpias, luego deploy y verificación en producción.
