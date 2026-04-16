# Date-range chip selector on HomePage

## Problem

On `HomePage`, the date range is currently chosen through a helper sentence
("We'll open the next 30 days for people to mark their availability. Fix a date
range"), which sits inline with the `Create Event` button. The only ways to
change the window are: accept the 30-day default, or click `Fix a date range`
to reveal From/To date inputs.

This section reads differently from the rest of the form (`Pick a theme`,
`Name the event`), and the common intents — "a bit more than a month" or
"a couple of months" — require the user to type dates.

## Goal

Replace the helper sentence with a chip selector for common window lengths,
presented as its own labeled form section that matches the existing ones.
`Custom range` remains available for users who need specific dates.

## Scope

In scope:
- New form section on `HomePage` with uppercase header and chip row.
- Rework `RangeControl` to render the chips and the conditional custom-range
  date inputs.
- Move the `Create Event` button out of the inline row into its own row.

Out of scope:
- Changes to `types.ts`, API contracts, `createEvent`, or validation logic in
  `@/lib/dates`.
- Changes to any page other than `HomePage`.
- Changes to `DEFAULT_RANGE_DAYS` or `MAX_RANGE_DAYS`.

## User experience

The HomePage form gains a new section styled like `Pick a theme` and
`Name the event`:

```
WHICH DATE-RANGE MIGHT WORK?
[ 30 days ] [ 45 days ] [ 60 days ] [ Custom range ]
```

`30 days` is selected by default. Selecting any of `30 / 45 / 60` updates the
window to start today and run for that many days (today → today + N − 1). The
custom date inputs remain hidden.

Selecting `Custom range` reveals a From/To date-input row directly below the
chips, pre-filled to today → today + 29 (the 30-day default). Both inputs are
editable. Returning to a preset chip hides the custom row and resets the dates.

Error messaging for invalid custom ranges (end before start, more than 90
days, etc.) uses the existing error states and copy, rendered below the date
inputs.

The `Create Event` button moves out of the inline row. It sits at the bottom
of the form in its own row: full-width on mobile, right-aligned on desktop.
Any submit-error text renders just above it.

## State & behaviour

`RangeControl` gains one new piece of internal state:

```
mode: 30 | 45 | 60 | 'custom'   // default: 30
```

Transitions:

- **Select preset (`30 | 45 | 60`)** → set `mode`; call
  `onChange(today, today + (N − 1))`. Custom expand stays hidden.
- **Select `Custom range` from a preset** → set `mode = 'custom'` and call
  `onChange(today, today + 29)` to pre-fill. Reveal From/To inputs.
- **Select `Custom range` while already in custom** → no-op
  (the chip is already active).
- **Edit From or To input while in custom** → call `onChange` with the new
  value. `mode` remains `'custom'`.
- **Select a preset from custom** → set `mode`; call
  `onChange(today, today + (N − 1))`. Hide From/To inputs.

Validation (`validateRange` in `@/lib/dates`) and the `onValidityChange`
callback are unchanged — they key off `startDate` and `endDate`, which still
flow through the existing `onChange` pathway.

### Edge case: clock advance while page is open

If the page sits open past midnight and `mode` is a preset, the dates become
stale relative to "today". This mirrors today's behaviour and is accepted.

## Visual treatment

Chips mirror `ThemePicker` button styling (`rounded-chunk`, same active
treatment), but text-only:

- Container: `role="radiogroup"`, `aria-label="Date range"`.
- Each chip: `role="radio"`, `aria-checked={mode === value}`,
  `type="button"`, text-only label.
- Active: `border-brand -translate-y-0.5 shadow-card`.
- Inactive: `border-transparent hover:border-soft`.
- Grid: `grid-cols-4 gap-2` on all viewports — four short chips fit
  comfortably.

The custom-range expand re-uses the existing `rounded-chunk` labeled From/To
date-input styling. `min={todayIso}` on From and `min={startDate}` on To are
preserved. The existing red-500 error paragraph is reused verbatim.

The "Use default range" button is removed. To leave Custom, the user taps any
preset chip.

## Files changed

- `src/components/RangeControl.tsx` — swap helper-sentence UI for chip row;
  add `mode` state; conditional custom-range expand.
- `src/components/RangeControl.test.tsx` — rewrite tests for the new UX.
- `src/pages/HomePage.tsx` — new labeled section; move `Create Event` to its
  own row; move submit error above the button.
- `src/pages/HomePage.test.tsx` — update assertions that reference the old
  helper sentence or inline button layout.

## Testing

New / updated unit tests for `RangeControl`:

- Renders four chips; `30 days` is `aria-checked` by default.
- Clicking `45 days` sets `aria-checked` on that chip, calls
  `onChange(today, today + 44)`, and does not reveal the From/To inputs.
- Clicking `Custom range` calls `onChange(today, today + 29)` and reveals
  From/To inputs.
- Editing the From input while in custom mode calls `onChange` with the new
  value, and `Custom range` stays `aria-checked`.
- Clicking a preset chip while in custom mode hides the From/To inputs and
  calls `onChange` with preset dates.
- An invalid custom range (end-before-start, too-long) renders the existing
  error text and fires `onValidityChange(false)`.
- On mount with a valid default, `onValidityChange(true)` is emitted.

Updated `HomePage` tests:

- Any assertion that queries for "Fix a date range", "We'll open the next ...",
  or "Use default range" is replaced with an assertion on the new chip section.
- The form still submits successfully with default values (30-day window).

## Non-goals

- Customising preset chip lengths via config.
- Persisting the selected mode to storage or URL.
- Animating transitions between preset and custom.
