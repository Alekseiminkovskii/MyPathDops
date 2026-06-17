---
name: run-mypathdops
description: Build, run, and drive MyPathDops (Vite + React 19 + Supabase web portal). Use when asked to start MyPathDops, run its dev server, screenshot its UI, or test a login/job/JSA flow end-to-end.
---

MyPathDops is a Vite + React + TypeScript SPA backed by a live Supabase
project (no local backend to stand up — `.env` already points at the
real Supabase URL/anon key). Drive it with the Playwright driver at
`.claude/skills/run-mypathdops/driver.mjs`, which reads a small
line-oriented script and drives headless Chromium against the Vite
dev server.

All paths below are relative to the repo root (`c:\Users\Aleks\MyPathDops`).

## Prerequisites

```bash
npm install
npx playwright install chromium   # one-time; downloads to ~/.cache (or %LOCALAPPDATA% on Windows)
```

`playwright` is already a devDependency (added for this driver) — `npm install` alone gets the package, but the browser binary needs the explicit `playwright install` the first time on a fresh machine.

## Run dev server

```bash
npm run dev
```

Vite defaults to port 5173 but **auto-increments if that port is busy**
(commonly true if a human already has the app open in an editor/terminal
— check `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173`
before assuming the port). Read the actual `Local: http://localhost:XXXX/`
line Vite prints and use that port in the driver script's `nav` line.
Stop with `Ctrl-C` (foreground) or kill the backgrounded PID.

## Run (agent path)

Write a newline-separated command script, then run the driver against
the dev server's actual port:

```bash
cat > /tmp/script.txt <<'EOF'
nav http://localhost:5173
wait-selector input[type="email"]
fill input[type="email"] YOUR_TEST_EMAIL
fill input[type="password"] YOUR_TEST_PASSWORD
click text Sign in
wait-for text=Jobs
screenshot jobs-list
click text SOME_JOB_NAME
sleep 1500
screenshot job-detail
EOF
node .claude/skills/run-mypathdops/driver.mjs /tmp/script.txt /tmp/shots
```

Screenshots land in `/tmp/shots/NN-<label>.png` (sequential, full-page).
Console errors and `pageerror`s are collected and printed as a summary
line at the end of the run — check it before declaring success.

| command | what it does |
|---|---|
| `nav <url>` | navigate |
| `wait-selector <css>` | wait for a CSS selector to appear |
| `wait-for text=<text>` | wait for visible text (substring match) |
| `click <css>` | click a CSS selector |
| `click text <label>` | click a `button` with that name first, falling back to any element with that text — use this for "Sign in" vs the page's own "Sign in" heading |
| `fill <css> <value>` | fill an input (goes through Playwright's input pipeline, fires React's onChange) |
| `press <key>` | keyboard key press, e.g. `Enter` |
| `sleep <ms>` | fixed wait, use only when there's no element to wait for (e.g. waiting out a network round trip with no DOM marker) |
| `screenshot [label]` | full-page screenshot, saved as `NN-label.png` |

**There is no session persistence between runs.** Each `node driver.mjs`
invocation launches a brand-new Chromium context — no cookies/localStorage
survive from a previous run. Every script that needs an authenticated
page must include the login steps itself; you cannot `nav` straight to
`/jobs` and expect to already be signed in.

## Auth for testing

The app authenticates against a real, live Supabase project — there is
no local/mocked backend. To exercise authenticated pages you need a
confirmed Supabase user:

- Ask the project owner for existing test credentials, **or**
- Sign up a throwaway account through the app's own Sign Up flow, then
  have the owner confirm it (or disable "Confirm email" under Supabase
  Auth → Providers → Email) — a freshly-signed-up, unconfirmed user gets
  "Email not confirmed" on sign-in and cannot proceed.

A confirmed throwaway account (`mypathdops.smoketest2@gmail.com`) exists
in the live project from verifying this skill — reuse it for future
smoke tests if it's still around, but don't rely on it being permanent.

## Run (human path)

```bash
npm run dev
```

Open the printed `localhost` URL in a browser. `Ctrl-C` to stop.

## Test / Lint

```bash
npm run lint    # eslint . — clean as of this writing
```

There is no test suite (`npm test` is not defined in package.json).

## Build

```bash
npm run build    # tsc -b && vite build
```

---

## Gotchas

- **`click text Sign in` is ambiguous** — the login card has both an
  `<h2>Sign in</h2>` heading and a `<button>Sign in</button>`.
  `getByText().first()` picks the heading (DOM order) and silently
  does nothing useful. The driver's `click text <label>` command
  works around this by preferring `getByRole('button', { name })`
  first.
- **New signups land on "Email not confirmed"** until the Supabase
  project confirms them — there's no error in the browser console,
  just a quiet no-op (the form stays on the Create Account screen
  with no visible message) until you actually try to sign in with
  those credentials, which then shows the real error.
- **A fresh test user without a `profiles` row throws 406s** on
  `useRole` (`src/hooks/useRole.ts:15-19` does `.single()` against
  `profiles`, which 406s — Supabase/PostgREST's code for "no rows" on
  `.single()`) — these are benign for an account with no assigned
  role and don't block the Jobs/JobDetail flow.
- **Vite silently moves ports** if 5173 is occupied (common if a
  human already has `npm run dev` running) — always read the actual
  port from the dev-server output rather than hardcoding 5173.

## Troubleshooting

- **`Cannot find package 'playwright'`** when running `driver.mjs`:
  `playwright` wasn't installed — run `npm install` (it's a
  devDependency) and, on a brand-new machine, `npx playwright install
  chromium`.
- **`locator.click: Timeout 30000ms exceeded`** on a `click text <label>`
  step: you're not authenticated (got redirected to `/login`) — the
  script needs its own login steps; sessions don't persist between
  driver runs (see above).
