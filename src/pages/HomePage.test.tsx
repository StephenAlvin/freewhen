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
