# Badge Scan

**Live demo:** [badge-scan.vercel.app](https://badge-scan.vercel.app)

A small SaaS for event check-in. Sign in, create events, upload a CSV of attendees with a column-mapping step, and validate barcodes at the door with an external scanner.

## Tech

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase: auth + Postgres + Row-Level Security
- Papa Parse for CSV parsing in the browser

## Setup (5 min)

### 1. Create a Supabase project

1. Go to https://supabase.com → New project (free tier is fine).
2. Wait for it to provision.
3. **Project Settings → API**: copy your **Project URL** and **anon public** key.

### 2. Add env vars

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste in the URL + anon key.

### 3. Run the SQL schema

In the Supabase dashboard → **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the `events` and `attendees` tables with Row-Level Security so each user only sees their own data.

### 4. Disable email confirmation (optional, for local dev)

Supabase dashboard → **Authentication → Providers → Email** → toggle **Confirm email** off so you can sign in immediately after sign-up. Re-enable for production.

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Usage

1. **Sign up** at `/login`.
2. **Create an event** from the events list.
3. **Upload a CSV** — drag a file onto the upload card or click to pick one.
   - You'll see a column-mapping step: map your CSV columns (e.g. `Voornaam`, `Achternaam`, `E-mail`, `Ticket Code`) to **First name / Last name / Email / Barcode**.
   - Common header names are guessed automatically.
   - Only **Barcode** is required.
   - Re-uploading skips barcodes already imported (no duplicates).
4. **Open the scanner** from the event page. The input is always focused; an external USB scanner that emits `<barcode>\n` will work out of the box.
   - **Green** = valid, marked as checked-in.
   - **Amber** = already checked in (with the previous time).
   - **Red** = invalid (not in the list).

## Project layout

```
src/
  app/
    login/                  ← sign in / sign up
    (app)/                  ← authenticated shell
      events/               ← list + create
        [id]/
          page.tsx          ← event detail (stats, attendees, CSV upload)
          scan/             ← full-screen scanner
  lib/
    supabase/               ← server / browser / middleware clients
  components/ui/            ← Button, Input, Label, Card, Select
supabase/
  schema.sql                ← run once in Supabase SQL editor
```

## Notes

- Row-Level Security on `events.owner_id = auth.uid()` means a user simply cannot see another user's events or attendees, even through the API.
- The `(event_id, barcode)` unique index makes re-uploads idempotent and the scanner lookup an index hit.
