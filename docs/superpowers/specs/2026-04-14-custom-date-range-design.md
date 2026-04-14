# Custom Date Range on Event Creation — Design Spec

**Date:** 2026-04-14
**Status:** Draft (pending user approval)
**Related:** `docs/superpowers/specs/2026-04-14-freewhen-design.md`

## Overview

Today, the FreeWhen home page opens a fixed 45-day window for every new event. This spec introduces two changes:

1. **Shorter default window:** drop the default from 45 days to 30 days.
2. **Custom date range:** a new "Fix a date range" affordance in the helper line under the form lets the creator override the default window with explicit start/end dates before creating the event.

The custom range expands **inline** (no modal), uses **custom-styled wrappers around native `<input type="date">`** (native OS pickers, custom look), and enforces "start must be today or later" plus the existing 90-day cap.

## Scope

**In scope:**
- Default window changes from 45 → 30 days.
- A new inline control on the home page that toggles between "use default" and "pick custom range".
- Client-side validation for the custom range (start ≥ today, end ≥ start, range ≤ 90 days).
- Submit uses the chosen range (default or custom) directly — no server changes.

**Out of scope:**
- No changes to the API, backend, or DB schema. The server already accepts `startDate` / `endDate` and validates the 90-day cap.
- No changes to the event page (`/:slug`) — the range is fixed at event creation time.
- No persisting the user's range preference across sessions.
- No calendar-grid range picker (native OS picker is sufficient per the agreed approach).

## User Flow

1. Creator lands on home page. Under the form, they see:
   > "We'll open the next 30 days for people to mark their availability. **Fix a date range**"
2. **Path A — accept default:** creator ignores the link, fills title, clicks Create. Event is created with `startDate = today`, `endDate = today + 29`.
3. **Path B — customize:** creator clicks **Fix a date range**. The sentence re-lays-out in place:
   > "Open from **[ From · 2026-04-14 ▿ ]** to **[ To · 2026-05-13 ▿ ]** for people to mark their availability. **Use default range**"
   - Each field is a styled wrapper around a native `<input type="date">`. Tapping/clicking opens the OS date picker.
   - Defaults on first expand are today and today + 29 (identical to the hidden-default case).
   - If inputs are invalid, an inline error appears below; the Create button disables.
   - Clicking **Use default range** collapses the UI back, resets state to today / today + 29, and clears any error.
4. Creator clicks **Create Event**. `POST /api/events` uses the current state regardless of whether the pickers are expanded.

## State Model

`HomePage` becomes the single source of truth for the range:

```ts
const [theme, setTheme] = useState<ThemeId>('eating');
const [title, setTitle] = useState('');
const [startDate, setStartDate] = useState<string>(() => toIsoDate(new Date()));
const [endDate, setEndDate] = useState<string>(() =>
  toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS - 1))
);
const [rangeValid, setRangeValid] = useState(true);
```

- `startDate` / `endDate` are ISO (`YYYY-MM-DD`) strings — the same format the API already accepts.
- `rangeValid` is derived from the new `RangeControl` and reported up via `onValidityChange`.
- `canSubmit` becomes `title.trim().length > 0 && rangeValid && !loading`.
- On submit, `startDate` / `endDate` are sent directly — `DEFAULT_RANGE_DAYS` is no longer used at submit time, only to seed defaults.

### Constant change

`src/types.ts`:
```diff
- export const DEFAULT_RANGE_DAYS = 45;
+ export const DEFAULT_RANGE_DAYS = 30;
```

`MAX_RANGE_DAYS = 90` is unchanged.

## Component: `RangeControl`

New file: `src/components/RangeControl.tsx`.

### Props

```ts
interface Props {
  startDate: string;                                      // ISO, controlled
  endDate: string;                                        // ISO, controlled
  onChange: (start: string, end: string) => void;
  onValidityChange?: (valid: boolean) => void;
}
```

The component owns its own `expanded: boolean` state (the toggle between default sentence and inline pickers). It does **not** own `startDate` / `endDate` — those are controlled by `HomePage` so the submit handler can read them directly.

### Rendering — default (collapsed) state

```
"We'll open the next {N} days for people to mark their availability. [Fix a date range]"
```

Where `N = daysBetween(startDate, endDate)` — so if the parent seeded non-default dates, the sentence reflects that. In practice on first paint `N === DEFAULT_RANGE_DAYS (30)`.

`[Fix a date range]` is a `<button type="button">` styled as a text link:
`text-brand font-medium underline underline-offset-2 hover:opacity-80`.
It carries `aria-expanded={expanded}` and `aria-controls="range-picker"`.

### Rendering — expanded state

```
"Open from  [From · YYYY-MM-DD ▿]  to  [To · YYYY-MM-DD ▿]  for people to mark their availability.  [Use default range]"
```

Each input is a `<label>` wrapping:
- A small leading label text (`From` / `To`) — `text-xs uppercase tracking-wide text-ink/50`.
- A native `<input type="date">` with transparent background, no border, width sized to content via `text-sm` and inherited font.
- A thin wrapper: `rounded-chunk border border-[var(--fw-soft)] bg-surface px-3 py-2 flex items-center gap-2`.

The `<input>` gets:
- `min={todayIso}` on the start input.
- `min={startDate}` on the end input.
- Change handlers that call `onChange(start, end)` with the new values.

**Use default range** is another link-styled `<button>` that:
- Sets `expanded = false`.
- Calls `onChange(todayIso, addDays(today, DEFAULT_RANGE_DAYS - 1))` to reset state.
- Clears the error (by re-validating, which will now pass).

### Validation

Pure function inside `RangeControl` (or in `src/lib/dates.ts` if reused):

```ts
type RangeError =
  | null
  | 'invalid'      // unparseable ISO
  | 'past-start'   // start < today
  | 'end-before-start'
  | 'too-long';    // > MAX_RANGE_DAYS

function validateRange(start: string, end: string): RangeError {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return 'invalid';
  if (start < toIsoDate(new Date())) return 'past-start';
  if (end < start) return 'end-before-start';
  if (daysBetween(start, end) > MAX_RANGE_DAYS) return 'too-long';
  return null;
}
```

Run on every change (and on mount) and:
- Emit `onValidityChange(error === null)`.
- If `expanded && error !== null`, render an inline error line under the sentence with `role="alert"`, `text-sm text-red-500 pl-1`.

Error messages (plain, friendly):
- `invalid` → "Please enter valid dates."
- `past-start` → "Start date can't be in the past."
- `end-before-start` → "End date must be on or after the start date."
- `too-long` → "Range can't be more than 90 days."

Since string ISO comparison (`start < todayIso`) is lexicographic and the format is `YYYY-MM-DD`, it's a correct date comparison.

## Layout Change in `HomePage.tsx`

The existing row:

```tsx
<div className="flex items-center justify-between gap-4 flex-wrap">
  <p className="text-sm text-ink/50 pl-1 flex-1 min-w-0">
    We'll open the next {DEFAULT_RANGE_DAYS} days for people to mark their availability.
  </p>
  <Button ...>Create Event</Button>
</div>
```

becomes:

```tsx
<div className="flex items-center justify-between gap-4 flex-wrap">
  <RangeControl
    startDate={startDate}
    endDate={endDate}
    onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
    onValidityChange={setRangeValid}
  />
  <Button ...>Create Event</Button>
</div>
```

`RangeControl` itself renders a `flex-1 min-w-0` wrapper with the same `text-sm text-ink/50 pl-1` styling on the non-input copy, so the visual density matches today's layout in the default state.

## Accessibility

- `Fix a date range` button: `aria-expanded` + `aria-controls`. The region it controls has `id="range-picker"`.
- Each date input is wrapped in a `<label>` with a visible `From` / `To` text, making the whole wrapper a hit target for the native picker.
- Error line uses `role="alert"` so screen readers announce validation errors on change.
- Keyboard: all interactive elements reachable via Tab; native inputs handle their own keyboard affordances.

## Testing

### Updates to `src/pages/HomePage.test.tsx`

**Pre-existing failure to fix:** the current second test (`disables Create Event button until title + range are set`) asserts the button remains disabled after typing a title. This contradicts today's code (default 30/45-day range is already in state, so typing a title enables the button) and it fails on `main`. Rewrite it to match the new design:

- Button is disabled on initial render (empty title).
- After typing a title, with the default range in place, the button is **enabled**.
- Opening the custom picker and entering an invalid range disables it again.
- Fixing the range (or clicking **Use default range**) re-enables it.

Add:
- The default helper sentence shows "30 days" (not 45).
- Clicking **Fix a date range** reveals two date inputs with accessible `From` / `To` labels.
- Entering an invalid range (end before start, past start, > 90 days) disables Create and surfaces a `role="alert"` error.
- **Use default range** collapses the picker, restores default sentence, resets state, and re-enables Create.
- Valid custom range is sent in the `createEvent` payload (assert on the mocked call args).

### New `src/components/RangeControl.test.tsx`

- Renders collapsed by default with the computed day count in the sentence.
- `Fix a date range` click expands the region and focuses the first input (if we choose to auto-focus — see Open Questions).
- `onChange` fires with updated `start` and `end` as the user edits.
- `onValidityChange(false)` fires when a past start is entered, and `(true)` when corrected.
- Error messages render with `role="alert"` and the correct copy.

### Existing tests to verify unchanged

- `src/components/EventCalendar.test.tsx` — untouched; the event page isn't affected.
- `src/lib/dates.test.ts` — only extended if `validateRange` or a helper like `addDays` lands there.

## Helpers

Use `addDays` from the already-installed `date-fns` package (no new dependency, no new wrapper):

```ts
import { addDays } from 'date-fns';
const end = toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS - 1));
```

This replaces the existing inline `end.setDate(today.getDate() + DEFAULT_RANGE_DAYS - 1)` in `HomePage.tsx` and gives both `HomePage` (initial state) and `RangeControl` (reset on "Use default range") one named helper for seeding defaults.

## Risks & Edge Cases

| Case | Behavior |
|---|---|
| User picks dates, collapses with **Use default range**, submits | Submits with default today / today+29 (reset on collapse). |
| User picks dates, does NOT collapse, submits | Submits with the picked dates. |
| Browser with no native `<input type="date">` support (e.g., very old Safari) | Degrades to a text input. Not supported in v1 — acceptable, matches stack assumptions. |
| Midnight rollover while page is open | `today` is captured on mount. A user who sits on the page across midnight and submits will pass a `startDate` equal to yesterday — server accepts it (no server-side past-date check). Acceptable: low-probability, low-impact. |
| User enters a malformed ISO directly (only possible on non-date-input fallback) | `validateRange` returns `'invalid'` → Create disabled, friendly error. |
| Range > 90 days | Inline error; Create disabled; server would also reject as a guard. |

## Open Questions

1. **Auto-focus on expand?** When clicking "Fix a date range", should the `From` input auto-focus (and possibly auto-open the native picker)? Reasonable default: yes, focus the `From` input but don't programmatically open the picker (which is unreliable across browsers). Noted in the spec; confirm during implementation.
2. **Show range length in expanded state?** A subtle `· N days` note next to the inputs could help users notice when they've picked a very short or long range. Not in v1 unless it's trivial.

## Success Criteria

- Default event creation (no interaction with the new control) opens a 30-day window.
- A user can set a custom start and end date via the inline control and have those dates populate the event.
- Invalid ranges disable the Create button with a clear error message.
- No regressions in existing `HomePage` or `EventCalendar` tests.
