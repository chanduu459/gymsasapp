# Frontend Files

This project’s frontend lives primarily in the `src/` folder.

## Frontend entry and app shell

- `src/main.tsx` — React app bootstrap
- `src/App.tsx` — root app component/routing shell
- `src/index.css`, `src/App.css` — global and app-level styles

## Core frontend layers

- `src/pages/` — page-level screens (Dashboard, Login, Members, Plans, etc.)
- `src/components/` — reusable components and UI wrappers
- `src/components/ui/` — shadcn/ui base components
- `src/sections/` — landing/home sections (Hero, Services, Footer, etc.)
- `src/contexts/` — React contexts (e.g., auth)
- `src/hooks/` — reusable custom hooks
- `src/services/` — API client and request helpers
- `src/types/` — shared TypeScript types
- `src/lib/` — utility helpers

## Frontend build/dev config

- `vite.config.ts` — Vite configuration
- `tailwind.config.js` — Tailwind setup
- `postcss.config.js` — PostCSS setup
- `components.json` — shadcn/ui component config
- `index.html` — Vite HTML template
