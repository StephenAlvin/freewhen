# Custom Date Range on Event Creation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline "Fix a date range" affordance on the home page that lets event creators pick custom start/end dates, and shorten the default window from 45 to 30 days.

**Architecture:** Client-side only. A new `RangeControl` component owns the expand/collapse toggle and renders either the default helper sentence or two styled native date inputs. `HomePage` holds `startDate`/`endDate` as state (source of truth) and passes them as controlled props. Validation is a pure function in `src/lib/dates.ts`.

**Tech Stack:** React 18 · TypeScript · Tailwind · Vitest + React Testing Library + `@testing-library/user-event` · `date-fns` (already a dependency).

**Related spec:** `docs/superpowers/specs/2026-04-14-custom-date-range-design.md`

---

## File Structure

**Create:**
- `src/components/RangeControl.tsx` — the new controlled component
- `src/components/RangeControl.test.tsx` — component tests

**Modify:**
- `src/types.ts` — `DEFAULT_RANGE_DAYS` constant 45 → 30
- `src/lib/dates.ts` — add `validateRange` helper and its `RangeError` type
- `src/lib/dates.test.ts` — tests for `validateRange`
- `src/pages/HomePage.tsx` — lift `startDate`/`endDate` to state, render `<RangeControl>`, use current state at submit
- `src/pages/HomePage.test.tsx` — rewrite broken test, add new range-flow tests

No backend, no schema, no new dependency.

---

## Testing Approach

- All tests run under `npx vitest run <path>` (jsdom env, from `vite.config.ts`).
- Pure logic (`validateRange`) → strict red→green→commit.
- Component (`RangeControl`) → render + interaction tests with `@testing-library/user-event`.
- `HomePage` integration test uses the existing `vi.mock('@/lib/api')` pattern and asserts on `createEvent` call args.

Full suite command: `npm run test` (runs vitest + workers-pool vitest). For per-task iteration, target the file: `npx vitest run src/lib/dates.test.ts`.

---

## Task 1: Add `validateRange` helper

**Files:**
- Modify: `src/lib/dates.ts`
- Modify: `src/lib/dates.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/dates.test.ts`:

```ts
import { toIsoDate, isValidIsoDate, daysBetween, enumerateDates, validateRange } from './dates';

describe('validateRange', () => {
  const today = '2026-04-14';

  it('accepts a valid range', () => {
    expect(validateRange('2026-04-14', '2026-05-13', today)).toBeNull();
    expect(validateRange('2026-04-14', '2026-04-14', today)).toBeNull();
  });

  it('rejects unparseable ISO strings', () => {
    expect(validateRange('2026-4-14', '2026-05-01', today)).toBe('invalid');
    expect(validateRange('2026-04-14', 'nope', today)).toBe('invalid');
    expect(validateRange('', '', today)).toBe('invalid');
  });

  it('rejects a start date before today', () => {
    expect(validateRange('2026-04-13', '2026-05-01', today)).toBe('past-start');
  });

  it('rejects an end date before the start date', () => {
    expect(validateRange('2026-04-20', '2026-04-15', today)).toBe('end-before-start');
  });

  it('rejects a range longer than 90 days (inclusive)', () => {
    expect(validateRange('2026-04-14', '2026-07-12', today)).toBeNull();   // 90 days
    expect(validateRange('2026-04-14', '2026-07-13', today)).toBe('too-long'); // 91 days
  });

  it('checks in order: invalid > past-start > end-before-start > too-long', () => {
    expect(validateRange('bad', 'bad', today)).toBe('invalid');
    expect(validateRange('2026-04-13', '2026-04-10', today)).toBe('past-start');
    expect(validateRange('2026-04-14', '2026-04-13', today)).toBe('end-before-start');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: FAIL — `validateRange is not a function` or import error.

- [ ] **Step 3: Implement `validateRange`**

Add this import at the top of `src/lib/dates.ts` (the file currently has no imports):

```ts
import { MAX_RANGE_DAYS } from '@/types';
```

Then append to the bottom of `src/lib/dates.ts`:

```ts
export type RangeError = null | 'invalid' | 'past-start' | 'end-before-start' | 'too-long';

export function validateRange(start: string, end: string, todayIso: string): RangeError {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return 'invalid';
  if (start < todayIso) return 'past-start';
  if (end < start) return 'end-before-start';
  if (daysBetween(start, end) > MAX_RANGE_DAYS) return 'too-long';
  return null;
}
```

Note: string comparison on `YYYY-MM-DD` is lexicographic and correct for date ordering.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: PASS — all describe blocks green.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts
git commit -m "feat: add validateRange helper for date-range inputs"
```

---

## Task 2: Change `DEFAULT_RANGE_DAYS` 45 → 30

**Files:**
- Modify: `src/types.ts`

This is a one-line constant change. Its downstream effect (the failing `HomePage` test and copy text) is handled in Task 4 below, so the suite may remain red between tasks — that's expected.

- [ ] **Step 1: Edit the constant**

In `src/types.ts`, change:

```ts
export const DEFAULT_RANGE_DAYS = 45;
```

to:

```ts
export const DEFAULT_RANGE_DAYS = 30;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors (the constant is used only as a number).

- [ ] **Step 3: Confirm nothing else references `45` as a range default**

Run: `grep -n "45" src/`
Expected: no results tied to range days (there may be unrelated `45` tokens — visually confirm none are range-related).

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: default event range is now 30 days (was 45)"
```

---

## Task 3: Create `RangeControl` component (collapsed state)

**Files:**
- Create: `src/components/RangeControl.tsx`
- Create: `src/components/RangeControl.test.tsx`

- [ ] **Step 1: Write the failing tests for the collapsed state**

Create `src/components/RangeControl.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RangeControl from './RangeControl';

describe('RangeControl (collapsed)', () => {
  const noop = () => {};

  it('renders the default helper sentence with the computed day count', () => {
    render(<RangeControl startDate="2026-04-14" endDate="2026-05-13" onChange={noop} />);
    expect(screen.getByText(/open the next 30 days for people to mark their availability/i))
      .toBeInTheDocument();
  });

  it('reflects a non-default range in the collapsed sentence', () => {
    render(<RangeControl startDate="2026-04-14" endDate="2026-04-20" onChange={noop} />);
    expect(screen.getByText(/open the next 7 days/i)).toBeInTheDocument();
  });

  it('shows a Fix a date range button with aria-expanded=false', () => {
    render(<RangeControl startDate="2026-04-14" endDate="2026-05-13" onChange={noop} />);
    const btn = screen.getByRole('button', { name: /fix a date range/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('emits onValidityChange(true) on mount for a valid default range', () => {
    const onValidity = vi.fn();
    render(
      <RangeControl
        startDate="2026-04-14"
        endDate="2026-05-13"
        onChange={noop}
        onValidityChange={onValidity}
      />
    );
    expect(onValidity).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/components/RangeControl.test.tsx`
Expected: FAIL — module not found (`./RangeControl`).

- [ ] **Step 3: Implement the collapsed-state component**

Create `src/components/RangeControl.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { daysBetween, toIsoDate, validateRange } from '@/lib/dates';

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

export default function RangeControl({ startDate, endDate, onChange, onValidityChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const error = useMemo(
    () => validateRange(startDate, endDate, todayIso),
    [startDate, endDate, todayIso],
  );
  const dayCount = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    onValidityChange?.(error === null);
  }, [error, onValidityChange]);

  return (
    <div className="flex-1 min-w-0 text-sm text-ink/50 pl-1">
      {!expanded && (
        <p>
          We'll open the next {dayCount} days for people to mark their availability.{' '}
          <button
            type="button"
            aria-expanded={false}
            aria-controls="range-picker"
            onClick={() => setExpanded(true)}
            className="text-brand font-medium underline underline-offset-2 hover:opacity-80"
          >
            Fix a date range
          </button>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/RangeControl.test.tsx`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/RangeControl.tsx src/components/RangeControl.test.tsx
git commit -m "feat: RangeControl component, collapsed state"
```

---

## Task 4: Expanded state — date inputs, validation, reset

**Files:**
- Modify: `src/components/RangeControl.tsx`
- Modify: `src/components/RangeControl.test.tsx`

- [ ] **Step 1: Add failing tests for the expanded state**

Append to `src/components/RangeControl.test.tsx`:

```tsx
import { fireEvent } from '@testing-library/react';
import { addDays } from 'date-fns';
import { toIsoDate } from '@/lib/dates';
import { DEFAULT_RANGE_DAYS } from '@/types';

describe('RangeControl (expanded)', () => {
  const noop = () => {};
  const today = toIsoDate(new Date());
  const defaultEnd = toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS - 1));

  it('reveals From and To date inputs when Fix a date range is clicked', async () => {
    render(<RangeControl startDate={today} endDate={defaultEnd} onChange={noop} />);
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    expect(screen.getByLabelText(/^from$/i)).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText(/^to$/i)).toHaveAttribute('type', 'date');
  });

  it('shows a Use default range button after expanding', async () => {
    render(<RangeControl startDate={today} endDate={defaultEnd} onChange={noop} />);
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    expect(screen.getByRole('button', { name: /use default range/i })).toBeInTheDocument();
  });

  it('emits onChange when the From input changes', async () => {
    const onChange = vi.fn();
    render(<RangeControl startDate={today} endDate={defaultEnd} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: '2026-05-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-05-01', defaultEnd);
  });

  it('shows an error and emits onValidityChange(false) for end-before-start', async () => {
    const onValidity = vi.fn();
    const { rerender } = render(
      <RangeControl startDate={today} endDate={defaultEnd} onChange={noop} onValidityChange={onValidity} />
    );
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    rerender(
      <RangeControl startDate="2026-05-10" endDate="2026-05-01" onChange={noop} onValidityChange={onValidity} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/end date must be on or after the start date/i);
    expect(onValidity).toHaveBeenLastCalledWith(false);
  });

  it('shows the too-long error for ranges greater than 90 days', async () => {
    const { rerender } = render(
      <RangeControl startDate={today} endDate={defaultEnd} onChange={noop} />
    );
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    // 91-day range starting today
    const longEnd = toIsoDate(addDays(new Date(), 91));
    rerender(<RangeControl startDate={today} endDate={longEnd} onChange={noop} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/range can't be more than 90 days/i);
  });

  it('Use default range collapses, resets dates, and fires onChange with defaults', async () => {
    const onChange = vi.fn();
    render(<RangeControl startDate={today} endDate={toIsoDate(addDays(new Date(), 5))} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    await userEvent.click(screen.getByRole('button', { name: /use default range/i }));
    expect(onChange).toHaveBeenLastCalledWith(today, defaultEnd);
    expect(screen.getByRole('button', { name: /fix a date range/i })).toBeInTheDocument();
  });
});
```

Note: date inputs are driven via `fireEvent.change` (atomic value change) rather than `userEvent.type`, because typing a partial ISO string into a controlled `type="date"` input produces unreliable intermediate values. Validation-error scenarios use `rerender` so we don't have to mock `Date.now()`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run src/components/RangeControl.test.tsx`
Expected: FAIL — expanded-state tests can't find the `From` / `To` labels or the reset button.

- [ ] **Step 3: Flesh out the component**

Replace the body of `src/components/RangeControl.tsx` with the full implementation:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { addDays } from 'date-fns';
import { daysBetween, toIsoDate, validateRange, type RangeError } from '@/lib/dates';
import { DEFAULT_RANGE_DAYS } from '@/types';

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

const ERROR_MESSAGES: Record<Exclude<RangeError, null>, string> = {
  'invalid': 'Please enter valid dates.',
  'past-start': "Start date can't be in the past.",
  'end-before-start': 'End date must be on or after the start date.',
  'too-long': "Range can't be more than 90 days.",
};

export default function RangeControl({ startDate, endDate, onChange, onValidityChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const error = useMemo(
    () => validateRange(startDate, endDate, todayIso),
    [startDate, endDate, todayIso],
  );
  const dayCount = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    onValidityChange?.(error === null);
  }, [error, onValidityChange]);

  function handleCollapse() {
    setExpanded(false);
    onChange(todayIso, toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS - 1)));
  }

  const wrapper = 'rounded-chunk border border-[var(--fw-soft)] bg-surface px-3 py-2 flex items-center gap-2';
  const labelText = 'text-[10px] uppercase tracking-wide text-ink/50 font-semibold';
  const input = 'bg-transparent outline-none text-sm text-ink font-medium';

  return (
    <div className="flex-1 min-w-0 text-sm text-ink/50 pl-1">
      {!expanded && (
        <p>
          We'll open the next {dayCount} days for people to mark their availability.{' '}
          <button
            type="button"
            aria-expanded={false}
            aria-controls="range-picker"
            onClick={() => setExpanded(true)}
            className="text-brand font-medium underline underline-offset-2 hover:opacity-80"
          >
            Fix a date range
          </button>
        </p>
      )}

      {expanded && (
        <div id="range-picker">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Open from</span>
            <label className={wrapper}>
              <span className={labelText}>From</span>
              <input
                type="date"
                aria-label="From"
                className={input}
                value={startDate}
                min={todayIso}
                onChange={(e) => onChange(e.target.value, endDate)}
              />
            </label>
            <span>to</span>
            <label className={wrapper}>
              <span className={labelText}>To</span>
              <input
                type="date"
                aria-label="To"
                className={input}
                value={endDate}
                min={startDate || todayIso}
                onChange={(e) => onChange(startDate, e.target.value)}
              />
            </label>
            <span>for people to mark their availability.</span>
            <button
              type="button"
              onClick={handleCollapse}
              className="text-brand font-medium underline underline-offset-2 hover:opacity-80"
            >
              Use default range
            </button>
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/RangeControl.test.tsx`
Expected: PASS — all collapsed + expanded tests green (10 total).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/RangeControl.tsx src/components/RangeControl.test.tsx
git commit -m "feat: RangeControl expanded state with validation + reset"
```

---

## Task 5: Wire `RangeControl` into `HomePage`, fix broken test

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`

- [ ] **Step 1: Rewrite the failing test and add new coverage**

Replace the contents of `src/pages/HomePage.test.tsx` with:

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

  it('shows the new 30-day default helper sentence', () => {
    renderHome();
    expect(screen.getByText(/open the next 30 days/i)).toBeInTheDocument();
  });

  it('reveals From and To inputs when Fix a date range is clicked', async () => {
    renderHome();
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^to$/i)).toBeInTheDocument();
  });

  it('disables Create Event when the custom range is invalid', async () => {
    renderHome();
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    const to = screen.getByLabelText(/^to$/i);
    // Set end before start — with start=today this means an earlier date.
    fireEvent.change(to, { target: { value: toIsoDate(addDays(new Date(), -2)) } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeDisabled();
  });

  it('submits the custom range when valid', async () => {
    renderHome();
    const tenDayEnd = toIsoDate(addDays(new Date(), 9));
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: tenDayEnd } });
    await userEvent.click(screen.getByRole('button', { name: /create event/i }));
    expect(api.createEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Brunch',
      startDate: today,
      endDate: tenDayEnd,
    }));
  });
});
```

- [ ] **Step 2: Run tests to confirm expected failures**

Run: `npx vitest run src/pages/HomePage.test.tsx`
Expected result before `HomePage.tsx` is updated:
- `renders title input and theme picker` → PASS.
- `disables Create Event until a title is typed, then enables it` → PASS (current HomePage already enables on title).
- `shows the new 30-day default helper sentence` → PASS if Task 2 already landed (constant is 30); otherwise FAIL.
- `reveals From and To inputs when Fix a date range is clicked` → FAIL (no such button yet).
- `disables Create Event when the custom range is invalid` → FAIL.
- `submits the custom range when valid` → FAIL.

- [ ] **Step 3: Update `HomePage.tsx` to use `RangeControl`**

Replace `src/pages/HomePage.tsx` with:

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDays } from 'date-fns';
import Layout from '@/components/Layout';
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

  return (
    <Layout theme={theme}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-brand font-semibold text-lg hover:opacity-80 transition-opacity">
            freewhen.me
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">when r u free?</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-2 pl-1">Pick a theme</div>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-2 pl-1">Name the event</div>
            <TitleInput
              placeholder="What are we planning?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Event title"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <RangeControl
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              onValidityChange={setRangeValid}
            />
            <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full sm:w-auto">
              Create Event
            </Button>
          </div>
        </form>
      </main>
    </Layout>
  );
}
```

- [ ] **Step 4: Run HomePage tests**

Run: `npx vitest run src/pages/HomePage.test.tsx`
Expected: PASS on all 6 tests.

- [ ] **Step 5: Run the full vitest suite**

Run: `npx vitest run`
Expected: PASS across all test files. If anything unrelated fails, investigate before committing.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Manual smoke test in the dev server**

Run: `npm run dev`
Open the printed URL. Confirm:
- Default text reads "We'll open the next 30 days for people to mark their availability."
- Clicking **Fix a date range** reveals two date inputs labeled From and To.
- Changing either input updates the sentence/state (visible when you click **Use default range** to see the sentence re-compute).
- Typing a past date as start shows the "Start date can't be in the past" error and disables Create.
- Entering 91+ day range shows "Range can't be more than 90 days" and disables Create.
- Clicking **Use default range** restores the 30-day sentence and re-enables Create.
- Successful create still redirects to `/:slug`.

Stop the dev server (`Ctrl-C`).

- [ ] **Step 8: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx
git commit -m "feat: HomePage uses RangeControl for custom start/end dates"
```

---

## Self-Review Notes

**Spec coverage check:**
- Default 30 days → Task 2.
- Inline "Fix a date range" toggle → Task 3 (collapsed) + Task 4 (expand).
- Styled wrappers around native date inputs → Task 4 implementation.
- Validation (today/≤90/end≥start/invalid) → Task 1 (`validateRange`) + Task 4 (UI).
- "Use default range" resets + re-enables Create → Task 4 (`handleCollapse`) + Task 5 test.
- Fix pre-existing failing HomePage test → Task 5 Step 1.
- `date-fns` `addDays` instead of a custom helper → Task 4, Task 5.

**No placeholders:** every code step ships complete code. Every command has an expected outcome.

**Type consistency:** `RangeError` is the single type defined in `src/lib/dates.ts` and consumed in `RangeControl.tsx`. `RangeControl` props match the calls in `HomePage.tsx`. `addDays` is imported from `date-fns` everywhere it's used.

**Risk notes:**
- Tests use literal dates (e.g., `2026-04-14`) against `todayIso` from `new Date()`. Since `today` evaluates at test run time, those literal-date scenarios in the `RangeControl` tests use `rerender` with fixed props rather than relying on the internal `todayIso`, and `validateRange` takes `todayIso` as a parameter to keep its unit tests deterministic. The tests that DO exercise "past-start" do so by rerendering the component with a known-past string, not by mocking time.
- `onValidityChange` is called on every render where `error` changes — the `useEffect` dep list makes this safe and idempotent. Parents like `HomePage` store the boolean in state; React will bail out on no-op setState.
