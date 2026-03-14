import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { RegisterPage } from './components/auth/RegisterPage.tsx';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { LoadingSpinner } from './components/ui/LoadingSpinner.tsx';
import { Toaster } from './components/ui/Toaster.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { VehicleListPage } from './components/vehicles/VehicleListPage.tsx';
import { VehicleDetailPage } from './components/vehicles/VehicleDetailPage.tsx';
import { DamageReportPage } from './components/vehicles/DamageReportPage.tsx';
import { PublicReportPage } from './components/vehicles/PublicReportPage.tsx';
import { VehicleTypeListPage } from './components/vehicle-types/VehicleTypeListPage.tsx';
import { DriverListPage } from './components/drivers/DriverListPage.tsx';
import { ChecklistListPage } from './components/checklist/ChecklistListPage.tsx';
import { PublicChecklistPage } from './components/checklist/PublicChecklistPage.tsx';
import { DamageReport } from './components/damage-canvas/DamageReport.tsx';
import { useAuthInit } from './hooks/useAuth.ts';

function EmbedWrapper() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <DamageReport vehicleId={id} />;
}

function AppRoutes() {
  const isLoading = useAuthInit();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<VehicleListPage />} />
        <Route path="/vehicle-types" element={<VehicleTypeListPage />} />
        <Route path="/drivers" element={<DriverListPage />} />
        <Route path="/checklists" element={<ChecklistListPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/vehicles/:id/report" element={<DamageReportPage />} />
      </Route>
      {/* Public routes — no login required */}
      <Route path="/report/vehicles/:id" element={<PublicReportPage />} />
      <Route path="/checklist" element={<PublicChecklistPage />} />
      <Route path="/checklist/:vehicleId" element={<PublicChecklistPage />} />
      {/* Embed route — no AppLayout chrome, just the report */}
      <Route
        path="/embed/vehicles/:id"
        element={
          <ProtectedRoute>
            <div className="p-4">
              <EmbedWrapper />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
