import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RequestAccessPage } from '../pages/auth/RequestAccessPage';
import { EmployeePortalPage } from '../pages/employee/EmployeePortalPage';
import { TransportRequestsPage } from '../features/requests/pages/TransportRequestsPage';
import { EmployeeAccountsPage } from '../features/employeeAccounts/pages/EmployeeAccountsPage';
import { DashboardOverviewPage } from '../pages/dashboard/DashboardOverviewPage';
import { VehiclesListPage } from '../pages/vehicles/VehiclesListPage';
import { VehicleDetailPage } from '../pages/vehicles/VehicleDetailPage';
import { DriversListPage } from '../pages/drivers/DriversListPage';
import { DriverDetailPage } from '../pages/drivers/DriverDetailPage';
import { DispatchDashboardPage } from '../features/trips/pages/DispatchDashboardPage';
import { ActiveTripsPage } from '../features/trips/pages/ActiveTripsPage';
import { TripDetailsPage } from '../features/trips/pages/TripDetailsPage';
import { DriverPortalPage } from '../pages/driver/DriverPortalPage';
import { MaintenancePage } from '../pages/maintenance/MaintenancePage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { GpsMapPage } from '../pages/gps/GpsMapPage';
import { DesignShowcasePage } from '../pages/dashboard/DesignShowcasePage';

// ─── Protected Route Guard ───────────────────────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save the attempted URL so we can redirect back post-login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access: if roles specified, check the user has permission
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Operators trying to reach admin pages → redirect to driver portal
    if (user.role === 'operator') {
      return <Navigate to="/driver" replace />;
    }
    if (user.role === 'employee') {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ─── Main Route Config ───────────────────────────────────────────────────────
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/request-access" element={<RequestAccessPage />} />

      {/* ─── Driver Portal (mobile-first, no sidebar layout) ─── */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['operator', 'dispatcher', 'admin']}>
            <DriverPortalPage />
          </ProtectedRoute>
        }
      />

      {/* ─── Employee Portal (mobile-first, no sidebar layout) ─── */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['employee', 'dispatcher', 'admin']}>
            <EmployeePortalPage />
          </ProtectedRoute>
        }
      />

      {/* ─── Admin / Dispatcher Command Center (Protected) ─── */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['dispatcher', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect /dashboard index to overview */}
        <Route path="dashboard" element={<DashboardOverviewPage />} />

        {/* Vehicles */}
        <Route path="vehicles" element={<VehiclesListPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />

        {/* Drivers */}
        <Route path="drivers" element={<DriversListPage />} />
        <Route path="drivers/:id" element={<DriverDetailPage />} />

        {/* Trips & Dispatch */}
        <Route path="trips" element={<DispatchDashboardPage />} />
        <Route path="trips/active" element={<ActiveTripsPage />} />
        <Route path="trips/:id" element={<TripDetailsPage />} />

        {/* Employee Transport Requests & Account Approvals */}
        <Route path="requests" element={<TransportRequestsPage />} />
        <Route path="employee-accounts" element={<EmployeeAccountsPage />} />

        {/* GPS Live Map */}
        <Route path="gps" element={<GpsMapPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* ─── Living design-system reference page (standalone, no sidebar) ─── */}
      <Route
        path="/design-showcase"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DesignShowcasePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
