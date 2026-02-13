import { SeverityBadge } from '../ui/SeverityBadge.tsx';
import { VIEW_LABELS } from './sprinterSvgPaths.ts';
import type { DamageMarking } from '../../types/damage.ts';

interface DamageTableProps {
  damages: DamageMarking[];
  showStatus?: boolean;
  locale?: string;
  translateShape?: (shape: string) => string;
}

export function DamageTable({
  damages,
  showStatus = false,
  locale,
  translateShape,
}: DamageTableProps) {
  if (damages.length === 0) return null;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale);

  const renderShape = (shape: string) =>
    translateShape ? translateShape(shape) : shape;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-gray-500">
            <th className="pb-2 pr-4">{locale === 'de-DE' ? 'Ansicht' : 'View'}</th>
            <th className="pb-2 pr-4">{locale === 'de-DE' ? 'Form' : 'Shape'}</th>
            <th className="pb-2 pr-4">{locale === 'de-DE' ? 'Schwere' : 'Severity'}</th>
            <th className="pb-2 pr-4">{locale === 'de-DE' ? 'Beschreibung' : 'Description'}</th>
            {showStatus && <th className="pb-2 pr-4">Status</th>}
            <th className="pb-2">{locale === 'de-DE' ? 'Datum' : 'Date'}</th>
          </tr>
        </thead>
        <tbody>
          {damages.map((damage) => (
            <tr key={damage.id} className="border-b last:border-0">
              <td className="py-2 pr-4">{VIEW_LABELS[damage.viewSide]}</td>
              <td className="py-2 pr-4">{renderShape(damage.shape)}</td>
              <td className="py-2 pr-4">
                <SeverityBadge severity={damage.severity} />
              </td>
              <td className="py-2 pr-4 max-w-48 truncate">{damage.description ?? '\u2014'}</td>
              {showStatus && (
                <td className="py-2 pr-4">
                  {damage.isActive ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-gray-400">Repaired</span>
                  )}
                </td>
              )}
              <td className="py-2 text-gray-500">{formatDate(damage.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
