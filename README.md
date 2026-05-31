# Markdown Notes

A full-stack markdown notes app with authentication and autosave.

## Stack

- **Next.js 16** (App Router, Server Actions)
- **Auth.js v5** (credentials auth, JWT sessions)
- **Prisma 7** + `@prisma/adapter-pg`
- **PostgreSQL** (Neon in production)
- **TailwindCSS 4** + Typography plugin
- **TypeScript**

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="$(openssl rand -base64 32)"
```

> **Neon users**: use your connection string from the Neon dashboard.

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Start dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel + Neon)

1. Create a [Neon](https://neon.tech) database and copy the connection string
2. Push to GitHub and import the repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel:
   - `DATABASE_URL` — Neon connection string
   - `AUTH_SECRET` — 32-byte random string
4. Deploy

## Project structure

```
app/
  (auth)/login|signup     Auth pages
  (dashboard)/dashboard   Note grid
  notes/[id]              Note editor
  api/auth/[...nextauth]  Auth.js handler
actions/
  auth.ts                 Signup/login/logout server actions
  notes.ts                Note CRUD server actions
components/
  auth/                   Login/signup forms, logout button
  notes/                  NoteCard, NoteEditor, CreateNoteButton
  ui/                     Button, Input, Spinner
lib/
  auth.ts                 Auth.js config
  db.ts                   Prisma client singleton
  dal.ts                  Data access layer (verifySession)
  utils.ts                Date formatting, text utilities
proxy.ts                  Route protection (auth guard)
prisma/schema.prisma      Database schema
```

## Key features

- **Autosave**: 800ms debounce — saves on every keystroke pause
- **Split editor**: Write and preview panes side by side (tabs on mobile)
- **Protected routes**: Proxy redirects unauthenticated users to `/login`
- **Server Actions**: All mutations go through server-side validated actions
