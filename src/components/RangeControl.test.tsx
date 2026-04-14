import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays } from 'date-fns';
import RangeControl from './RangeControl';
import { toIsoDate } from '@/lib/dates';
import { DEFAULT_RANGE_DAYS } from '@/types';

describe('RangeControl (collapsed)', () => {
  const noop = () => {};

  it('renders the default helper sentence with the computed day count', () => {
    render(<RangeControl startDate="2026-04-15" endDate="2026-05-14" onChange={noop} />);
    expect(screen.getByText(/open the next 30 days for people to mark their availability/i))
      .toBeInTheDocument();
  });

  it('reflects a non-default range in the collapsed sentence', () => {
    render(<RangeControl startDate="2026-04-15" endDate="2026-04-21" onChange={noop} />);
    expect(screen.getByText(/open the next 7 days/i)).toBeInTheDocument();
  });

  it('shows a Fix a date range button with aria-expanded=false', () => {
    render(<RangeControl startDate="2026-04-15" endDate="2026-05-14" onChange={noop} />);
    const btn = screen.getByRole('button', { name: /fix a date range/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('emits onValidityChange(true) on mount for a valid default range', () => {
    const onValidity = vi.fn();
    render(
      <RangeControl
        startDate="2026-04-15"
        endDate="2026-05-14"
        onChange={noop}
        onValidityChange={onValidity}
      />
    );
    expect(onValidity).toHaveBeenCalledWith(true);
  });
});

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
    const future = toIsoDate(addDays(new Date(), 5));
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: future } });
    expect(onChange).toHaveBeenCalledWith(future, defaultEnd);
  });

  it('shows an error and emits onValidityChange(false) for end-before-start', async () => {
    const onValidity = vi.fn();
    const { rerender } = render(
      <RangeControl startDate={today} endDate={defaultEnd} onChange={noop} onValidityChange={onValidity} />
    );
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
    const later = toIsoDate(addDays(new Date(), 10));
    const earlier = toIsoDate(addDays(new Date(), 5));
    rerender(
      <RangeControl startDate={later} endDate={earlier} onChange={noop} onValidityChange={onValidity} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/end date must be on or after the start date/i);
    expect(onValidity).toHaveBeenLastCalledWith(false);
  });

  it('shows the too-long error for ranges greater than 90 days', async () => {
    const { rerender } = render(
      <RangeControl startDate={today} endDate={defaultEnd} onChange={noop} />
    );
    await userEvent.click(screen.getByRole('button', { name: /fix a date range/i }));
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
