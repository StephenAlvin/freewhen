import { useEffect, useMemo, useState } from 'react';
import { daysBetween, toIsoDate, validateRange } from '@/lib/dates';

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

export default function RangeControl({ startDate, endDate, onValidityChange }: Props) {
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
