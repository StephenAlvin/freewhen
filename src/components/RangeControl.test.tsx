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
