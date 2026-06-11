import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiBook,
  FiUsers,
  FiPieChart,
  FiLogOut,
  FiMenu,
  FiX,
  FiCheckSquare,
  FiCreditCard,
  FiPackage,
  FiFolder,
  FiGrid,
  FiFileText,
  FiBell,
  FiSettings,
  FiSmile,
  FiChevronLeft,
} from 'react-icons/fi';
import { useState } from 'react';
import useAdminAuthStore from '../../stores/adminAuthStore';
import useThemeStore from '../../stores/themeStore';
import AnkaLogo from '../common/AnkaLogo';
import ThemeToggle from '../common/ThemeToggle';
import './AdminLayout.css';

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, getRole, isAdmin } = useAdminAuthStore();
  const initTheme = useThemeStore((s) => s.init);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const userRole = getRole()?.toUpperCase() || '';
  const hasAdminRole = isAdmin();
  const isGestionnaireContenu = userRole === 'GESTIONNAIRE_CONTENU';
  const isValidateur = userRole === 'VALIDATEUR';

  // Admin = lecture seule sur les contenus / pas de creation, pas de validation
  const canViewContent = hasAdminRole || isGestionnaireContenu;
  const canCreateContent = isGestionnaireContenu;
  const canManageDomains = hasAdminRole || isGestionnaireContenu;
  const canViewValidation = hasAdminRole || isValidateur;
  const canValidate = isValidateur;

  const getRoleLabel = () => {
    switch (userRole) {
      case 'ADMIN': return 'Administrateur';
      case 'GESTIONNAIRE_CONTENU': return 'Gestionnaire';
      case 'VALIDATEUR': return 'Validateur';
      default: return userRole;
    }
  };

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`sidebar-link ${isActive(to) ? 'active' : ''}`}
      onClick={() => setMobileOpen(false)}
      title={collapsed ? label : undefined}
    >
      <Icon className="sidebar-link-icon" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <Link to="/admin/dashboard" className="sidebar-brand-link">
            <div className="sidebar-brand-icon">
              <AnkaLogo size={28} />
            </div>
            {!collapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">ANKA</span>
                <span className="sidebar-brand-sub">Administration</span>
              </div>
            )}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Agrandir' : 'Reduire'}
          >
            <FiChevronLeft className={collapsed ? 'rotated' : ''} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            {!collapsed && <span className="sidebar-section-title">General</span>}
            <NavLink to="/admin/dashboard" icon={FiHome} label="Dashboard" />
          </div>

          {canViewContent && (
            <div className="sidebar-section">
              {!collapsed && <span className="sidebar-section-title">Contenus</span>}
              <NavLink to="/admin/contenus" icon={FiBook} label="Tous les contenus" />
              {canCreateContent && <NavLink to="/admin/mes-contenus" icon={FiFolder} label="Mes contenus" />}
              {canManageDomains && <NavLink to="/admin/domaines" icon={FiGrid} label="Domaines" />}
            </div>
          )}

          {canViewValidation && (
            <div className="sidebar-section">
              {!collapsed && <span className="sidebar-section-title">Validation</span>}
              <NavLink to="/admin/validations" icon={FiCheckSquare} label={canValidate ? 'Validations' : 'File de validation'} />
            </div>
          )}

          {hasAdminRole && (
            <div className="sidebar-section">
              {!collapsed && <span className="sidebar-section-title">Gestion</span>}
              <NavLink to="/admin/utilisateurs" icon={FiUsers} label="Utilisateurs" />
              <NavLink to="/admin/enfants" icon={FiSmile} label="Profils enfants" />
              <NavLink to="/admin/abonnements" icon={FiPackage} label="Abonnements" />
              <NavLink to="/admin/paiements" icon={FiCreditCard} label="Paiements" />
            </div>
          )}

          {hasAdminRole && (
            <div className="sidebar-section">
              {!collapsed && <span className="sidebar-section-title">Systeme</span>}
              <NavLink to="/admin/statistiques" icon={FiPieChart} label="Statistiques" />
              <NavLink to="/admin/notifications" icon={FiBell} label="Notifications" />
              <NavLink to="/admin/journal" icon={FiFileText} label="Journal" />
              <NavLink to="/admin/parametres" icon={FiSettings} label="Parametres" />
            </div>
          )}
        </nav>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            {!collapsed && (
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user?.prenom} {user?.nom}</span>
                <span className="sidebar-user-role">{getRoleLabel()}</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Deconnexion">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
          <div className="topbar-right">
            <span className="topbar-role">{getRoleLabel()}</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
