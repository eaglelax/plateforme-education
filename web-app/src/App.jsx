import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Styles
import './styles/index.css';

// Components
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages Parent
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Enfants from './pages/Enfants';
import NouvelEnfant from './pages/NouvelEnfant';
import EnfantDetail from './pages/EnfantDetail';
import EnfantParametres from './pages/EnfantParametres';
import ModifierEnfant from './pages/ModifierEnfant';
import Abonnements from './pages/Abonnements';
import Contenus from './pages/Contenus';
import Notifications from './pages/Notifications';

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
            {/* ===== ESPACE PARENT ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="enfants" element={<Enfants />} />
              <Route path="enfants/nouveau" element={<NouvelEnfant />} />
              <Route path="enfants/:id" element={<EnfantDetail />} />
              <Route path="enfants/:id/parametres" element={<EnfantParametres />} />
              <Route path="enfants/:id/modifier" element={<ModifierEnfant />} />
              <Route path="abonnements" element={<Abonnements />} />
              <Route path="contenus" element={<Contenus />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

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
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
