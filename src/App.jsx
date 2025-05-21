
    import React from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import AdminLayout from '@/components/layouts/AdminLayout';
    import ClientLayout from '@/components/layouts/ClientLayout';
    import LoginPage from '@/pages/auth/LoginPage';
    import DashboardPage from '@/pages/admin/DashboardPage';
    import AppointmentsPage from '@/pages/admin/AppointmentsPage';
    import ClientsPage from '@/pages/admin/ClientsPage';
    import FinancialsPage from '@/pages/admin/FinancialsPage';
    import SettingsPage from '@/pages/admin/SettingsPage';
    import ClientBookingPage from '@/pages/public/ClientBookingPage';
    import { Toaster } from '@/components/ui/toaster';
    import authService from '@/services/authService'

    const ProtectedRoute = ({ children }) => {
  // Usa a função isAuthenticated do authService
  if (!authService.isAuthenticated()) { 
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Client-facing routes */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<ClientBookingPage />} /> 
          <Route path="book" element={<ClientBookingPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="financials" element={<FinancialsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        
        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* <Toaster />  // Removido daqui pois os layouts já têm Toaster */}
    </Router>
  );
}

export default App;
  