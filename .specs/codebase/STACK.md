# STACK

_Brownfield analysis — 2026-06-21. Versions from `package.json`._

## Runtime & Framework

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI library | React / React DOM | 19.2.3 |
| Language | TypeScript (strict) | ^5 |
| Node | Node.js | 20+ |

## Data & Auth

| Layer | Technology | Version |
|---|---|---|
| Database | Supabase — PostgreSQL 15, RLS on every table | — |
| Client SDK | `@supabase/supabase-js` | ^2.98.0 |
| SSR helpers | `@supabase/ssr` | ^0.9.0 |
| Auth | Supabase Auth — email/password, magic link, password reset | — |

## UI & Styling

| Layer | Technology | Version |
|---|---|---|
| CSS | Tailwind CSS v4 + `@tailwindcss/postcss` + `@tailwindcss/typography` | ^4 |
| Utilities | `tailwind-merge` ^3.5, `clsx` ^2.1 | — |
| Icons | `lucide-react` ^1.14 (re-exported via `@/components/ui/icons`) | — |
| Rich text | TipTap v3 (`@tiptap/react` + ~18 extensions: table, image, link, text-align, etc.) | ^3.20 |
| Charts | `recharts` | ^3.8 |
| Dates | `date-fns` ^4.1 + `react-day-picker` ^9.14 | — |
| Toasts | `sonner` ^2.0 | — |
| Sanitisation | `dompurify` ^3.4 | — |
| Export | `jspdf` ^4.2 + `html2canvas` ^1.4 (PDF) · `html-docx-js` ^0.3 (DOCX) | — |

## AI Providers

| Provider | Default model | Notes |
|---|---|---|
| OpenAI | `gpt-4.1` | Responses API; `gpt-image-1` for images |
| Google Gemini | `gemini-2.5-flash` | text + image generation |
| Anthropic Claude | `claude-sonnet-4-20250514` | retry + exponential backoff |

## Tooling & Scripts

- `npm run dev` — Turbopack dev server on **port 4000**
- `npm run build` / `npm start` — production build / serve on **port 30003**
- `npm run lint` — ESLint ^9 (`eslint-config-next` 16.1.6)
- `npm run db:start|stop|reset|status|studio` — local Supabase stack (`127.0.0.1:54321`)

## Deployment

- Vercel, auto-deploy on push to `master`.
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Optional env: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `BREVO_API_KEY`, `APIFY_TOKEN`, `PEXELS_API_KEY`,
  `BUFFER_API_KEY`, `POSTIZ_API_KEY`, `CRON_SECRET`.
