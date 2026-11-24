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

### Create the admin accounts

Admins live in the `Admin` database table. Generate a session secret and the first admin's password hash:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 12))"   # ADMIN_PASSWORD_HASH
```

Put the random text in `JWT_SECRET`, the hash in `ADMIN_PASSWORD_HASH` (single-quoted) and a name in `ADMIN_USERNAME`. Then, after the migration has run (see [Database](#database)), seed the first admin:

```bash
npm run seed            # creates the admin from ADMIN_USERNAME / ADMIN_PASSWORD_HASH (once; never overwrites)
```

Manage admins afterwards (the environment variables are no longer used):

```bash
npm run admin:list
npm run admin:create -- --username mis.jane --password "a-strong-password" --name "Jane Cruz"
npm run admin:create -- --username mis.jane --hash '$2b$12$...'   # keep the plain password out of shell history
npm run admin:reset  -- --username mis.jane --password "a-new-password"
npm run admin:delete -- --username mis.jane                       # refuses to delete the last admin
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string used by the API |
| `DIRECT_URL` | for migrations | Direct (non-pooled) connection string used by the Prisma CLI |
| `JWT_SECRET` | yes | At least 32 random characters; signs admin sessions |
| `ADMIN_USERNAME` | to seed | First admin's username. Read only by `npm run seed`, not by the server |
| `ADMIN_PASSWORD_HASH` | to seed | bcrypt hash of the first admin's password. Read only by `npm run seed` |
| `CLIENT_URL` | yes in production | Exact frontend origin(s), comma separated, no trailing slash |
| `PORT` | no | Defaults to 7000 |
| `NODE_ENV` | production | Set to `production` so the cookie is HTTPS-only |
| `TRUST_PROXY` | behind a proxy | Set to `1` on Render so rate limits see real client IPs |
| `EMAIL_FROM`, `EMAIL_PASS` | for emails | Gmail address and app password |

The server refuses to start if `DATABASE_URL` or `JWT_SECRET` is missing. The admin credentials are validated by the seed, not at startup, so the server runs without them once admins exist in the table.

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
- Set every backend variable above, with `NODE_ENV=production`, `TRUST_PROXY=2` and `CLIENT_URL` set to the Vercel site URL (https, no trailing slash). `2` because two proxies sit in front of the API: Vercel (the `/api` rewrite), then Render. The server refuses to start in production without `TRUST_PROXY`, an https `CLIENT_URL`, and `?sslmode=require` on a `DATABASE_URL` that is reached over the internet.
- Health Check Path (Render → Settings): `/api/graduateTracer/health`.

### Frontend (Vercel)

- Root directory: `frontend`; framework preset Vite (build `npm run build`, output `dist`).
- `frontend/vercel.json` forwards `/api/*` to the Render backend and sends every other path to `index.html` (single-page app routing). It also sets security headers including a Content-Security-Policy. If you move the backend to another domain, update the `destination` in the rewrite **and** `connect-src` in the CSP.
- Set `VITE_API_URL=/api/graduateTracer` so the browser only talks to the Vercel domain. The admin session cookie is `SameSite=Strict`; calling the Render domain directly would make it cross-site and break admin sign-in.
- Redeploy after changing environment variables (they are baked in at build time).

## Operations

### Uptime and keep-alive

A free Render web service spins down after 15 minutes without traffic, and the next request then waits 30–60 seconds. An external monitor (UptimeRobot) calls the API every 5 minutes to prevent that and to alert when the API is down.

- Account: `<MIS office email>` (login in the team's password manager). **Fill this in when the monitors are created.**
- Monitor 1, `https://ispsc-graduate-tracer.onrender.com/api/graduateTracer/health`: keeps the service awake and alerts if the API is down. Answers `200 {"status":"ok"}` without touching the database.
- Monitor 2, `…/api/graduateTracer/health/ready`: alerts if the database is unreachable (`503` otherwise).
- Both: GET, every 5 minutes, 60-second timeout (a cold start is slow), alert after 2 failed checks. Ping the Render URL directly, not the Vercel one.
- Health requests skip the rate limiter and the request log, so they never use up a visitor's quota or fill the logs.
- Free Render instances share 750 free hours a month across the workspace; one always-awake service uses about 744. Do not keep a second free service awake in the same workspace.
- If the Render URL changes, update both monitors and `frontend/vercel.json`. On a paid Render instance the service never sleeps, so the keep-alive is no longer needed; keep the monitors for alerting.

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
