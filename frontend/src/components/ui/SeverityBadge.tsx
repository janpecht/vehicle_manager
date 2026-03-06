import type { Severity } from '../../types/damage.ts';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../../types/damage.ts';

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: SEVERITY_COLORS[severity] }}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
