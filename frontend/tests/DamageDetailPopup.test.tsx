import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DamageDetailPopup } from '../src/components/damage-canvas/DamageDetailPopup.tsx';
import type { DamageMarking } from '../src/types/damage.ts';

const activeDamage: DamageMarking = {
  id: 'd1',
  vehicleId: 'v1',
  viewSide: 'LEFT',
  shape: 'CIRCLE',
  x: 0.5,
  y: 0.3,
  width: 0.05,
  height: 0.05,
  description: 'Scratch on door',
  severity: 'MEDIUM',
  createdAt: '2026-01-15T00:00:00Z',
  createdBy: '1',
  repairedAt: null,
  repairedBy: null,
  isActive: true,
};

const repairedDamage: DamageMarking = {
  ...activeDamage,
  id: 'd2',
  isActive: false,
  repairedAt: '2026-02-01T00:00:00Z',
  repairedBy: 'u2',
};

function renderPopup(overrides?: Partial<Parameters<typeof DamageDetailPopup>[0]>) {
  const defaults = {
    open: true,
    onClose: vi.fn(),
    onDelete: vi.fn(),
    onRepair: vi.fn(),
    damage: activeDamage,
    ...overrides,
  };
  return { ...render(<DamageDetailPopup {...defaults} />), props: defaults };
}

describe('DamageDetailPopup', () => {
  it('should render active damage with delete and repair buttons', () => {
    renderPopup();

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark as Repaired' })).toBeInTheDocument();
    expect(screen.getByText('Scratch on door')).toBeInTheDocument();
  });

  it('should render repaired damage with badge and no action buttons', () => {
    renderPopup({ damage: repairedDamage });

    expect(screen.getByText('Repaired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as Repaired' })).not.toBeInTheDocument();
  });

  it('should open repair confirmation when clicking repair button', async () => {
    const user = userEvent.setup();
    renderPopup();

    await user.click(screen.getByRole('button', { name: 'Mark as Repaired' }));

    expect(screen.getByText('Mark this damage as repaired? It will be visually subdued on the canvas.')).toBeInTheDocument();
  });

  it('should call onRepair after confirming repair', async () => {
    const user = userEvent.setup();
    const { props } = renderPopup();

    await user.click(screen.getByRole('button', { name: 'Mark as Repaired' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(props.onRepair).toHaveBeenCalledWith('d1');
  });

  it('should show repairedAt date for repaired damages', () => {
    renderPopup({ damage: repairedDamage });

    expect(screen.getByText(/Repaired:/)).toBeInTheDocument();
  });

  it('should disable buttons when repairLoading is true', () => {
    renderPopup({ repairLoading: true });

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mark as Repaired' })).toBeDisabled();
  });
});
