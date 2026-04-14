# FreeWhen — Design Spec

**Date:** 2026-04-14
**Status:** Draft (pending user approval)

## Overview

FreeWhen is a cute, login-free clone of [when2meet.com](https://www.when2meet.com/) with day-granularity scheduling. A user creates an event by picking a date range, naming it, and choosing a theme. FreeWhen returns a shareable URL. Anyone with that URL can enter their name, toggle the days they're free, and submit. Everyone sees a heatmap showing which days have the most overlap.

**Primary goal:** make deciding on a day feel delightful, not like filling out a form.

**Working name:** FreeWhen. Hosted at `freewhen.mvp.sg`.

## Scope

**In scope (v1):**
- Create event with title, date range (max 90 days), and theme
- Shareable URL with a cute themed slug
- Anyone with URL can submit availability; no login, no accounts
- Name-based identity (re-typing the same name overwrites the previous submission)
- Day-only granularity (no time-of-day)
- Heatmap visualization showing combined group availability
- "Best days so far" leaderboard
- Four themes: Eating, Hiking, Shopping, Games
- Responsive layout (mobile / tablet / desktop)
- QR code on share screen

**Out of scope (v1, deferred):**
- Time-of-day deconflicting (planned for v2 — schema already accommodates it)
- Authentication, accounts, password-protected edits
- Event deletion or editing by the creator after creation
- Email / SMS notifications
- Timezone handling (dates are treated as local ISO calendar dates; good enough for day-level coordination)
- Custom themes / user-uploaded assets
- Multi-language support

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Browser (React SPA, freewhen.mvp.sg)                │
│  - Static bundle served from Cloudflare Pages        │
└───────────────┬──────────────────────────────────────┘
                │  fetch /api/*
┌───────────────▼──────────────────────────────────────┐
│  Cloudflare Worker (bound to Pages Functions)        │
│  - REST endpoints for events + submissions           │
│  - Slug generation with collision retry              │
└───────────────┬──────────────────────────────────────┘
                │  SQL
┌───────────────▼──────────────────────────────────────┐
│  Cloudflare D1 (SQLite at the edge)                  │
└──────────────────────────────────────────────────────┘
```

**Why this stack:** single vendor (Cloudflare), one deploy, one DNS record. Free tier covers real-world traffic (D1: 5M reads/day, Workers: 100K req/day). No separate backend host, no CORS.

### Frontend

- **Framework:** React 18 + TypeScript
- **Bundler:** Vite
- **Styling:** TailwindCSS (with custom theme tokens per vibe)
- **Animation:** Framer Motion
- **Calendar primitive:** `react-day-picker` (headless, fully skinnable)
- **QR code:** `qrcode` npm package (client-side generation)
- **Fonts:** Fredoka via Google Fonts (rounded, playful)

### Backend

- **Runtime:** Cloudflare Workers (via Pages Functions — `functions/api/*`)
- **Database:** Cloudflare D1 (bound via wrangler config)
- **No ORM:** raw prepared SQL via the D1 binding (simple schema, ~4 queries total)

## Data Model

```sql
CREATE TABLE events (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  theme       TEXT NOT NULL CHECK (theme IN ('eating','hiking','shopping','games')),
  start_date  TEXT NOT NULL,                -- ISO 'YYYY-MM-DD'
  end_date    TEXT NOT NULL,                -- ISO 'YYYY-MM-DD'
  created_at  INTEGER NOT NULL              -- unix seconds
);

CREATE TABLE submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_slug  TEXT NOT NULL REFERENCES events(slug) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (event_slug, name)                 -- name = identity; re-submit overwrites
);

CREATE TABLE availability (
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,              -- ISO 'YYYY-MM-DD'
  PRIMARY KEY (submission_id, date)
);

CREATE INDEX idx_submissions_event ON submissions(event_slug);
CREATE INDEX idx_availability_submission ON availability(submission_id);
```

### Notes on the schema
- `name` + `event_slug` is the unique identity for a participant. Re-submitting under the same name overwrites their dates.
- Dates stored as ISO calendar strings (no timestamps, no timezones at rest).
- Cascade deletes so removing an event cleans up submissions and availability.
- `time_slots` table can be added later for time-of-day deconflicting without touching v1 tables.

## API

All endpoints are JSON. Served under `/api/*`.

### `POST /api/events`
Create a new event.

Request body:
```json
{
  "title": "Sarah's Birthday Brunch",
  "theme": "eating",
  "startDate": "2026-04-20",
  "endDate": "2026-05-04"
}
```

Response (201):
```json
{
  "slug": "plump-dumpling-42",
  "title": "Sarah's Birthday Brunch",
  "theme": "eating",
  "startDate": "2026-04-20",
  "endDate": "2026-05-04",
  "createdAt": 1776137783
}
```

Validation:
- `title` required, 1–120 chars, trimmed
- `theme` required, one of the four enum values
- `startDate` / `endDate` required, valid ISO dates, `end >= start`
- Range must be ≤ 90 days
- Slug generated server-side with up to 5 collision retries

### `GET /api/events/:slug`
Fetch event + all submissions with their days.

Response (200):
```json
{
  "event": {
    "slug": "plump-dumpling-42",
    "title": "Sarah's Birthday Brunch",
    "theme": "eating",
    "startDate": "2026-04-20",
    "endDate": "2026-05-04"
  },
  "submissions": [
    { "name": "Sarah", "dates": ["2026-04-20", "2026-04-24", "2026-04-30"], "updatedAt": 1776137900 },
    { "name": "Maya",  "dates": ["2026-04-24", "2026-04-29"], "updatedAt": 1776138000 }
  ]
}
```

404 if slug not found.

### `PUT /api/events/:slug/submissions`
Upsert a participant's availability.

Request body:
```json
{
  "name": "Stephen",
  "dates": ["2026-04-20", "2026-04-24", "2026-04-29", "2026-04-30"]
}
```

Behavior:
- If `(slug, name)` exists, delete old `availability` rows and insert new ones atomically; update `updated_at`
- Else, insert new submission + availability rows
- Validates: `name` 1–40 chars trimmed, dates within event range, no duplicates
- Returns 200 with the canonical record

### Rehydration (no endpoint)
When a returning user types their name, the client looks it up in the already-fetched `GET /api/events/:slug` submissions array and prefills the calendar from `submission.dates`. No extra endpoint needed; payload is small enough that one fetch covers everything.

## User Flows

### Creator flow
1. Land on `freewhen.mvp.sg` → home page with theme picker + title input + calendar
2. Pick theme, type title, drag-select date range
3. Click **Create Event** → `POST /api/events` → redirected to `/:slug` with the share screen state (`?just-created=1`)
4. Share screen shows title, URL, copy button, QR code, "Continue to event →"
5. Creator can immediately fill in their own availability — they're simply the first participant on the event page

### Participant flow
1. Opens `freewhen.mvp.sg/:slug`
2. Client fetches `GET /api/events/:slug` → renders the themed calendar with the group heatmap pre-loaded
3. User types name into the top input
4. User clicks day cells to toggle their own selection (local state only, with visible dot indicator)
5. Click **Submit** → `PUT /api/events/:slug/submissions` → confetti animation → re-fetch updates the heatmap and "Best days" panel
6. Returning later with the same name: as they type, if the name matches an existing submission, their prior dates visibly "rehydrate" onto the calendar

### Creator === participant
There is no separate "creator" role. The share screen is a one-time overlay on the event page; after dismissing, the creator sees the same UI as any other participant.

## Theme System

Four themes chosen at event creation. Each theme is a configuration object in `src/themes/`:

```ts
type ThemeId = 'eating' | 'hiking' | 'shopping' | 'games';

type Theme = {
  id: ThemeId;
  label: string;            // "Eating"
  emoji: string;            // "🍽"
  tagline: string;          // "yum"
  palette: {
    bg1: string; bg2: string;
    surface: string;
    primary: string;        // button gradient start
    primaryDark: string;    // button gradient end / shadow
    accent: string;         // "mine" indicator dot
    ink: string;            // primary text
    soft: string;           // card borders, soft accents
    heat: [string, string, string, string, string]; // 5-stop heatmap ramp
  };
  drifters: string[];       // 3–5 emojis that drift in the background
  buttonEmoji: string;      // appended to "Submit" button
  slugWords: {
    adjectives: string[];   // 30–50 per theme
    nouns: string[];        // 30–50 per theme
  };
};
```

Themes register in a map `themes[id]`. The app root reads `event.theme` and applies CSS custom properties to a container div, plus conditionally renders the drifters and button emoji.

### Theme manifests (v1)

| Theme | Palette cue | Drifters (sample) | Example slug |
|---|---|---|---|
| Eating | cream/blush/butter | 🥐 🧁 ☕ 🍓 🍣 🍰 🍜 | `plump-dumpling-42` |
| Hiking | moss/pine/sky | 🌲 ⛰ ☀️ 🌿 🥾 🍂 | `cozy-mountain-37` |
| Shopping | lavender/pink/cream | 👜 👗 👠 💄 🛍 | `glossy-handbag-21` |
| Games | purple/cyan/pink | 🎮 🕹 🎲 🪄 👾 🧩 | `pixel-dragon-88` |

Slug wordlists live only in the Worker (`functions/api/_lib/wordlists/<theme>.ts`) — the frontend never needs them because slugs are always generated server-side. Theme visual config (palette, drifters, button emoji) lives in `src/themes/<theme>.ts` on the frontend.

## Slug generation

```
slug = `${adjective}-${noun}-${number(10..99)}`
```

- Adjective + noun selected uniformly at random from the theme's word pool (~30–50 each per theme)
- Number suffix adds `~90×` capacity per adjective/noun pair
- On insert, if UNIQUE constraint on `slug` trips, retry up to 5 times with a fresh combo
- After 5 retries, return 500 — collision rate at our expected scale is vanishingly small; if it ever happens in practice we expand wordlists

Target namespace per theme: 30 adj × 50 noun × 90 numbers = 135k slugs, plenty.

## UI Design System

### Layout

**Home (create):**
- Desktop (≥1024px): 2-column inside a max-width container. Left: theme picker as a vertical sidebar (~200px). Right: title input + calendar + "Create Event" button.
- Tablet (768–1023px): same as desktop but narrower.
- Mobile (<768px): single column. Theme picker collapses to a 4-across pill row at the top. Everything else stacks. Button becomes full-width.

**Event page:**
- Desktop: 2-column. Left: calendar. Right: "Best days so far" card + "Who's in" participant chips.
- Tablet: calendar full-width, "Best days" + "Who's in" stacked below.
- Mobile: single column; everything stacks.

**Breakpoints:** Tailwind defaults — `sm:640px`, `md:768px`, `lg:1024px`.

### Components (React, each in its own file)

- `<ThemeProvider>` — wraps the app, reads theme from event context, applies CSS vars to `<body>` via `document.documentElement.style.setProperty`
- `<ThemePicker>` — 4 chips; desktop vertical, mobile horizontal
- `<TitleInput>` — dashed-border styled input
- `<RangePicker>` — wraps `react-day-picker` with our custom day cell
- `<EventCalendar>` — same `react-day-picker` wrapper, day cell renders heatmap color + "mine" dot
- `<NameBar>` — sticky "who are you?" input
- `<BestDays>` — top-3 overlap days card
- `<ParticipantChips>` — chip list with visual "you" chip
- `<ShareCard>` — QR + copy button + continue CTA
- `<DriftingEmojis>` — absolute-positioned drifters animated with Framer Motion
- `<ConfettiBurst>` — one-shot confetti animation on submit

### Animations (Framer Motion)

- **Page transitions:** soft fade+slide (spring, stiffness 220, damping 24)
- **Day cell hover:** scale 1.04, spring back to 1
- **Day cell toggle:** brief pulse on selection + dot bounces into place
- **Submit confetti:** theme-colored emoji particles (🥐 for Eating, 🌿 for Hiking, 💕 for Shopping, ✨ for Games), 2–3 second burst
- **Drifting emojis:** continuous slow translate + rotate loops in the background at ~10% opacity
- **Best days panel:** new top-day slides in with a spring when the data changes
- **Theme switch on home:** palette transitions over 400ms; background drifters cross-fade

### Accessibility
- All interactive elements keyboard-reachable
- Day cells: `role="button"` + `aria-pressed` for selection + `aria-label` with date + group count + mine status
- Heatmap colors paired with numeric counts so color-blind users get the info
- `prefers-reduced-motion` disables drifters and confetti (keeps functional transitions)

## Error handling / edge cases

| Case | Behavior |
|---|---|
| Slug not found (GET) | 404 → cute "This gathering hopped away 🐇" page with "Create a new one →" |
| Empty name submit | Client-side inline shake + error "Tell us your name!" |
| Date range > 90 days at create | Client disables the button inline; server also rejects with 400 as a guard |
| End < start | Client-side fixed by swapping; no error shown |
| Availability dates outside range | Server silently drops them |
| Slug collision on create | Retry up to 5× server-side, then 500 |
| Network error on submit | Toast: "Couldn't save — try again in a bit" with a retry button; local selection preserved |
| Same-name collision | Overwrite silently (trust model). No warning in v1. |
| No submissions yet | Calendar shows no heat; gentle empty-state text on the "Best days" panel |

## Deployment

- **Repo:** single repo `freewhen/` with `/src` (React), `/functions/api` (Workers), `/migrations` (D1 SQL), `wrangler.toml`
- **Build:** `pnpm build` → static bundle in `/dist`
- **Deploy:** `wrangler pages deploy dist` — Pages auto-discovers `functions/`
- **DB migration:** `wrangler d1 migrations apply freewhen` in CI
- **DNS:** CNAME `freewhen.mvp.sg` → `freewhen.pages.dev` (Cloudflare handles TLS automatically via their managed cert)
- **Secrets:** none needed; D1 binding is declared in `wrangler.toml`

## Future considerations (not v1)

- **Time-of-day deconflicting:** add `time_slots` table (`submission_id`, `date`, `start_minute`, `end_minute`) and a second tab on the event page
- **Creator dashboard:** cookie-based "my events" list on the home page
- **Result export:** copy best day to clipboard, "add to calendar" link
- **Email invite:** optional, opt-in
- **Custom themes:** user upload of background color / accent

## Success criteria

- Creator can go from home → shared link in under 30 seconds
- Participant can submit availability in under 20 seconds
- Page loads in under 1s on a fast-3G connection
- Works on iPhone SE-sized viewports (375px)
- Someone who sees it says "ooh, that's so cute"
