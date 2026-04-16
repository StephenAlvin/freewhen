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
