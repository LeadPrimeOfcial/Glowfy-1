// App.jsx (Versão para restaurar, baseada na minha sugestão anterior)
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
import authService from '@/services/authService';

const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) { 
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Uma página simples para a rota "/" se você não tiver uma landing page ainda
const LandingPage = () => (
  <div>
    <h1>Bem-vindo ao GLOWFY</h1>
    <p>Selecione um salão ou faça login como administrador.</p>
    {/* Exemplo: <Link to="/espacopriscillaheidericke">Agendar no Espaço Priscilla Heidericke</Link> */}
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="financials" element={<FinancialsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Rota Dinâmica para Empresas */}
        <Route path="/:slugEmpresa" element={<ClientLayout />}>
          <Route index element={<ClientBookingPage />} />
        </Route>

        {/* Rota para a página inicial principal */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<LandingPage />} /> {/* Ou sua página inicial desejada */}
        </Route>

        {/* Fallback - Idealmente uma página 404 dedicada */}
        <Route path="*" element={<Navigate to="/" replace />} /> 
      </Routes>
    </Router>
  );
}
export default App;