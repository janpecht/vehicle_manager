import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button.tsx';
import { DamageReport } from '../damage-canvas/DamageReport.tsx';

export function DamageReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="secondary" onClick={() => navigate(`/vehicles/${id}`)}>
          &larr; Back to Vehicle
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <DamageReport vehicleId={id} />
    </div>
  );
}
