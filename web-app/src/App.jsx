import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Styles
import './styles/index.css';

// Components
import AdminLayout from './components/layout/AdminLayout';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import RoleGuard from './components/common/RoleGuard';

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
              <Route path="contenus/nouveau" element={
                <RoleGuard allowedRoles={['GESTIONNAIRE_CONTENU']} showError>
                  <NouveauContenu />
                </RoleGuard>
              } />
              <Route path="contenus/:id/modifier" element={
                <RoleGuard allowedRoles={['GESTIONNAIRE_CONTENU']} showError>
                  <NouveauContenu />
                </RoleGuard>
              } />
              <Route path="mes-contenus" element={
                <RoleGuard allowedRoles={['GESTIONNAIRE_CONTENU']} showError>
                  <MesContenus />
                </RoleGuard>
              } />
              <Route path="validations" element={
                <RoleGuard allowedRoles={['ADMIN', 'VALIDATEUR']} showError>
                  <Validations />
                </RoleGuard>
              } />
              <Route path="utilisateurs" element={<RoleGuard allowedRoles={['ADMIN']} showError><GestionUtilisateurs /></RoleGuard>} />
              <Route path="abonnements" element={<RoleGuard allowedRoles={['ADMIN']} showError><GestionAbonnements /></RoleGuard>} />
              <Route path="paiements" element={<RoleGuard allowedRoles={['ADMIN']} showError><GestionPaiements /></RoleGuard>} />
              <Route path="statistiques" element={<RoleGuard allowedRoles={['ADMIN']} showError><Statistiques /></RoleGuard>} />
              <Route path="domaines" element={<RoleGuard allowedRoles={['ADMIN', 'GESTIONNAIRE_CONTENU']} showError><GestionDomaines /></RoleGuard>} />
              <Route path="journal" element={<RoleGuard allowedRoles={['ADMIN']} showError><JournalAudit /></RoleGuard>} />
              <Route path="notifications" element={<RoleGuard allowedRoles={['ADMIN']} showError><AdminNotifications /></RoleGuard>} />
              <Route path="parametres" element={<RoleGuard allowedRoles={['ADMIN']} showError><ParametresPlateforme /></RoleGuard>} />
              <Route path="enfants" element={<RoleGuard allowedRoles={['ADMIN']} showError><GestionEnfants /></RoleGuard>} />
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
