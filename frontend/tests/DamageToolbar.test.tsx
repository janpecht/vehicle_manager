import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DamageToolbar } from '../src/components/damage-canvas/DamageToolbar.tsx';

function renderToolbar(overrides?: Partial<Parameters<typeof DamageToolbar>[0]>) {
  const defaults = {
    activeTool: 'CIRCLE' as const,
    onToolChange: vi.fn(),
    damageCount: 0,
    showRepaired: false,
    onShowRepairedChange: vi.fn(),
    ...overrides,
  };
  return { ...render(<DamageToolbar {...defaults} />), props: defaults };
}

describe('DamageToolbar', () => {
  it('should render Circle and Rectangle tool buttons', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'Circle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rectangle' })).toBeInTheDocument();
  });

  it('should show active state for selected tool', () => {
    renderToolbar({ activeTool: 'CIRCLE' });

    expect(screen.getByRole('button', { name: 'Circle' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call onToolChange when clicking a tool', async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.click(screen.getByRole('button', { name: 'Rectangle' }));
    expect(props.onToolChange).toHaveBeenCalledWith('RECTANGLE');
  });

  it('should display damage count with singular text', () => {
    renderToolbar({ damageCount: 1 });
    expect(screen.getByText('1 damage')).toBeInTheDocument();
  });

  it('should display damage count with plural text', () => {
    renderToolbar({ damageCount: 5 });
    expect(screen.getByText('5 damages')).toBeInTheDocument();
  });

  it('should render show repaired checkbox', () => {
    renderToolbar();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Show Repaired')).toBeInTheDocument();
  });

  it('should call onShowRepairedChange when toggling checkbox', async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.click(screen.getByRole('checkbox'));
    expect(props.onShowRepairedChange).toHaveBeenCalledWith(true);
  });

  it('should reflect checked state of showRepaired', () => {
    renderToolbar({ showRepaired: true });
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
