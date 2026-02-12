import { describe, it, expect } from 'vitest';
import { getSprinterView, ALL_VIEWS, VIEW_LABELS } from '../src/components/damage-canvas/sprinterSvgPaths.ts';

describe('sprinterSvgPaths', () => {
  it('should export all 4 views', () => {
    expect(ALL_VIEWS).toEqual(['FRONT', 'REAR', 'LEFT', 'RIGHT']);
  });

  it('should have labels for all views', () => {
    expect(VIEW_LABELS.FRONT).toBe('Front');
    expect(VIEW_LABELS.REAR).toBe('Rear');
    expect(VIEW_LABELS.LEFT).toBe('Left Side');
    expect(VIEW_LABELS.RIGHT).toBe('Right Side');
  });

  for (const side of ALL_VIEWS) {
    it(`should return valid view data for ${side}`, () => {
      const view = getSprinterView(side);

      expect(view.viewBox.width).toBeGreaterThan(0);
      expect(view.viewBox.height).toBeGreaterThan(0);
      expect(view.bodyPath).toBeTruthy();
      expect(view.bodyPath).toContain('M');
      expect(view.details.length).toBeGreaterThan(0);
    });
  }

  it('should have wider viewBox for side views than front/rear', () => {
    const left = getSprinterView('LEFT');
    const front = getSprinterView('FRONT');

    expect(left.viewBox.width).toBeGreaterThan(front.viewBox.width);
  });
});
