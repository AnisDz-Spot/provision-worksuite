# ProVision WorkSuite

A premium, production-ready project management dashboard — built with Next.js 16, React 19, TailwindCSS 4, TypeScript 5, and the latest modern UI libraries. Fully equipped with dark/light theme, Firebase Auth, animation, advanced charts & reusable enterprise-grade components. 

## Features
- Dashboard with analytics, project stats, recent activity
- Projects, Kanban (tasks), team/users, calendar, profile
- Modular layout: sidebar, navbar, theme switcher
- Fully responsive, mobile-first design
- Firebase Auth (Register/Login/Forgot Password)
- Mock demo data for analytics, boards, users, etc. (easily swapped for API)
- Modern, animated: Framer Motion, Shadcn, Radix, Lucide/Heroicons

## Tech Stack
- **Next.js 16 (App Router)**
- **React 19 & TypeScript 5**
- **TailwindCSS 4** (all styles in `app/globals.css`, no config file)
- **@shadcn/ui**, **Radix UI**, **Heroicons/Lucide**
- **Framer Motion**, **Recharts**, **@tanstack/react-table**
- **Firebase Auth & react-firebase-hooks**

## Getting Started

### 1. Install
```bash
npm install
# or
yarn
# or
pnpm i
```

### 2. Use with Demo Data (no backend required)
```bash
npm run dev
```
- App auto-loads all content from `/data/*.json`
- All dashboard, Kanban, and analytics widgets use local demo JSON files
- Auth pages show but require Firebase setup (see below)

### 3. (Optional) Configure Firebase Auth
- [Create a Firebase Project](https://console.firebase.google.com/) > Enable "Authentication" (Email/Password)
- Copy config from Firebase console
- Paste into `lib/firebase.ts` (see inline instructions)
- For production, use env vars instead

> Login, Register, Forgot Password will function only after Firebase setup.

### 4. Mock Data
- `data/projects.json`: projects
- `data/tasks.json`: tasks (used by Kanban)
- `data/users.json`: users/team info
- `data/analytics.json`: chart and widget summaries
- `data/calendar.json`: calendar events

Swap/edit these JSONs to update the dashboard instantly for demos!

### 5. Deployment
- **Vercel:**
  - Connect repo or use one-click [Vercel Deploy](https://vercel.com/import)
  - Set any needed env vars for Firebase
- **Netlify:**
  - Connect repo, set build command as `npm run build`, output as `.next`
  - Set required Firebase config if using Auth
- Next.js 16+ is ready for both platforms out of the box

## Project Structure
- `/app`: All routes/pages (Next.js App Router)
- `/components`: UI components (layout, widgets, forms, modals, hooks/ui)
- `/lib`: Utilities, Firebase setup
- `/data`: Mock data (JSONs for analytics, tasks, projects, users, calendar)
- `/styles`: (For additional modules if required)

---

Built by [YourTeam]. For demo, extension, or fork for your own use!
Questions? See code comments or open an issue.
