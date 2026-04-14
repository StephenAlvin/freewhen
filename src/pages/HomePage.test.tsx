import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

vi.mock('@/lib/api');

describe('HomePage', () => {
  it('renders title input and theme picker', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/what are we planning/i)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /theme/i })).toBeInTheDocument();
  });
  it('disables Create Event button until title + range are set', async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const btn = screen.getByRole('button', { name: /create event/i });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText(/what are we planning/i), 'Brunch');
    expect(btn).toBeDisabled();
  });
});
