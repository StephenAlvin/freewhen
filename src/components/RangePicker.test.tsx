import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RangePicker from './RangePicker';

describe('RangePicker', () => {
  it('renders a calendar grid', () => {
    render(<RangePicker value={undefined} onChange={() => {}} defaultMonth={new Date(2026, 3, 1)} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
  it('calls onChange when two days clicked', async () => {
    const onChange = vi.fn();
    render(<RangePicker value={undefined} onChange={onChange} defaultMonth={new Date(2026, 3, 1)} />);
    // react-day-picker v9: the gridcell (td) wraps a button with an aria-label; we must click the button.
    await userEvent.click(screen.getByRole('button', { name: /April 20th, 2026/ }));
    await userEvent.click(screen.getByRole('button', { name: /April 25th, 2026/ }));
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0];
    expect(last).toHaveProperty('from');
    expect(last).toHaveProperty('to');
  });
});
