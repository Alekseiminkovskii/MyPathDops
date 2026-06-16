# MyPathDops

**Field operations platform for telecom contractors.**  
Guided photo capture, automated closeout packages, real-time job tracking — built for crews that work on towers.

---

## What it does

Telecom field crews lose time and money on documentation: photos get misnamed, closeout packages take hours to assemble, and the office has no visibility into what's happening on site. MyPathDops solves this with a two-layer platform — a web portal for managers and a mobile app for field technicians.

- Field techs follow a guided photo workflow — the app tells you what to shoot next, names the file automatically, and embeds GPS + timestamp
- Managers see job status in real time without calling the crew
- Closeout packages (COP) are assembled and exported to PDF in one click
- Team certifications are tracked with automatic expiry alerts
- Safety forms (JSA) are completed on-site before work begins

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| PDF generation | react-pdf *(planned)* |
| Mobile | Expo / React Native *(planned)* |
| Deployment | Vercel *(planned)* |

---

## Current state (Phase 1 — in progress)

- [x] Jobs list connected to live Supabase database
- [x] Real-time data: add a job in Supabase → appears in the app instantly
- [x] Status badges (Active / Completed / Pending) with color coding
- [x] Create job form (in progress)
- [x] Photo upload with auto-labeling
- [x] Fillable forms / documents
- [x] Closeout Package PDF generation
- [x] User authentication and roles

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/mypathdops.git
cd mypathdops
npm install
```

Create a `src/supabaseClient.ts` file:

```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'your-project-url'
const SUPABASE_KEY = 'your-anon-public-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

Create the `jobs` table in your Supabase project:

```sql
create table jobs (
  id bigint generated always as identity primary key,
  site_name text not null,
  status text not null default 'Active',
  date text
);
```

Run the app:

```bash
npm run dev
```

## Ecosystem

This is the web portal — the back-office layer for managers.

| Repository | Description |
|---|---|
| **MyPathDops** (this) | Web portal — React + TypeScript + AWS Amplify |
| [MyPathDops-Mobile](https://github.com/Alekseiminkovskii/MyPathDops-Mobile) | Field mobile app — React Native + Expo |

Both share the same Supabase backend.

---

## Roadmap

### Phase 1 — Web Portal (current)
Core job management, photo upload, forms, COP PDF generation.

### Phase 2 — Mobile App
React Native field app with guided photo capture, offline mode, JSA completion.

### Phase 3 — Differentiation
AI photo verification, certification management, partner job sharing.

---

## Background

MyPathDops is built as a direct alternative to [Pathwave](https://pathwave.com) — a niche field operations tool used by US telecom contractors. The author spent 5 years in telecom field work and experienced firsthand the pain of lost photos, manual PDF assembly, and zero office visibility.

---

## License

MIT
