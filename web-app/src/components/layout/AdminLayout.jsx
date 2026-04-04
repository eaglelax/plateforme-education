import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiBook,
  FiPlusCircle,
  FiUsers,
  FiPieChart,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiCheckSquare,
  FiCreditCard,
  FiPackage,
  FiFolder,
  FiGrid,
  FiFileText,
  FiBell,
} from 'react-icons/fi';
import { useState } from 'react';
import useAdminAuthStore from '../../stores/adminAuthStore';
import './AdminLayout.css';

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, getRole, isAdmin } = useAdminAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const userRole = getRole()?.toUpperCase() || '';
  const hasAdminRole = isAdmin();
  const isValidateur = userRole === 'VALIDATEUR';
  const isGestionnaireContenu = userRole === 'GESTIONNAIRE_CONTENU';

  // Determiner les acces selon le role
  const canManageContent = hasAdminRole || isGestionnaireContenu;
  const canValidate = hasAdminRole || isValidateur;
  const canViewUsers = hasAdminRole || isValidateur;
  const canViewStats = hasAdminRole;
  const canViewPayments = hasAdminRole;
  const canViewSubscriptions = hasAdminRole;

  return (
    <div className="admin-layout">
      <nav className="admin-navbar">
        <div className="admin-navbar-container">
          <Link to="/admin/dashboard" className="admin-brand">
            <div className="admin-brand-icon">
              <FiShield />
            </div>
            <div className="admin-brand-text">
              <span className="brand-title">Administration</span>
              <span className="brand-subtitle">Plateforme Educative</span>
            </div>
          </Link>

          <button className="admin-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <div className={`admin-navbar-menu ${menuOpen ? 'active' : ''}`}>
            <Link
              to="/admin/dashboard"
              className={`admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <FiHome /> <span>Dashboard</span>
            </Link>

            {/* Gestion des contenus - Admin et Gestionnaire de contenu */}
            {canManageContent && (
              <>
                <Link
                  to="/admin/contenus"
                  className={`admin-nav-link ${isActive('/admin/contenus') && !location.pathname.includes('nouveau') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <FiBook /> <span>Contenus</span>
                </Link>

                <Link
                  to="/admin/mes-contenus"
                  className={`admin-nav-link ${isActive('/admin/mes-contenus') || isActive('/admin/contenus/nouveau') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <FiFolder /> <span>Mes Contenus</span>
                </Link>
              </>
            )}

            {/* Validation - Admin et Validateur */}
            {canValidate && (
              <Link
                to="/admin/validations"
                className={`admin-nav-link ${isActive('/admin/validations') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiCheckSquare /> <span>Validations</span>
              </Link>
            )}

            {/* Gestion des utilisateurs - Admin uniquement */}
            {canViewUsers && (
              <Link
                to="/admin/utilisateurs"
                className={`admin-nav-link ${isActive('/admin/utilisateurs') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiUsers /> <span>Utilisateurs</span>
              </Link>
            )}

            {/* Gestion des abonnements - Admin uniquement */}
            {canViewSubscriptions && (
              <Link
                to="/admin/abonnements"
                className={`admin-nav-link ${isActive('/admin/abonnements') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiPackage /> <span>Abonnements</span>
              </Link>
            )}

            {/* Gestion des paiements - Admin uniquement */}
            {canViewPayments && (
              <Link
                to="/admin/paiements"
                className={`admin-nav-link ${isActive('/admin/paiements') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiCreditCard /> <span>Paiements</span>
              </Link>
            )}

            {/* Domaines - Admin uniquement */}
            {hasAdminRole && (
              <Link
                to="/admin/domaines"
                className={`admin-nav-link ${isActive('/admin/domaines') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiGrid /> <span>Domaines</span>
              </Link>
            )}

            {/* Statistiques - Admin uniquement */}
            {canViewStats && (
              <Link
                to="/admin/statistiques"
                className={`admin-nav-link ${isActive('/admin/statistiques') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <FiPieChart /> <span>Statistiques</span>
              </Link>
            )}

            {/* Notifications + Journal - Admin uniquement */}
            {hasAdminRole && (
              <>
                <Link
                  to="/admin/notifications"
                  className={`admin-nav-link ${isActive('/admin/notifications') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  title="Notifications"
                >
                  <FiBell /> <span>Notifs</span>
                </Link>
                <Link
                  to="/admin/journal"
                  className={`admin-nav-link ${isActive('/admin/journal') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  title="Journal d'audit"
                >
                  <FiFileText /> <span>Journal</span>
                </Link>
              </>
            )}
          </div>

          <div className="admin-navbar-user">
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.prenom} {user?.nom}</span>
              <span className="admin-user-role">{userRole}</span>
            </div>
            <button className="admin-btn-logout" onClick={handleLogout}>
              <FiLogOut />
            </button>
          </div>
        </div>
      </nav>

      <main className="admin-main-content">
        <Outlet />
      </main>

      <footer className="admin-footer">
        <p>&copy; 2024 Plateforme Educative Burkina Faso - Administration</p>
      </footer>
    </div>
  );
}

export default AdminLayout;
