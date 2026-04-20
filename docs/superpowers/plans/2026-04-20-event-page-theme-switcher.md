# Event Page Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small inline theme switcher to the event page header so viewers can override the page's visual theme locally (not persisted).

**Architecture:** New presentational component `ThemeSwitcher` (small horizontal row of 4 emoji pill buttons). `EventPage` holds a `themeOverride` state, derives `activeTheme = themeOverride ?? data.event.theme`, and passes that to `<Layout>` and for the confetti emoji lookup. No API, no persistence.

**Tech Stack:** React + TypeScript, Tailwind, `cn` helper (`src/lib/cn.ts`, based on `clsx` + `tailwind-merge`). Vitest + `@testing-library/react` are present but not used here per the design (purely presentational, no tests).

**Spec:** `docs/superpowers/specs/2026-04-20-event-page-theme-switcher-design.md`

---

## File Structure

**New file:**
- `src/components/ThemeSwitcher.tsx` — horizontal row of 4 emoji-only round buttons with radiogroup semantics. Consumes `THEME_IDS` and `themes` from `@/types` and `@/themes`.

**Modified file:**
- `src/pages/EventPage.tsx` — import `ThemeSwitcher`, add `themeOverride` state, compute `activeTheme`, swap two uses of `data.event.theme`, wrap the right side of the header row (currently just the `New event` Link) in a flex group that also contains `<ThemeSwitcher />`.

No other files are touched. No routes, no API, no types, no shared styles.

---

## Task 1: Create `ThemeSwitcher` component

**Files:**
- Create: `src/components/ThemeSwitcher.tsx`

**Design notes:**
- Mirror the accessibility pattern used by `src/components/ThemePicker.tsx` (`role="radiogroup"` on the container, `role="radio"` + `aria-checked` on each button, theme emoji marked `aria-hidden`, theme label via `aria-label` on the button).
- Active state matches the visual weight of the existing "New event" pill in `EventPage` (which uses `bg-white/90 backdrop-blur ... shadow-md ring-1 ring-black/5`). Inactive is transparent with a subtle hover, so the switcher does not compete with the pill for visual weight.
- Buttons are 36px square (`h-9 w-9`) so the row height sits flush with the "New event" pill (`py-1.5 sm:py-2`).

- [ ] **Step 1: Create the component file**

Create `src/components/ThemeSwitcher.tsx` with this exact content:

```tsx
import { themes } from '@/themes';
import { THEME_IDS, type ThemeId } from '@/types';
import { cn } from '@/lib/cn';

interface Props {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  className?: string;
}

export default function ThemeSwitcher({ value, onChange, className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Switch theme"
      className={cn('inline-flex items-center gap-1', className)}
    >
      {THEME_IDS.map((id) => {
        const t = themes[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.label}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full text-lg transition',
              active
                ? 'bg-white/90 backdrop-blur shadow-md ring-1 ring-black/5'
                : 'bg-transparent hover:bg-white/70',
            )}
          >
            <span aria-hidden="true">{t.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: exit code 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeSwitcher.tsx
git commit -m "feat(theme-switcher): add inline ThemeSwitcher component"
```

---

## Task 2: Wire `ThemeSwitcher` into `EventPage`

**Files:**
- Modify: `src/pages/EventPage.tsx`

**What changes:**
1. Add `ThemeSwitcher` import alongside the other component imports (after the `Button` import is a natural spot).
2. Add `themeOverride` state beside the other `useState` calls in the component body.
3. In the success branch (after the early returns), compute `activeTheme` and use it in place of `data.event.theme` for `<Layout>` and for `getTheme(...)`.
4. Wrap the existing `<Link to="/">...New event</Link>` in a flex group that also contains `<ThemeSwitcher />` immediately to its left.

- [ ] **Step 1: Add the import**

In `src/pages/EventPage.tsx`, find the existing block of component imports (currently ending with the line that imports `NotFound`). Add `ThemeSwitcher` alongside them.

Change:

```tsx
import Button from '@/components/Button';
import ShareCard from '@/components/ShareCard';
import ConfettiBurst from '@/components/ConfettiBurst';
import NotFound from '@/components/NotFound';
```

To:

```tsx
import Button from '@/components/Button';
import ShareCard from '@/components/ShareCard';
import ConfettiBurst from '@/components/ConfettiBurst';
import NotFound from '@/components/NotFound';
import ThemeSwitcher from '@/components/ThemeSwitcher';
```

Also extend the existing `@/types` import to include `ThemeId`. Change:

```tsx
import type { EventPayload } from '@/types';
```

To:

```tsx
import type { EventPayload, ThemeId } from '@/types';
```

- [ ] **Step 2: Add `themeOverride` state**

Find the block of `useState` declarations inside `EventPage` (the one that starts with `const [data, setData] = useState<EventPayload | null>(null);`). After the `const [showConfetti, setShowConfetti] = useState(false);` line, add:

```tsx
const [themeOverride, setThemeOverride] = useState<ThemeId | null>(null);
```

- [ ] **Step 3: Derive `activeTheme` and swap the two `data.event.theme` usages in the success branch**

In the success branch (the block starting with `const t = getTheme(data.event.theme);` and the `return (<Layout theme={data.event.theme}> ...`), change:

```tsx
  const t = getTheme(data.event.theme);
  const shareUrl = `${window.location.origin}/${data.event.slug}`;

  return (
    <Layout theme={data.event.theme}>
```

To:

```tsx
  const activeTheme: ThemeId = themeOverride ?? data.event.theme;
  const t = getTheme(activeTheme);
  const shareUrl = `${window.location.origin}/${data.event.slug}`;

  return (
    <Layout theme={activeTheme}>
```

The loading and error branches (which use `<Layout theme="eating">`) are intentionally left alone — they don't have event data yet.

- [ ] **Step 4: Wrap the "New event" Link in a flex group with `ThemeSwitcher`**

Find the header block:

```tsx
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{data.event.title}</h1>
            <p className="text-sm text-ink/50 mt-1">
              🗓 {fmt(data.event.startDate)} – {fmt(data.event.endDate)} · {totalPeople} people
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-ink shadow-md ring-1 ring-black/5 hover:bg-white hover:shadow-lg transition shrink-0"
          >
            <span aria-hidden>＋</span>
            <span>New event</span>
          </Link>
        </div>
```

Replace the `<Link>...</Link>` element (only — the outer `<div>` and the title `<div>` stay exactly as they are) with:

```tsx
          <div className="flex items-center gap-2 shrink-0">
            <ThemeSwitcher
              value={activeTheme}
              onChange={(id) => setThemeOverride(id)}
            />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-ink shadow-md ring-1 ring-black/5 hover:bg-white hover:shadow-lg transition"
            >
              <span aria-hidden>＋</span>
              <span>New event</span>
            </Link>
          </div>
```

Note: the `shrink-0` class moved off the `Link` onto the new wrapper `<div>` (the wrapper now owns the "don't shrink" behavior for the right-side group). Everything else on the Link is identical.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: exit code 0, no errors.

- [ ] **Step 6: Run the existing test suite to confirm no regressions**

Run: `npm test -- --run`
Expected: all existing tests pass. `EventPage.tsx` has no dedicated tests, but `HomePage`, `ThemePicker`, `RangeControl`, `EventCalendar`, and `Button` suites all exercise related components and should be green.

- [ ] **Step 7: Manual smoke check in the browser**

Run the dev server: `npm run dev`

Visit an existing event page (create one via the home page first if needed, e.g. `http://localhost:5173/`, then follow the slug it navigates to).

Verify:
1. Four small emoji pill buttons appear to the left of the "New event" pill.
2. The button matching the event's saved theme is visually highlighted (white pill with shadow/ring).
3. Clicking another theme button immediately updates the page background, drifting emojis, and (after submitting) confetti emoji.
4. Refreshing the page resets the highlight to the event's saved theme.
5. The "New event" pill still works (navigates to `/`).
6. On a narrow viewport (~360px), the right-side group wraps below the title without overlapping — the existing `flex-wrap` on the parent handles this.

- [ ] **Step 8: Commit**

```bash
git add src/pages/EventPage.tsx
git commit -m "feat(event-page): add viewer-side theme switcher"
```
