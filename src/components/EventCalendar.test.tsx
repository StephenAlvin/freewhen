import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCalendar from './EventCalendar';

const base = {
  startDate: '2026-04-20',
  endDate: '2026-04-25',
  counts: new Map<string, number>([['2026-04-20', 2], ['2026-04-22', 4], ['2026-04-24', 3]]),
  totalPeople: 4,
};

describe('EventCalendar', () => {
  it('renders days of the range', () => {
    render(<EventCalendar {...base} mine={new Set()} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: /Apr 20.*2 of 4/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apr 22.*4 of 4/i })).toBeInTheDocument();
  });
  it('fires onToggle when a day is clicked', async () => {
    const onToggle = vi.fn();
    render(<EventCalendar {...base} mine={new Set()} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /Apr 20/i }));
    expect(onToggle).toHaveBeenCalledWith('2026-04-20');
  });
  it('marks "mine" cells with aria-pressed=true', () => {
    render(<EventCalendar {...base} mine={new Set(['2026-04-22'])} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: /Apr 22.*picked by you/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Apr 20/i })).toHaveAttribute('aria-pressed', 'false');
  });
});
