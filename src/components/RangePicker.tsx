import 'react-day-picker/style.css';
import { DayPicker, type DateRange } from 'react-day-picker';

interface Props {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  defaultMonth?: Date;
}

export default function RangePicker({ value, onChange, defaultMonth }: Props) {
  return (
    <div className="bg-surface rounded-chunk shadow-card p-5 border border-[var(--fw-soft)]">
      <DayPicker
        mode="range"
        selected={value}
        onSelect={onChange}
        defaultMonth={defaultMonth ?? new Date()}
        numberOfMonths={1}
        showOutsideDays
      />
    </div>
  );
}

export type { DateRange };
