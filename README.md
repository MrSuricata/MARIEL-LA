# MARIEL'LA — Artesanía en Cuero Uruguaya

Web + tienda online del emprendimiento de Mariela Calistro (Piriápolis, Uruguay).
Producción: **https://mariel-la.vercel.app** (deploy automático desde `main`).

## Stack

- **React 19 + Vite 6 + TypeScript**, en un solo `App.tsx` (patrón del proyecto).
- **Tailwind CSS 3.4** compilado localmente (`tailwind.config.js` + `index.css`) + plugin typography.
- **React Router 7** con `BrowserRouter` (URLs limpias; `vercel.json` tiene el rewrite SPA y un shim redirige los links viejos `/#/...`).
- **Supabase** para datos, storage de imágenes y auth de admin.

## Base de datos (importante)

El proyecto Supabase original (`MARIELLA`, ref `zlguzxaxkmxxjaahxqcj`) quedó **pausado** por el
límite de 2 proyectos activos del plan free (los activos son TWF y volea-web).
Desde julio 2026 MARIEL'LA vive como *tenant* dentro del proyecto **volea-web**
(ref `scftuxrtflfowohiewsc`, región sa-east-1):

- Tablas con prefijo: `mariella_products`, `mariella_fairs`, `mariella_history_events`,
  `mariella_blog_posts`, `mariella_categories`, `mariella_admins`.
- Bucket de storage propio: `mariella` (lectura pública, escritura solo admin).
- Seguridad: función `mariella_is_admin()` + RLS — lectura pública, escritura únicamente
  para el usuario de Supabase Auth `admin@mariel-la.vercel.app` (independiente del admin de Volea).
- No hay variables de entorno: URL + anon key (pública por diseño) están en
  `services/supabaseClient.ts`. El esquema completo está en `supabase-setup.sql`.

Para cambiar la contraseña de admin: Supabase Dashboard → proyecto volea-web →
Authentication → Users → `admin@mariel-la.vercel.app` → Reset password.

## Correr local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción en dist/
```

## Contenido

- Todo el contenido (productos, ferias, historia, blog, categorías) se administra desde
  `/admin` (la guía para Mariela está en [GUIA-ADMIN.md](GUIA-ADMIN.md) y en la pestaña
  **Ayuda** del propio panel).
- `constants.ts` es solo el contenido de *respaldo* que se muestra si la base no responde.
- Los pedidos se cierran por WhatsApp (+598 98 766 318); no hay pasarela de pago.
