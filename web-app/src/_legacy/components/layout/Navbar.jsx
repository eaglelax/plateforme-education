import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiCreditCard,
  FiBook,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">E</span>
          <span className="brand-text">Plateforme Educative</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiHome /> <span>Tableau de bord</span>
          </Link>

          <Link
            to="/enfants"
            className={`nav-link ${isActive('/enfants') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiUsers /> <span>Mes Enfants</span>
          </Link>

          <Link
            to="/abonnements"
            className={`nav-link ${isActive('/abonnements') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiCreditCard /> <span>Abonnements</span>
          </Link>

          <Link
            to="/contenus"
            className={`nav-link ${isActive('/contenus') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiBook /> <span>Contenus</span>
          </Link>

          <Link
            to="/notifications"
            className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <FiBell /> <span>Notifications</span>
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-name">{user?.prenom} {user?.nom}</span>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut /> Deconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
