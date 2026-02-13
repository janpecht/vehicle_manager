import type { CanvasTool } from '../../types/damage.ts';

interface DamageToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  damageCount: number;
  showRepaired: boolean;
  onShowRepairedChange: (value: boolean) => void;
}

const TOOLS: Array<{ value: CanvasTool; label: string }> = [
  { value: 'CIRCLE', label: 'Circle' },
  { value: 'RECTANGLE', label: 'Rectangle' },
];

export function DamageToolbar({
  activeTool,
  onToolChange,
  damageCount,
  showRepaired,
  onShowRepairedChange,
}: DamageToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.value}
            onClick={() => onToolChange(tool.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTool === tool.value
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-pressed={activeTool === tool.value}
          >
            {tool.label}
          </button>
        ))}
      </div>
      <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
        {damageCount} {damageCount === 1 ? 'damage' : 'damages'}
      </span>
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showRepaired}
          onChange={(e) => onShowRepairedChange(e.target.checked)}
          className="rounded border-gray-300"
        />
        Show Repaired
      </label>
    </div>
  );
}
