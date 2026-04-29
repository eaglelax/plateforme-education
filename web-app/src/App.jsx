import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Styles
import './styles/index.css';

// Components
import AdminLayout from './components/layout/AdminLayout';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import GestionContenus from './pages/admin/GestionContenus';
import NouveauContenu from './pages/admin/NouveauContenu';
import MesContenus from './pages/admin/MesContenus';
import Validations from './pages/admin/Validations';
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs';
import GestionAbonnements from './pages/admin/GestionAbonnements';
import GestionPaiements from './pages/admin/GestionPaiements';
import Statistiques from './pages/admin/Statistiques';
import GestionDomaines from './pages/admin/GestionDomaines';
import JournalAudit from './pages/admin/JournalAudit';
import AdminNotifications from './pages/admin/AdminNotifications';
import ParametresPlateforme from './pages/admin/ParametresPlateforme';
import GestionEnfants from './pages/admin/GestionEnfants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Redirection racine vers admin */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />

            {/* ===== ESPACE ADMINISTRATEUR ===== */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="contenus" element={<GestionContenus />} />
              <Route path="contenus/nouveau" element={<NouveauContenu />} />
              <Route path="contenus/:id/modifier" element={<NouveauContenu />} />
              <Route path="mes-contenus" element={<MesContenus />} />
              <Route path="validations" element={<Validations />} />
              <Route path="utilisateurs" element={<GestionUtilisateurs />} />
              <Route path="abonnements" element={<GestionAbonnements />} />
              <Route path="paiements" element={<GestionPaiements />} />
              <Route path="statistiques" element={<Statistiques />} />
              <Route path="domaines" element={<GestionDomaines />} />
              <Route path="journal" element={<JournalAudit />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="parametres" element={<ParametresPlateforme />} />
              <Route path="enfants" element={<GestionEnfants />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
