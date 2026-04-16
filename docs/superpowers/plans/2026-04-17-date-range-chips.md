# Date-range Chip Selector on HomePage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline "Fix a date range" helper sentence on `HomePage` with a four-chip selector (`30 days`, `45 days`, `60 days`, `Custom range`), in its own labeled form section; move the `Create Event` button to its own row.

**Architecture:** Two files change. `RangeControl` stops rendering a helper sentence and instead renders a `role="radiogroup"` chip row that tracks a new internal `mode` state. Selecting `Custom range` reveals the existing From/To date-input row (pre-filled via `onChange`). `HomePage` wraps `RangeControl` in a labeled section like the other form fields and moves `Create Event` into its own submit row. Validation logic in `@/lib/dates.ts`, `@/types.ts`, and all API contracts are unchanged.

**Tech Stack:** React 18 · TypeScript · Tailwind · Vitest + React Testing Library + `@testing-library/user-event` · `date-fns`.

**Related spec:** `docs/superpowers/specs/2026-04-16-date-range-chips-design.md`

---

## File Structure

**Modify:**
- `src/components/RangeControl.tsx` — replace helper-sentence UI with chip row; add `mode` state; conditional custom-range expand.
- `src/components/RangeControl.test.tsx` — rewrite entire file to cover new UX.
- `src/pages/HomePage.tsx` — wrap `RangeControl` in a labeled section ("WHICH DATE-RANGE MIGHT WORK?"); move `Create Event` button to its own row with the submit error above it.
- `src/pages/HomePage.test.tsx` — update the four tests that reference the old helper sentence, the old "Fix a date range" button, or the inline button layout.

No files are created. No types, API contracts, or validation logic change. `DEFAULT_RANGE_DAYS` stays `30`.

---

## Testing Approach

- Per-file iteration during development: `npx vitest run <path>`.
- Full suite before final commit: `npm run test` (runs `vitest` and the workers-pool vitest).
- Between Task 1 and Task 2 commits, the `HomePage` tests will temporarily fail because they still reference the old helper-sentence UI. This is expected — Task 2 updates them. Both tasks land in close succession.
- `role="radio"` elements assert via `aria-checked`, not the DOM `checked` attribute (they're `<button>` elements, not native inputs).

---

## Task 1: Rewrite `RangeControl` with chip selector and custom expand

**Files:**
- Modify: `src/components/RangeControl.tsx`
- Modify: `src/components/RangeControl.test.tsx`

### Step 1: Replace the test file with new tests

- [ ] Overwrite `src/components/RangeControl.test.tsx` with the following content:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays } from 'date-fns';
import RangeControl from './RangeControl';
import { toIsoDate } from '@/lib/dates';

const today = () => toIsoDate(new Date());
const todayPlus = (n: number) => toIsoDate(addDays(new Date(), n));

describe('RangeControl (preset chips)', () => {
  const noop = () => {};

  it('renders a Date range radiogroup with four chips, 30 days checked by default', () => {
    render(<RangeControl startDate={today()} endDate={todayPlus(29)} onChange={noop} />);
    expect(screen.getByRole('radiogroup', { name: /date range/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^30 days$/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^45 days$/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /^60 days$/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /^custom range$/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('does not reveal From/To inputs in the default preset state', () => {
    render(<RangeControl startDate={today()} endDate={todayPlus(29)} onChange={noop} />);
    expect(screen.queryByLabelText(/^from$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^to$/i)).not.toBeInTheDocument();
  });

  it('selecting 45 days checks that chip and fires onChange(today, today+44)', async () => {
    const onChange = vi.fn();
    render(<RangeControl startDate={today()} endDate={todayPlus(29)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /^45 days$/i }));
    expect(screen.getByRole('radio', { name: /^45 days$/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^30 days$/i })).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenCalledWith(today(), todayPlus(44));
    expect(screen.queryByLabelText(/^from$/i)).not.toBeInTheDocument();
  });

  it('selecting 60 days fires onChange(today, today+59)', async () => {
    const onChange = vi.fn();
    render(<RangeControl startDate={today()} endDate={todayPlus(29)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /^60 days$/i }));
    expect(onChange).toHaveBeenCalledWith(today(), todayPlus(59));
  });

  it('emits onValidityChange(true) on mount for a valid default range', () => {
    const onValidity = vi.fn();
    render(
      <RangeControl
        startDate={today()}
        endDate={todayPlus(29)}
        onChange={() => {}}
        onValidityChange={onValidity}
      />,
    );
    expect(onValidity).toHaveBeenCalledWith(true);
  });
});

describe('RangeControl (custom range)', () => {
  const noop = () => {};

  it('selecting Custom range pre-fills to today -> today+29 and reveals From/To inputs', async () => {
    const onChange = vi.fn();
    render(<RangeControl startDate={today()} endDate={todayPlus(29)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    expect(onChange).toHaveBeenCalledWith(today(), todayPlus(29));
    expect(screen.getByLabelText(/^from$/i)).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText(/^to$/i)).toHaveAttribute('type', 'date');
    expect(screen.getByRole('radio', { name: /^custom range$/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('editing the From input fires onChange with the new value and keeps Custom range checked', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RangeControl startDate={today()} endDate={todayPlus(29)} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    const newStart = todayPlus(5);
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: newStart } });
    expect(onChange).toHaveBeenLastCalledWith(newStart, todayPlus(29));
    rerender(<RangeControl startDate={newStart} endDate={todayPlus(29)} onChange={onChange} />);
    expect(screen.getByRole('radio', { name: /^custom range$/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
  });

  it('clicking a preset chip from custom mode hides the From/To inputs and resets dates', async () => {
    const onChange = vi.fn();
    render(<RangeControl startDate={today()} endDate={todayPlus(29)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /^30 days$/i }));
    expect(screen.queryByLabelText(/^from$/i)).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(today(), todayPlus(29));
    expect(screen.getByRole('radio', { name: /^30 days$/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^custom range$/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('shows the end-before-start error and emits onValidityChange(false) in custom mode', async () => {
    const onValidity = vi.fn();
    const { rerender } = render(
      <RangeControl
        startDate={today()}
        endDate={todayPlus(29)}
        onChange={noop}
        onValidityChange={onValidity}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    const later = todayPlus(10);
    const earlier = todayPlus(5);
    rerender(
      <RangeControl
        startDate={later}
        endDate={earlier}
        onChange={noop}
        onValidityChange={onValidity}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/end date must be on or after the start date/i);
    expect(onValidity).toHaveBeenLastCalledWith(false);
  });

  it('shows the too-long error for ranges greater than 90 days', async () => {
    const { rerender } = render(
      <RangeControl startDate={today()} endDate={todayPlus(29)} onChange={noop} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    rerender(<RangeControl startDate={today()} endDate={todayPlus(91)} onChange={noop} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/range can't be more than 90 days/i);
  });
});
```

### Step 2: Run the tests to verify they fail

- [ ] Run the tests:

```bash
npx vitest run src/components/RangeControl.test.tsx
```

Expected: FAIL. Most tests will error with things like `Unable to find an accessible element with the role "radiogroup" and name "date range"` and `Unable to find an accessible element with the role "radio" and name "30 days"` — the old `RangeControl` renders a paragraph of text, not a radiogroup.

### Step 3: Rewrite `RangeControl.tsx`

- [ ] Replace the full contents of `src/components/RangeControl.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { addDays } from 'date-fns';
import { toIsoDate, validateRange, type RangeError } from '@/lib/dates';
import { cn } from '@/lib/cn';

type PresetDays = 30 | 45 | 60;
type Mode = PresetDays | 'custom';

const PRESETS: readonly { value: PresetDays; label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 45, label: '45 days' },
  { value: 60, label: '60 days' },
];

const CUSTOM_PREFILL_DAYS = 30;

const ERROR_MESSAGES: Record<Exclude<RangeError, null>, string> = {
  'invalid': 'Please enter valid dates.',
  'past-start': "Start date can't be in the past.",
  'end-before-start': 'End date must be on or after the start date.',
  'too-long': "Range can't be more than 90 days.",
};

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

export default function RangeControl({ startDate, endDate, onChange, onValidityChange }: Props) {
  const [mode, setMode] = useState<Mode>(30);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const error = useMemo(
    () => validateRange(startDate, endDate, todayIso),
    [startDate, endDate, todayIso],
  );

  useEffect(() => {
    onValidityChange?.(error === null);
  }, [error, onValidityChange]);

  function selectPreset(days: PresetDays) {
    setMode(days);
    const start = toIsoDate(new Date());
    const end = toIsoDate(addDays(new Date(), days - 1));
    onChange(start, end);
  }

  function selectCustom() {
    if (mode === 'custom') return;
    setMode('custom');
    const start = toIsoDate(new Date());
    const end = toIsoDate(addDays(new Date(), CUSTOM_PREFILL_DAYS - 1));
    onChange(start, end);
  }

  const chipBase =
    'rounded-chunk border-2 bg-surface px-3 py-3 text-sm font-semibold text-ink transition-all flex items-center justify-center';
  const chipActive = 'border-brand -translate-y-0.5 shadow-card';
  const chipInactive = 'border-transparent hover:border-soft';

  const inputWrapper =
    'rounded-chunk border border-[var(--fw-soft)] bg-surface px-3 py-2 flex items-center gap-2';
  const inputLabel = 'text-[10px] uppercase tracking-wide text-ink/50 font-semibold';
  const inputField = 'bg-transparent outline-none text-sm text-ink font-medium';

  return (
    <div>
      <div role="radiogroup" aria-label="Date range" className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={mode === p.value}
            onClick={() => selectPreset(p.value)}
            className={cn(chipBase, mode === p.value ? chipActive : chipInactive)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'custom'}
          onClick={selectCustom}
          className={cn(chipBase, mode === 'custom' ? chipActive : chipInactive)}
        >
          Custom range
        </button>
      </div>

      {mode === 'custom' && (
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <label className={inputWrapper}>
              <span className={inputLabel}>From</span>
              <input
                type="date"
                aria-label="From"
                className={inputField}
                value={startDate}
                min={todayIso}
                onChange={(e) => onChange(e.target.value, endDate)}
              />
            </label>
            <label className={inputWrapper}>
              <span className={inputLabel}>To</span>
              <input
                type="date"
                aria-label="To"
                className={inputField}
                value={endDate}
                min={startDate || todayIso}
                onChange={(e) => onChange(startDate, e.target.value)}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-500">
              {ERROR_MESSAGES[error]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Run the RangeControl tests to verify they pass

- [ ] Run the tests:

```bash
npx vitest run src/components/RangeControl.test.tsx
```

Expected: PASS (all 10 tests green).

### Step 5: Commit

- [ ] Commit:

```bash
git add src/components/RangeControl.tsx src/components/RangeControl.test.tsx
git commit -m "$(cat <<'EOF'
feat(range-control): replace helper sentence with chip selector

30/45/60-day presets plus Custom range, which reveals pre-filled
From/To date inputs. Default is 30 days.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

> Note: `HomePage` tests are now temporarily failing because they reference the old "Fix a date range" button and the old helper sentence. Task 2 updates them.

---

## Task 2: Update `HomePage` layout — labeled section + standalone submit row

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`

### Step 1: Update the `HomePage` tests for the new UX

- [ ] Replace the contents of `src/pages/HomePage.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { addDays } from 'date-fns';
import HomePage from './HomePage';
import * as api from '@/lib/api';
import { toIsoDate } from '@/lib/dates';

vi.mock('@/lib/api');

const today = toIsoDate(new Date());
const defaultEnd = toIsoDate(addDays(new Date(), 29));

beforeEach(() => {
  vi.mocked(api.createEvent).mockReset();
  vi.mocked(api.createEvent).mockResolvedValue({
    slug: 'plump-dumpling-42',
    title: 't',
    theme: 'eating',
    startDate: today,
    endDate: defaultEnd,
    createdAt: 1,
  });
});

function renderHome() {
  return render(<MemoryRouter><HomePage /></MemoryRouter>);
}

describe('HomePage', () => {
  it('renders title input and theme picker', () => {
    renderHome();
    expect(screen.getByPlaceholderText(/what are we planning/i)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /theme/i })).toBeInTheDocument();
  });

  it('disables Create Event until a title is typed, then enables it', async () => {
    renderHome();
    const btn = screen.getByRole('button', { name: /create event/i });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    expect(btn).toBeEnabled();
  });

  it('renders the date-range section with preset chips, 30 days checked by default', () => {
    renderHome();
    expect(screen.getByText(/which date-range might work/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^30 days$/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^custom range$/i })).toBeInTheDocument();
  });

  it('reveals From and To inputs when Custom range is selected', async () => {
    renderHome();
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^to$/i)).toBeInTheDocument();
  });

  it('disables Create Event when the custom range is invalid', async () => {
    renderHome();
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    const to = screen.getByLabelText(/^to$/i);
    fireEvent.change(to, { target: { value: toIsoDate(addDays(new Date(), -2)) } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeDisabled();
  });

  it('submits the custom range when valid', async () => {
    renderHome();
    const tenDayEnd = toIsoDate(addDays(new Date(), 9));
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    await userEvent.click(screen.getByRole('radio', { name: /^custom range$/i }));
    fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: tenDayEnd } });
    await userEvent.click(screen.getByRole('button', { name: /create event/i }));
    expect(api.createEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Brunch',
      startDate: today,
      endDate: tenDayEnd,
    }));
  });

  it('submits the 45-day preset when selected', async () => {
    renderHome();
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    await userEvent.click(screen.getByRole('radio', { name: /^45 days$/i }));
    await userEvent.click(screen.getByRole('button', { name: /create event/i }));
    expect(api.createEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Brunch',
      startDate: today,
      endDate: toIsoDate(addDays(new Date(), 44)),
    }));
  });
});
```

### Step 2: Run the HomePage tests to verify they fail on the new assertions

- [ ] Run the tests:

```bash
npx vitest run src/pages/HomePage.test.tsx
```

Expected: FAIL on the "renders the date-range section" test with something like `Unable to find an element with the text: /which date-range might work/i` — the current HomePage has no such label. Tests that interact with the `Custom range` radio will already pass because Task 1 delivered that behavior via `RangeControl`.

### Step 3: Update `HomePage.tsx`

- [ ] Replace the contents of `src/pages/HomePage.tsx` with:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays } from 'date-fns';
import Layout from '@/components/Layout';
import TopActions from '@/components/TopActions';
import ThemePicker from '@/components/ThemePicker';
import TitleInput from '@/components/TitleInput';
import Button from '@/components/Button';
import RangeControl from '@/components/RangeControl';
import type { ThemeId } from '@/types';
import { DEFAULT_RANGE_DAYS } from '@/types';
import { toIsoDate } from '@/lib/dates';
import { createEvent } from '@/lib/api';

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeId>('eating');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<string>(() => toIsoDate(new Date()));
  const [endDate, setEndDate] = useState<string>(() => toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS - 1)));
  const [rangeValid, setRangeValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const canSubmit = title.trim().length > 0 && rangeValid && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const event = await createEvent({ title, theme, startDate, endDate });
      nav(`/${event.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const sectionLabel = 'text-sm font-semibold uppercase tracking-wide text-ink/50 mb-2 pl-1';

  return (
    <Layout theme={theme}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">when r u free?</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <div className={sectionLabel}>Pick a theme</div>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>

          <div>
            <div className={sectionLabel}>Name the event</div>
            <TitleInput
              placeholder="What are we planning?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Event title"
            />
          </div>

          <div>
            <div className={sectionLabel}>Which date-range might work?</div>
            <RangeControl
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              onValidityChange={setRangeValid}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full sm:w-auto">
              Create Event
            </Button>
          </div>
        </form>

        <div className="mt-10 flex justify-center">
          <TopActions />
        </div>
      </main>
    </Layout>
  );
}
```

Notes on the layout change:
- The `Create Event` button now sits inside `<div className="flex justify-end">`. On mobile, the button's `w-full` class stretches it to fill the flex row. On `sm:` and larger, `sm:w-auto` shrinks the button and `justify-end` right-aligns it.
- The submit error paragraph now sits directly above the button row.
- No other sections are changed. The existing uppercase-section label pattern is extracted into `sectionLabel` to avoid repeating the class list three times.

### Step 4: Run the HomePage tests to verify they pass

- [ ] Run the tests:

```bash
npx vitest run src/pages/HomePage.test.tsx
```

Expected: PASS (all 7 tests green).

### Step 5: Run the full test suite

- [ ] Run the full suite:

```bash
npm run test
```

Expected: PASS across all vitest suites (unit + workers-pool). No unrelated tests should regress.

### Step 6: Smoke-test in the browser

- [ ] Start the dev server and verify the new UX manually:

```bash
npm run dev
```

Check in a browser:
- The form shows "WHICH DATE-RANGE MIGHT WORK?" above the chip row.
- `30 days` is the active chip on load.
- Clicking `45 days` / `60 days` lights up that chip and does not reveal date inputs.
- Clicking `Custom range` lights up that chip and reveals the From/To inputs.
- Editing From or To updates the inputs; clicking another preset chip hides the inputs.
- Typing a title and clicking `Create Event` submits as before.
- On a narrow viewport, the `Create Event` button is full-width; on desktop, it is right-aligned.

Stop the dev server when done.

### Step 7: Commit

- [ ] Commit:

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx
git commit -m "$(cat <<'EOF'
feat(home): labeled date-range section and standalone submit row

Wraps RangeControl in a "Which date-range might work?" section
matching the theme/title sections, and moves the Create Event
button to its own row (full-width on mobile, right-aligned on
desktop) with the submit error rendered above it.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review checklist (for the implementer)

Before declaring done, verify:

- [ ] `npm run test` is fully green.
- [ ] The existing theme and title sections visually match the new date-range section (same uppercase-label treatment).
- [ ] No lingering references to `Fix a date range`, `Use default range`, `We'll open the next N days` in either source or tests.
- [ ] `RangeControl` exports the same props (`startDate`, `endDate`, `onChange`, `onValidityChange`) it had before — consumers other than `HomePage` are unchanged.
