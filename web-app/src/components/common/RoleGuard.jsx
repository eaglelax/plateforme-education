import { Navigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import useAdminAuthStore from '../../stores/adminAuthStore';

/**
 * Bloque l'acces a une route selon le role de l'utilisateur connecte.
 *
 * Props:
 * - allowedRoles: liste des roles autorises (ex: ['GESTIONNAIRE_CONTENU'])
 * - children: contenu a afficher si autorise
 * - redirectTo: URL de redirection si refuse (defaut: /admin/dashboard)
 * - showError: si true, affiche une page d'erreur a la place de rediriger
 */
function RoleGuard({ allowedRoles = [], children, redirectTo = '/admin/dashboard', showError = false }) {
  const { getRole } = useAdminAuthStore();
  const userRole = getRole()?.toUpperCase() || '';

  if (!allowedRoles.includes(userRole)) {
    if (showError) {
      return (
        <div className="admin-page" style={{ padding: '3rem 1rem' }}>
          <div style={{
            maxWidth: 520,
            margin: '0 auto',
            background: 'white',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '2rem',
            textAlign: 'center'
          }}>
            <FiLock size={48} style={{ color: '#DC2626', marginBottom: '1rem' }} />
            <h2 style={{ marginTop: 0, color: '#1F2937' }}>Acces non autorise</h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Cette section est reservee aux roles : <strong>{allowedRoles.join(', ')}</strong>.
              Votre role actuel <strong>{userRole}</strong> n'a pas cette permission.
            </p>
            <a href="/admin/dashboard" className="btn btn-primary">Retour au tableau de bord</a>
          </div>
        </div>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default RoleGuard;
