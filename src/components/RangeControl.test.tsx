import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RangeControl from './RangeControl';

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
