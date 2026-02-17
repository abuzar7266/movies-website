# QuasarReel — Replica (Fresh Setup)

This repository is a clean, history‑free re‑initialization of the QuasarReel frontend using the latest stable libraries.

What’s included:
- React + TypeScript + Vite (latest)
- Tailwind CSS v4 (no config file needed)
- ESLint (latest) via the Vite template

## Getting Started
- Install dependencies: `npm i`
- Run dev server: `npm run dev` (http://localhost:5173)
- Build: `npm run build`
- Preview build: `npm run preview`

## Styling
Tailwind v4 is enabled via a single import in `src/index.css`:

@import "tailwindcss";

No Tailwind config is required for basic usage.

## Change Log
- Initial scaffold: Vite React + TS, Tailwind v4 wired in.
- Routing + base layout: react-router-dom, Navbar/Footer, skeleton pages.

## Routing
- `/` Home
- `/login` Login
- `/register` Register
- `/movie/:id` Movie details
- `*` Not found
