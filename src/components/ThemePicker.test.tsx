import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemePicker from './ThemePicker';

describe('ThemePicker', () => {
  it('renders all four theme chips', () => {
    render(<ThemePicker value="eating" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /eating/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /hiking/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /shopping/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /games/i })).toBeInTheDocument();
  });
  it('marks active chip with aria-checked=true', () => {
    render(<ThemePicker value="hiking" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /hiking/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /eating/i })).toHaveAttribute('aria-checked', 'false');
  });
  it('calls onChange when clicking another chip', async () => {
    const onChange = vi.fn();
    render(<ThemePicker value="eating" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /games/i }));
    expect(onChange).toHaveBeenCalledWith('games');
  });
});
