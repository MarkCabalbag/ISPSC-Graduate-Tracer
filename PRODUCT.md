# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Graduates of ISPSC Sta. Maria campus** (Ilocos Sur Polytechnic State College), often recent alumni filling in the CHED graduate tracer survey on a phone, sometimes on a slow mobile connection. Public, no account.
- **The MIS office** (one admin account): signs in to read employability by graduation year and program, manage colleges, programs and majors, set each cohort's total number of graduates, delete a response, and export the data for reports.

## Product Purpose

Collect each graduate's employment outcome once (employed or not, job related to the course, sector, location, further studies, self-employment) and turn the answers into the employability figures the college reports to CHED. Success: a graduate finishes the survey in minutes without help, and the MIS office can read and export a cohort's numbers without spreadsheets.

## Positioning

The college's own tracer, built around CHED's tracer questions and the college's real department, program and major list, so the totals map straight onto the report the MIS office already files.

## Operating Context

- Graduates arrive from a link shared by the college (social posts, group chats, email) and answer on a phone.
- The admin works on a desktop in the MIS office, reviewing one graduation year and program at a time and exporting to Excel or CSV for the CHED report.
- The answers are personal data under the Philippine Data Privacy Act of 2012 (RA 10173).

## Capabilities and Constraints

- Frontend: React 19, Vite, Tailwind CSS 4, TanStack Query and Table, Recharts. Backend: Express and Prisma on PostgreSQL. The frontend is deployed on Vercel and the API on Render.
- The backend and its API contract must not change in the current redesign. Consent can be shown and required in the form, but it is not stored with the response (that needs a schema change the user deferred).
- Survey answers stored today: email, full name, year of graduation, year of survey, department, program, major, isEmployed, isJobAligned, isSelfEmployed, isFurtherStudies, typeOfOrganization (government, private institution, entrepreneurial / freelance), currentJobLocated (locally, abroad).
- One answer per email address. One admin account set by environment variables.
- Not collected today: salary, time to first job. Do not show figures for them.

## Brand Commitments

- Name: ISPSC Graduate Tracer. The college's seal (`frontend/src/assets/ispsc.png`) and the Bagong Pilipinas mark are real assets.
- The college's colours are maroon and gold (assumed from the seal and the existing site; confirm with the college).
- The user rejected the earlier stock shadcn look and a first "Campus pride" maroon-and-gold mockup as generic.
- Chosen in the decision round (2026-11-20): **the category standard, executed at full craft** — conventions embraced, no smuggled quirk. Quality bar: **GOV.UK / GOV.PH services** for the graduate survey and **Vercel Dashboard** for the admin. Maroon `#7d1128` is the single accent; Source Sans 3 throughout.

## Evidence on Hand

- Real: the college seal and logos in `frontend/src/assets/`; licensed Wikimedia Commons photographs of Santa Maria, Ilocos Sur (the church and its stairway) found during design.
- Not real: `ispsc_campus_hero.jpg` is a generic campus scene that is not ISPSC; never present it as the college. `bg.jpg` is an aerial with a "Candonian Pride" watermark, likely another campus.
- No real figures, testimonials or response counts. Any numbers in previews are sample data and must be labelled as such.

## Product Principles

1. A graduate finishes in one sitting on a phone; every step earns its place.
2. Privacy is visible: the notice and consent come before any personal question.
3. Numbers the MIS office reads are the numbers it reports: no figure the data does not support.
4. The admin reads one cohort at a time; overview first, detail on demand.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard and screen-reader support throughout, 44px touch targets on the survey, readable on low-end phones and in bright outdoor light, reduced motion respected.
