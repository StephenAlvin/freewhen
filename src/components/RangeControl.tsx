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
