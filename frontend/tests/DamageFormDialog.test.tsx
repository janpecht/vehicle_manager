import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DamageFormDialog } from '../src/components/damage-canvas/DamageFormDialog.tsx';

describe('DamageFormDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    shape: 'CIRCLE' as const,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with circle title', () => {
    render(<DamageFormDialog {...defaultProps} />);
    expect(screen.getByText('Add Circle Damage')).toBeInTheDocument();
  });

  it('should render with rectangle title', () => {
    render(<DamageFormDialog {...defaultProps} shape="RECTANGLE" />);
    expect(screen.getByText('Add Rectangle Damage')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<DamageFormDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Add Circle Damage')).not.toBeInTheDocument();
  });

  it('should default to MEDIUM severity', () => {
    render(<DamageFormDialog {...defaultProps} />);
    const mediumBtn = screen.getByRole('button', { name: 'Medium' });
    expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call onSave with form data on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DamageFormDialog {...defaultProps} onSave={onSave} />);

    await user.type(screen.getByPlaceholderText('Describe the damage...'), 'A big scratch');
    await user.click(screen.getByRole('button', { name: 'High' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith({
      description: 'A big scratch',
      severity: 'HIGH',
    });
  });

  it('should call onClose when clicking cancel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DamageFormDialog {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show loading state on save button', () => {
    render(<DamageFormDialog {...defaultProps} loading={true} />);
    const saveBtn = screen.getByRole('button', { name: /save/i });
    expect(saveBtn).toBeDisabled();
  });
});
