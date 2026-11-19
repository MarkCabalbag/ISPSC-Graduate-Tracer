# Improvements on the `development` branch

This document describes what changed in each phase, what was deliberately left alone, what to do next, and what you must do manually. Nothing was committed to `main`.

## What changed

### Phase 1: Security and privacy

- Stopped logging graduates' email addresses in server and email error logs.
- Backend dependencies: upgraded `nodemailer` (4 advisories) and applied `npm audit fix`; backend now reports **0 vulnerabilities**. Removed unused dependencies (`emailjs`, `express-openid-connect`, `uid`, `@prisma/orm-postgres`) and the dead `prisma/db.ts`.
- The server now fails at startup with a clear message when a required environment variable is missing or `ADMIN_PASSWORD_HASH` is not a bcrypt hash (`lib/env.ts`).
- Admin and auth responses are sent with `Cache-Control: no-store`; removed the unused URL-encoded body parser.
- Completed `backend/.env.example` and added `frontend/.env.example`.
- Fixed admin **Logout**: it cleared a stale `localStorage` flag and never ended the server session. It now calls the real logout endpoint.
- Added security headers to `frontend/vercel.json` (CSP, HSTS, frame-ancestors, nosniff, referrer and permissions policies).
- Reviewed and found already sound: bcrypt hashing, signed 8-hour JWT in an HttpOnly `SameSite=Strict` cookie, role check, CSRF header, CORS allow-list, helmet, rate limits (login, survey, general), body size limit, per-controller input validation, generic error responses.

### Phase 2: Correctness and code quality

- Frontend ESLint: 9 errors and 5 warnings reduced to 0 errors and 2 (shadcn fast-refresh) warnings. Removed explicit `any`, five unused types, and fixed hook dependencies.
- The code imported `framer-motion`, which was never declared; it now imports the declared `motion` package.
- Removed a `console.log` that printed every graduate's details into the browser console.
- Backend: shared `parseIdParam` and `sendServerError` helpers replace per-controller copies, so all controllers handle unexpected errors identically.
- Added ESLint to the backend and Prettier config and scripts to both packages.
- The survey form validates required answers before submitting and lists what is missing; the dashboard shows an error state with a retry button.

### Phase 3: Features (additive only)

- `GET /admin/analytics`: employment rate, job-relevance rate, graduates by year and program, sector and location, counted in the database. New dashboard Analytics section with stat tiles, charts, loading, error and empty states.
- `GET /admin/responses/export`: CSV export with optional year, program and department filters and protection against spreadsheet formula injection. "Export all responses (CSV)" button on the dashboard.
- Audit log (interim): JSON log lines (`"event":"audit"`) for admin write actions and sign-in attempts, with no request bodies or personal data.

### Phase 4: UI, UX, accessibility, performance

- **Bug fix:** the survey saved "entreprenueral / freelance" (misspelled) while the dashboard counted "entrepreneurial / freelance", so those graduates were never counted. The form value is fixed and the backend counts both spellings, so older rows are included without a migration.
- **Bug fix:** radio groups reused ids ("yes", "no"), so a label could select a radio in a different question. Every group now has unique ids and is labelled by its question.
- Form labels linked to inputs; unlabeled selects named; skip link and `<main>` landmarks; `aria-label` on icon-only buttons.
- Initial JavaScript reduced from 1,390 kB to 523 kB by lazy-loading routes; the Excel library (430 kB) loads only on export. Charts and their data are memoized.

### Phase 5: Tests, CI, documentation

- Backend: split `app.ts` from `server.ts`; **75 tests** (Vitest + Supertest, Prisma mocked) for login, cookies, CSRF, token tampering/expiry/role, rate limiting, protection of every admin route, survey validation and error leakage, CSV escaping, CORS and security headers, and environment checks.
- Frontend: **11 tests** (Vitest + Testing Library) for the API client, login page, survey submit validation and radio-group ids.
- GitHub Actions workflow (`.github/workflows/ci.yml`): install, lint, type-check, test, build for both packages on every pull request.
- Root `README.md` (setup, environment variables, deployment, contributing, screenshots placeholder), MIT `LICENSE`, root `.gitignore`.

## Deliberately left alone

| Item | Why |
| --- | --- |
| Database schema (nullable columns, string answers instead of enums, indexes, unique email, consent columns) | Needs a migration; you chose to skip it for now. |
| Salary, time-to-employment charts | The survey does not collect this data; needs new questions and columns. |
| Database audit table, graduate self-update links | Need new tables and a public token endpoint (API contract change). |
| API field names with typos (`untTracedPercentage`, `OverviewRowGaduates`) | Renaming breaks the existing contract. |
| Services/models layering in the backend | Large diff with no behavior change; controllers are already consistent. |
| Repo-wide Prettier reformat | Would bury real changes; run `npm run format` in its own commit. |
| `xlsx` 0.18.5 (high advisories, no npm fix) | Only used to write files, not parse uploads, so practical risk is low. Replace with `exceljs` or SheetJS's official tarball if you want it gone. |
| Dev-only audit findings in the frontend lint tooling | Not shipped to users; need a major upgrade of `typescript-eslint`. |
| Image compression | No image tool available here. |
| `backend/prisma-8.md`, stray root `tsconfig.json`, `App.tsx` | Harmless leftovers. |

## Remaining recommendations, by priority

1. **Record consent (RA 10173).** Add `consentGivenAt` / `consentVersion` columns and a required consent checkbox; add a unique index on `Responses.email` (the duplicate check is currently racy). SQL was proposed in the conversation.
2. **Define the migration baseline.** The untracked `backend/prisma/migrations/…_init` must be reconciled with the live database before anyone runs `migrate deploy`.
3. **Data retention and deletion process** for alumni data, and a policy for who may export it.
4. **Persistent audit trail** in the database, and **rate limiting backed by a shared store** if you ever run more than one backend instance.
5. **Data model:** enums for answers, required columns, indexes on `(yearOfGraduation, program)`, a unique `(yearOfGraduation, program)` on `Total`.
6. **Graduate self-update** via emailed one-time links; salary and time-to-employment questions.
7. **Server-side pagination** of the respondent list if responses grow past a few thousand.
8. Compress the three large images (about 2.2 MB) to WebP; run a color-contrast audit.
9. Replace `xlsx`; upgrade `typescript-eslint`.

## What you need to do manually

- **Rotate secrets:** none were found in the repository or its history, so nothing is required from this review. If your local `backend/.env` was ever shared, rotate `JWT_SECRET`, `ADMIN_PASSWORD_HASH` and the Gmail app password.
- **Render environment variables:** `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `CLIENT_URL`, `EMAIL_FROM`, `EMAIL_PASS`, `NODE_ENV=production`, `TRUST_PROXY=1`. The server now refuses to start if a required one is missing.
- **Vercel:** set `VITE_API_URL=/api/graduateTracer` so the admin cookie stays same-site, redeploy, and confirm the new Content-Security-Policy does not block fonts or API calls. Keep `connect-src` and the rewrite destination in sync if the backend URL changes.
- **Local development:** set `PORT=8080` in `backend/.env` (the frontend's dev default points at 8080; the server default is 7000).
- **Migrations:** run none until you have decided how the baseline relates to the live database (see recommendation 2).
- **Test with real data once:** the analytics, CSV export, charts and the nodemailer upgrade were verified against mocks only. Open the dashboard, export a CSV, and submit one survey after deploying.
- **License:** MIT was chosen with the holder "ISPSC Graduate Tracer contributors". Change it in `LICENSE` if the college requires another license or a named holder.
- **Enable CI:** push the branch and open a pull request; the workflow runs automatically. Consider requiring it for merges to `main`.
