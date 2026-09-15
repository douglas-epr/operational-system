# Spec: Security P0 — public surface hardening

Status: implemented 2026-09-15 (local only; production apply and deploy pending)

Source: approved plan `1-please-update-all-wondrous-pixel.md`, Phase 4b "Security — P0" (items S1–S8)
and "User decisions (2026-09-15)".

## Objective

Close the eight P0 security findings on the Move37 OS **public / unauthenticated** surface: the Brevo
webhook, the `/m/[slug]` landing pages and their two capture endpoints, the unsubscribe HMAC, and the
HTML rendering path. Today every one of these can be reached without a session, and three of them
(webhook, capture, event) reach the database through the **service-role** client — so an unauthenticated
caller can write rows, and un-sanitized rich HTML from the AI pipeline is rendered verbatim in staff
browsers.

Success = no unauthenticated writer without a verified shared secret, no `dangerouslySetInnerHTML`
outside `sanitizeHtml`, no same-origin escape from the landing-page iframe, no secret reuse of the
service-role key, a throttle on every public writer, a server-only guard on the service-role factory,
and HSTS + observable CSP on every response.

Not a rewrite: no auth-provider change, no hosting change, no new runtime dependency except the one
approved sanitizer.

## Evidence

| # | Finding | Evidence (file:line) |
|---|---|---|
| S1 | Brevo webhook has no authentication at all; handler writes to `mkt_outreach` and `mkt_suppression` via the service-role client | `src/app/api/webhooks/brevo/route.ts:22-77` |
| S2 | `sanitizeHtml` returns the input **unchanged** when it runs on the server — DOMPurify is browser-only, so every RSC/SSR call is a no-op | `src/lib/sanitize.ts:24` |
| S3 | 22 `dangerouslySetInnerHTML` sites render HTML that never passed through `sanitizeHtml` (36 occurrences across 27 files in total) | `src/app/docs/_components/*`, `src/app/ideas-refiner/_components/*`, `src/app/chat/_components/ProjectTabsPanel.tsx`, `src/app/chat/_components/InternalProjectTabsPanel.tsx` |
| S4 | Public landing iframe grants `allow-scripts` **and** `allow-same-origin` together, which voids the sandbox | `src/app/m/[slug]/page.tsx:94-98` |
| S5 | Unsubscribe-link HMAC key falls back to `SUPABASE_SERVICE_ROLE_KEY`, leaking the highest-privilege secret into a signing role | `src/lib/marketing/outreach.ts:56` |
| S6 | Public writes are unthrottled; the code comment admits it | `src/lib/supabase/public.ts:67-69` (consumers: `src/app/api/m/[slug]/capture/route.ts`, `src/app/api/m/event/route.ts`, `src/app/api/webhooks/*`) |
| S7 | `src/lib/supabase/server.ts` has no `import "server-only"`, so the service-role factory can be pulled into a client bundle (`public.ts` and `secretCompare.ts` already have the guard) | `src/lib/supabase/server.ts:1` |
| S8 | No `Strict-Transport-Security`; CSP is explicitly deferred in a comment | `next.config.ts:12-15` |

Already verified **compliant** during the audit, so explicitly not in scope for change: RLS enabled on
85/85 live tables; all 32 `SECURITY DEFINER` functions pin `search_path`; `/api/mkt/cron/*` uses
`timingSafeEqual` and fails closed; zero `console.log`; no secrets in `NEXT_PUBLIC_*`.

## Stories

### P0 — Authenticate the Brevo webhook (S1)

As the platform owner, I want `/api/webhooks/brevo` to reject any caller that cannot present the shared
secret, so nobody can forge delivery/bounce events into `mkt_outreach` or insert arbitrary addresses into
`mkt_suppression`.

**Acceptance criteria**

- AC1: The route reads the secret from the environment. `grep -n "BREVO_WEBHOOK_SECRET" src/app/api/webhooks/brevo/route.ts` returns at least 1 line.
- AC2: The comparison is constant-time via the existing helper. `grep -n "secretEquals" src/app/api/webhooks/brevo/route.ts` returns at least 1 line.
- AC3: A POST with **no** token is rejected. `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/webhooks/brevo -H "content-type: application/json" -d "{}"` prints `401`.
- AC4: A POST with a **wrong** token is rejected. `curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:4000/api/webhooks/brevo?token=wrong" -H "content-type: application/json" -d "{}"` prints `401`.
- AC5: A POST with the **correct** token is accepted. The same curl with the real `BREVO_WEBHOOK_SECRET` value prints `200` or `204`.
- AC6: The route fails **closed** when the env var is missing: `grep -n "BREVO_WEBHOOK_SECRET" src/app/api/webhooks/brevo/route.ts` shows the missing-secret branch returning a 4xx/5xx, and no code path reaches `.insert(` / `.upsert(` before the secret check (verify by reading the handler top-to-bottom; the first `await` touching Supabase appears **after** the check).
- AC7: `.env.example` declares the variable. `grep -c "^BREVO_WEBHOOK_SECRET=" .env.example` returns `1`.

### P0 — Make `sanitizeHtml` server-safe (S2)

As a developer, I want `sanitizeHtml` to actually strip dangerous markup whether it runs in a React
Server Component, a route handler, or the browser, so a single call site is correct everywhere.

**Acceptance criteria**

- AC1: `isomorphic-dompurify` is a production dependency. `node -e "const p=require('./package.json');process.exit(p.dependencies['isomorphic-dompurify']?0:1)"` exits `0`.
- AC2: `src/lib/sanitize.ts` imports it. `grep -n "isomorphic-dompurify" src/lib/sanitize.ts` returns at least 1 line.
- AC3: `src/lib/sanitize.ts` contains **no** `typeof window` branch that returns the input unchanged. `grep -c "typeof window" src/lib/sanitize.ts` returns `0`.
- AC4: The server path strips scripts. `npx tsx -e 'import{sanitizeHtml}from"./src/lib/sanitize";console.log(sanitizeHtml("<p>a</p><script>alert(1)</script>"))'` prints output containing `<p>a</p>` and containing no `<script`.
- AC5: The allow-list admits the TipTap tag set actually produced by the editor. `grep -n "table" src/lib/sanitize.ts` and `grep -n "mark" src/lib/sanitize.ts` each return at least 1 line.
- AC6: The allow-list admits the constrained `style` attribute subset used by TipTap colour/highlight marks. `grep -n "style" src/lib/sanitize.ts` returns at least 1 line inside the allowed-attributes configuration.
- AC7: A round-trip of a real generated document is lossless for allowed markup: sanitizing the HTML stored in one `idea_prd.description` row yields output whose `<h2>` count is unchanged (compare `grep -o "<h2" | wc -l` before and after).

### P0 — Route every raw HTML render through `sanitizeHtml` (S3)

As a staff user, I want every rich-HTML surface (docs, ideas-refiner steps, chat tab panels, invoice
preview, chatbot messages) to be sanitized before it reaches the DOM, so AI- or peer-authored HTML
cannot execute script in my session.

**Acceptance criteria**

- AC1: No unsanitized site remains. `grep -rn "dangerouslySetInnerHTML" src | grep -v "sanitizeHtml" | grep -v "ThemeScript"` returns `0` lines.
- AC2: The documented exception is the static theme bootstrap only. `grep -rn "dangerouslySetInnerHTML" src/components/theme/ThemeScript.tsx | wc -l` returns `1`, and the value it injects is a module-level `const` string with no interpolation of runtime data (verify by reading the file).
- AC3: All `src/app/docs/_components/**` sites are covered. `grep -rn "dangerouslySetInnerHTML" src/app/docs | grep -vc "sanitizeHtml"` returns `0`.
- AC4: All `src/app/ideas-refiner/_components/**` sites are covered. `grep -rn "dangerouslySetInnerHTML" src/app/ideas-refiner | grep -vc "sanitizeHtml"` returns `0`.
- AC5: Both chat tab panels are covered. `grep -rn "dangerouslySetInnerHTML" src/app/chat | grep -vc "sanitizeHtml"` returns `0`.
- AC6: `src/app/invoices/_components/InvoicePreview.tsx` is covered — `grep -n "sanitizeHtml" src/app/invoices/_components/InvoicePreview.tsx` returns at least 1 line.
- AC7: Sanitizing does not break the invoice PDF path: the preview still renders hex colour styles (not `oklch()`), i.e. `grep -c "oklch" src/app/invoices/_components/InvoicePreview.tsx` returns `0`.

### P0 — Remove the iframe same-origin escape and admit `Origin: null` (S4)

As the platform owner, I want the `/m/[slug]` preview iframe to be a real sandbox, so a landing page's
own script cannot reach the parent origin's storage or cookies — while the visitor-side tracker keeps
working from the now-opaque origin.

**Acceptance criteria**

- AC1: `allow-same-origin` is gone from the `/m` tree. `grep -rn "allow-same-origin" src/app/m` returns `0` lines.
- AC2: The sandbox attribute is still present and still grants scripts. `grep -n "allow-scripts" src/app/m/[slug]/page.tsx` returns at least 1 line.
- AC3: `POST /api/m/event` accepts a null origin. `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/m/event -H "Origin: null" -H "content-type: application/json" -d '{"slug":"<test-slug>","type":"view"}'` prints `200` or `204`.
- AC4: `POST /api/m/[slug]/capture` accepts a null origin. The equivalent curl against `http://localhost:4000/api/m/<test-slug>/capture` prints `200` or `204`.
- AC5: The CORS relaxation is scoped to POST. Each of the two routes exports an `OPTIONS` handler whose `Access-Control-Allow-Methods` lists only `POST` and `OPTIONS`. `curl -s -X OPTIONS -H "Origin: null" -D - -o /dev/null http://localhost:4000/api/m/event | grep -i access-control-allow-methods` shows no `GET`, `PUT`, `PATCH` or `DELETE`.
- AC6: The relaxation is not a wildcard credentialed CORS. `curl -s -X OPTIONS -H "Origin: null" -D - -o /dev/null http://localhost:4000/api/m/event | grep -ic "access-control-allow-credentials: true"` returns `0`.
- AC7: No other API route gained CORS headers. `grep -rln "Access-Control-Allow-Origin" src/app/api | wc -l` returns `2`.

### P0 — Dedicated unsubscribe signing secret (S5)

As the platform owner, I want unsubscribe links signed with a purpose-built secret, so the
service-role key is never used as an HMAC key and a leaked link signature cannot be traded against
database access.

**Acceptance criteria**

- AC1: `src/lib/marketing/outreach.ts` reads `UNSUBSCRIBE_SIGNING_SECRET`. `grep -n "UNSUBSCRIBE_SIGNING_SECRET" src/lib/marketing/outreach.ts` returns at least 1 line.
- AC2: The service-role key is no longer referenced anywhere in the signing path. `grep -c "SUPABASE_SERVICE_ROLE_KEY" src/lib/marketing/outreach.ts` returns `0`.
- AC3: The documented fallback is `CRON_SECRET` only. `grep -n "CRON_SECRET" src/lib/marketing/outreach.ts` returns at least 1 line.
- AC4: With neither variable set, signing fails closed — the helper throws or returns an error rather than signing with an empty key (verify by reading the branch; it must not call `createHmac` with `""`).
- AC5: `.env.example` declares the variable. `grep -c "^UNSUBSCRIBE_SIGNING_SECRET=" .env.example` returns `1`.
- AC6: A link signed with the new secret still verifies through the unsubscribe route: `GET /api/m/unsubscribe?...` with a freshly generated signature returns `200`, and the same URL with one character of the signature changed returns `400` or `403`.

### P1 — Throttle every public writer (S6)

As the platform owner, I want an in-process rate limit in front of the unauthenticated write endpoints
plus documented Vercel WAF rules, so a single client cannot flood `mkt_*` tables — without adding a
runtime dependency or an external store.

Decision (already made, 2026-09-15): **in-memory per-instance limiter + Vercel Firewall rules documented
in `architecture.md`. No new dependency.**

**Acceptance criteria**

- AC1: The limiter module exists. `test -f src/lib/rate-limit.ts` exits `0`.
- AC2: It adds no dependency. `git diff --stat -- package.json` shows no added entry under `dependencies` for this story (the only dependency change in this spec is `isomorphic-dompurify` from the S2 story).
- AC3: It is applied to the landing capture route. `grep -n "rate-limit" src/app/api/m/[slug]/capture/route.ts` returns at least 1 line.
- AC4: It is applied to the event route. `grep -n "rate-limit" src/app/api/m/event/route.ts` returns at least 1 line.
- AC5: It is applied to every webhook route. `grep -rln "rate-limit" src/app/api/webhooks | wc -l` equals `ls -d src/app/api/webhooks/*/ | wc -l`.
- AC6: Exceeding the limit returns HTTP `429`. Firing N+1 requests within the window at `/api/m/event` yields at least one `429` (loop `curl -s -o /dev/null -w "%{http_code}\n"` and `grep -c 429` returns ≥ 1).
- AC7: A `429` response carries `Retry-After`. `curl -s -D - -o /dev/null -X POST http://localhost:4000/api/m/event ... | grep -ic "^retry-after:"` returns `1` on the throttled request.
- AC8: The per-instance caveat and the compensating Vercel WAF rules are written down. `grep -n "Vercel Firewall" architecture.md` returns at least 1 line, and that section names the three protected paths.

### P1 — `server-only` guard on the Supabase server factory (S7)

As a developer, I want the build to fail loudly if the service-role Supabase factory is ever imported
from a client component, so the key cannot leak into a browser bundle.

**Acceptance criteria**

- AC1: The guard is the first statement of the module. `head -n 1 src/lib/supabase/server.ts` equals `import "server-only";`.
- AC2: The guard matches the existing convention. `head -n 1 src/lib/supabase/public.ts` and `head -n 1 src/lib/supabase/server.ts` are identical strings.
- AC3: The build still passes with the guard in place — `npm run build` exits `0`.
- AC4: No client component imports the module. `grep -rln "use client" src | xargs grep -ln "lib/supabase/server" | wc -l` returns `0`.

### P1 — HSTS plus observable CSP (S8)

As the platform owner, I want transport pinned and content-security violations *observed* before they
are enforced, so we can move to an enforcing CSP later without breaking TipTap, Recharts or the
landing-page iframe.

**Acceptance criteria**

- AC1: HSTS is sent on an app route. `curl -I http://localhost:4000/projects | grep -i strict-transport-security` returns a line.
- AC2: The HSTS value includes a max-age of at least one year. The matched line contains `max-age=31536000`.
- AC3: The HSTS value includes `includeSubDomains`. The matched line contains `includeSubDomains`.
- AC4: A report-only CSP is sent. `curl -I http://localhost:4000/projects | grep -i content-security-policy-report-only` returns a line.
- AC5: The **enforcing** header is not set yet. `curl -I http://localhost:4000/projects | grep -i "^content-security-policy:"` returns `0` lines.
- AC6: The headers also apply to the public landing tree. `curl -I http://localhost:4000/m/<test-slug> | grep -ci strict-transport-security` returns `1`.
- AC7: The existing headers are preserved, not replaced. `curl -I http://localhost:4000/projects` still shows `x-content-type-options`, `x-frame-options` (or `frame-ancestors` in the CSP) and `referrer-policy`.
- AC8: No page regressed to a blocked-resource failure: with the report-only CSP live, a manual walk of `/projects`, `/chat`, `/ideas-refiner` and `/m/<test-slug>` produces zero **enforced** blocks (report-only cannot block by definition — confirm the browser console shows `[Report Only]` prefixes only).

### P2 — Collect CSP violation reports (optional, weight 0)

As the platform owner, I would like report-only violations to land somewhere I can read, so the
enforcing CSP can be authored from real data instead of guesswork. Absence is **not** a defect.

**Acceptance criteria**

- AC1: The report-only header names a report target. `curl -I http://localhost:4000/projects | grep -i content-security-policy-report-only` contains `report-uri` or `report-to`.
- AC2: The target responds. `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/csp-report -H "content-type: application/csp-report" -d '{}'` prints `204`.
- AC3: The endpoint is rate-limited like the other public writers. `grep -n "rate-limit" src/app/api/csp-report/route.ts` returns at least 1 line.

## Out of scope

- Enforcing (non-report-only) CSP, and any nonce/hash pipeline for inline scripts. Deferred until
  report-only data exists.
- Migrating away from Supabase Auth, or to any other auth provider (Clerk, Better Auth). The requested
  auth skills are applied as **principles only**.
- Migrating hosting off Vercel (no Cloudflare Workers / Pages move).
- Any distributed rate-limit store (`@upstash/ratelimit`, Redis) or other new runtime dependency beyond
  `isomorphic-dompurify`.
- RLS policy rewrites — 85/85 live tables already have RLS and the three-tier model is compliant.
- `SECURITY DEFINER` `search_path` changes — all 32 functions already pin it.
- Server-action authorization gates, mass-assignment allow-lists, `vercel.json` crons and `.env.example`
  reconciliation beyond the three variables named above → `.specs/features/server-action-guards/spec.md`.
- Middleware / auth round-trip reduction → `.specs/features/auth-roundtrips/spec.md`.
- Applying anything to **production** Supabase, pushing, or deploying.

## Files touched

| File | Change |
|---|---|
| `package.json` | add `isomorphic-dompurify` to `dependencies` |
| `src/lib/sanitize.ts` | swap DOMPurify for `isomorphic-dompurify`; drop the server no-op branch; extend tag/attr allow-list for TipTap (`table`, `mark`, constrained `style`) |
| `src/app/api/webhooks/brevo/route.ts` | `BREVO_WEBHOOK_SECRET` check via `secretEquals`, fail closed before any DB call |
| `src/app/m/[slug]/page.tsx` | remove `allow-same-origin` from the iframe sandbox |
| `src/app/api/m/event/route.ts` | explicit POST/OPTIONS CORS for `Origin: null`; rate limit |
| `src/app/api/m/[slug]/capture/route.ts` | same |
| `src/app/api/webhooks/*/route.ts` | rate limit |
| `src/lib/marketing/outreach.ts` | `UNSUBSCRIBE_SIGNING_SECRET` (fallback `CRON_SECRET`), fail closed |
| `src/lib/rate-limit.ts` | **new** — in-memory per-instance sliding-window limiter |
| `src/lib/supabase/server.ts` | add `import "server-only";` |
| `next.config.ts` | add `Strict-Transport-Security` and `Content-Security-Policy-Report-Only` |
| `.env.example` | add `BREVO_WEBHOOK_SECRET`, `UNSUBSCRIBE_SIGNING_SECRET` |
| `architecture.md` | document the Vercel Firewall rate-limit rules and the per-instance caveat |
| ~22 component files | route `dangerouslySetInnerHTML` values through `sanitizeHtml` |

## Verification

Gate (must pass, per `.specs/codebase/TESTING.md` — there is no test runner):

```bash
npm run build && npm run lint && npx tsc --noEmit
```

Per-spec checks:

```bash
# S3 — zero unsanitized sinks
grep -rn "dangerouslySetInnerHTML" src | grep -v "sanitizeHtml" | grep -v "ThemeScript"

# S4 — sandbox escape gone
grep -rn "allow-same-origin" src/app/m

# S5 — service-role key no longer an HMAC key
grep -c "SUPABASE_SERVICE_ROLE_KEY" src/lib/marketing/outreach.ts

# S7 — server-only guard
head -n 1 src/lib/supabase/server.ts

# S8 — headers
curl -I http://localhost:4000/projects | grep -i strict-transport-security
curl -I http://localhost:4000/projects | grep -i content-security-policy-report-only

# S1 / S6 — auth + throttle
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/webhooks/brevo -d '{}'
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/m/event -H "Origin: null" -H "content-type: application/json" -d '{"slug":"x","type":"view"}'; done | sort | uniq -c
```

Manual walk (no automated E2E exists): `/signin`, `/projects`, `/chat`, `/ideas-refiner`, `/settings`,
`/m/<test-slug>` — confirm rich text still renders, the landing tracker still records a view, and the
browser console shows only `[Report Only]` CSP messages.

## Boundaries

**Always**

- Fail closed on a missing secret; never sign or accept with an empty key.
- Compare secrets with the constant-time helper (`secretEquals` / `timingSafeEqual`), never `===`.
- Keep the `{ error?: string }` server-action return convention; never throw across a boundary.
- Keep `import "server-only"` on any module that can construct a service-role client.
- Update `.env.example` in the same change as any new environment variable.
- Add a `docs/changelog.md` entry at the end of the session.

**Ask first**

- Adding any dependency beyond the approved `isomorphic-dompurify`.
- Tightening the report-only CSP into an enforcing CSP.
- Changing the shape of the `/api/m/*` request or response payloads (the tracker script is deployed).
- Touching RLS policies or `SECURITY DEFINER` functions.
- Editing `next.config.ts` beyond the headers block.

**Never**

- `git commit`.
- `git push`.
- Apply a migration to **production** Supabase.
- Deploy to Vercel.

## Open questions

1. `BREVO_WEBHOOK_SECRET` transport: Brevo's webhook UI supports a custom header and a query string.
   Query token (matching the Cal.com/Tally routes) is **ASSUMED**; confirm the header form is not
   required by the Brevo plan in use.
2. HSTS `preload`: omitted deliberately (irreversible for the apex domain). Confirm before adding.
3. The report-only CSP baseline must allow the TipTap/Recharts inline-style usage. The exact
   `style-src` value is **ASSUMED** as `'self' 'unsafe-inline'` until report data says otherwise.
4. Rate-limit thresholds (requests per window per IP) are **ASSUMED** and need a number from the
   owner: proposal 30 req / 60 s per IP for `/api/m/*`, 120 req / 60 s for `/api/webhooks/*`.
5. `/m/[slug]` iframe: confirm no landing template relies on `window.localStorage` (which dies with
   `allow-same-origin` removed) before the change ships.

---

## Audit corrections (2026-09-15, post-freeze)

- **Wrong module path in A7-AC2.** It compares against `src/lib/supabase/public.ts`, which does not
  exist. The real module is `src/lib/marketing/public.ts`. The AC is unscorable as written.
- **B4-AC13's placeholder regex is broken.** It excludes `your_` but `.env.example` uses `your-`,
  and `BREVO_FROM_NAME=Move37` is a legitimate literal value, so the check fails even against a
  correctly sanitized file.
- **A2-AC7 is non-discriminating**: a no-op sanitizer trivially preserves an `<h2>` count, so that
  criterion passed even before the sanitizer was fixed.
- **HSTS `preload` was deliberately omitted** (this spec's open question #2 asked for exactly that
  confirmation). Entering the browser preload list is slow to reverse and binds the apex domain, so
  it is an explicit opt-in rather than a default. Implemented value:
  `max-age=63072000; includeSubDomains`.
- **One item beyond the original scope** was implemented here: UTM attribution for the `/m` tracker
  is now resolved server-side from the request query string and injected into the sandboxed
  document. Removing `allow-same-origin` made the iframe opaque, which broke the tracker's
  `parent.location.search` read. Injecting the values is both a fix for that regression and
  strictly more reliable than the cross-origin read it replaces.
