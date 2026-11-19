# ISPSC Graduate Tracer

A web application for the Ilocos Sur Polytechnic State College (ISPSC) Sta. Maria Campus that collects graduate tracer survey responses and gives the MIS office an admin dashboard to analyze them.

Live site: <https://ispsc-graduate-tracer.vercel.app>

> **Privacy.** The app stores personal data about alumni (names, emails, employment). Treat the database, exports and logs as sensitive under the Philippine Data Privacy Act of 2012 (RA 10173). See [Data privacy](#data-privacy).

## Features

**Graduates**
- Graduate tracer survey form with required-field validation and a data privacy notice.
- Confirmation email after submitting.
- One response per email address.

**Admin (MIS office)**
- Secure sign-in (HttpOnly session cookie, rate-limited).
- Overall employability table by graduation year and program, with search, sort, pagination and Excel export.
- Analytics dashboard: employment rate, job relevance, graduates by year and program, sector and location charts.
- Per-year and program view: charts, traced percentage, list of respondents, delete a response, set total graduates.
- CSV export of responses (with spreadsheet-formula protection).
- Manage departments, programs and majors.
- Log of admin actions (see [Audit log](#audit-log)).

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/Radix UI, TanStack Query and Table, Zustand, Recharts |
| Backend | Node.js (ESM), Express 4, TypeScript, Prisma 7 with PostgreSQL, JWT + bcrypt, helmet, express-rate-limit, Nodemailer |
| Tests | Vitest, Supertest (backend), Testing Library (frontend) |
| Hosting | Frontend on Vercel, backend on Render, PostgreSQL |

## Folder structure

```
.
├── backend/
│   ├── app.ts              Express app (middleware + routes)
│   ├── server.ts           Starts the app on PORT
│   ├── controllers/        Request handlers
│   ├── routes/             Route definitions
│   ├── middleware/         Auth, rate limits, audit log, no-store
│   ├── lib/                Prisma client, environment check
│   ├── utils/              Email, CSV, validation, error helpers
│   ├── prisma/             schema.prisma (+ migrations)
│   └── tests/              Vitest + Supertest tests
├── frontend/
│   ├── src/
│   │   ├── admin/          Login, dashboard, auth provider
│   │   ├── api/            HTTP client and endpoint functions
│   │   ├── components/     Pages, charts, tables, form sections, UI kit
│   │   ├── context/        React Query hooks, Zustand store
│   │   └── types/          Shared TypeScript types
│   └── vercel.json         Rewrites and security headers
└── .github/workflows/      CI
```

## Prerequisites

- Node.js 22 or newer and npm
- PostgreSQL 15 or newer
- A Gmail account with an [app password](https://support.google.com/accounts/answer/185833) for the confirmation emails (optional locally; emails are skipped when not configured)

## Setup

```bash
git clone <repo-url>
cd ISPSC-Graduate-Tracer

# Backend
cd backend
npm install
cp .env.example .env        # then fill in the values (see below)
npx prisma migrate deploy   # or: npx prisma db push  (see "Database")
npm run dev                 # http://localhost:8080 when PORT=8080

# Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend calls `http://localhost:8080/api/graduateTracer` in development, so set `PORT=8080` in `backend/.env`.

### Create the admin account

There is a single admin, configured through environment variables. Generate the password hash and a session secret:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 12))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put the hash in `ADMIN_PASSWORD_HASH` (wrap it in single quotes) and the random text in `JWT_SECRET`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string used by the API |
| `DIRECT_URL` | for migrations | Direct (non-pooled) connection string used by the Prisma CLI |
| `JWT_SECRET` | yes | At least 32 random characters; signs admin sessions |
| `ADMIN_USERNAME` | yes | Admin username |
| `ADMIN_PASSWORD_HASH` | yes | bcrypt hash of the admin password (never the password) |
| `CLIENT_URL` | yes in production | Exact frontend origin(s), comma separated, no trailing slash |
| `PORT` | no | Defaults to 7000 |
| `NODE_ENV` | production | Set to `production` so the cookie is HTTPS-only |
| `TRUST_PROXY` | behind a proxy | Set to `1` on Render so rate limits see real client IPs |
| `EMAIL_FROM`, `EMAIL_PASS` | for emails | Gmail address and app password |

The server refuses to start if a required variable is missing or `ADMIN_PASSWORD_HASH` is not a bcrypt hash.

### Frontend (`frontend/.env.local`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL. On Vercel set it to `/api/graduateTracer` (see Deployment) |

## Scripts

| Where | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` | Start with auto-reload |
| backend | `npm run build` / `npm start` | Compile to `dist/` and run |
| backend | `npm run lint`, `npm run typecheck`, `npm test` | Quality checks |
| frontend | `npm run dev` / `npm run build` | Dev server / production build |
| frontend | `npm run lint`, `npm run typecheck`, `npm test` | Quality checks |
| both | `npm run format` | Format with Prettier |

## Database

The schema is in `backend/prisma/schema.prisma`. Apply it to an empty database with `npx prisma migrate deploy` (uses `prisma/migrations`) from the `backend` folder. **Do not run this against an existing production database** until you have confirmed the migration history matches it; for a database that already has these tables, mark the baseline as applied with `npx prisma migrate resolve --applied <migration-name>` first.

## Deployment

### Backend (Render)

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set every backend variable above, with `NODE_ENV=production`, `TRUST_PROXY=1` and `CLIENT_URL` set to the Vercel site URL.

### Frontend (Vercel)

- Root directory: `frontend`; framework preset Vite (build `npm run build`, output `dist`).
- `frontend/vercel.json` forwards `/api/*` to the Render backend and sends every other path to `index.html` (single-page app routing). It also sets security headers including a Content-Security-Policy. If you move the backend to another domain, update the `destination` in the rewrite **and** `connect-src` in the CSP.
- Set `VITE_API_URL=/api/graduateTracer` so the browser only talks to the Vercel domain. The admin session cookie is `SameSite=Strict`; calling the Render domain directly would make it cross-site and break admin sign-in.
- Redeploy after changing environment variables (they are baked in at build time).

## Security notes

- Admin routes and all data-changing routes require a valid session; data-changing requests must also send `X-Requested-With: XMLHttpRequest` (CSRF protection together with `SameSite=Strict` and an explicit CORS allow-list).
- Sign-in is limited to 5 failed attempts per 15 minutes per IP; survey submission is rate limited too. Counters are in memory, so they reset on restart and are per instance.
- Responses never include stack traces or database details.
- Admin and auth responses are sent with `Cache-Control: no-store`.

### Audit log

Admin write actions and sign-in attempts are written to the server log as JSON lines (`"event":"audit"`) with the actor, method, path, status, time and IP, and never request bodies. They are kept in your host's log stream (for example Render logs), not in the database.

### Data privacy

- Collect only what the survey needs, and tell graduates why (the survey form shows a privacy notice).
- Restrict database and export access to authorized MIS staff; delete exports after use.
- Honor requests from graduates to access, correct or delete their record (an admin can delete a response from the dashboard).

## Screenshots

_Add screenshots here: home page, survey form, admin dashboard, cohort page._

## Contributing

1. Create a branch from `main` (never commit to `main` directly).
2. Make small, focused commits, one concern each.
3. Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` in `backend` and `frontend`. The same checks run in GitHub Actions on every pull request.
4. Never commit secrets. Add new settings to the relevant `.env.example` file with a placeholder value.
5. Open a pull request describing what changed and why.

## License

[MIT](LICENSE)
