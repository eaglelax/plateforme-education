import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiBook,
  FiDollarSign,
  FiPlus,
  FiList,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import useAdminAuthStore from '../../stores/adminAuthStore';
import './AdminDashboard.css';

const DEMO_STATS = {
  totalUtilisateurs: 156,
  totalContenus: 45,
  contenusEnValidation: 8,
  revenusMois: 450000,
};

const DEMO_CONTENUS_RECENTS = [
  { id: 1, titre: 'Les lettres de l\'alphabet', statut: 'PUBLIE', dateCreation: new Date() },
  { id: 2, titre: 'Addition et soustraction', statut: 'EN_VALIDATION', dateCreation: new Date() },
  { id: 3, titre: 'Les animaux du Burkina', statut: 'BROUILLON', dateCreation: new Date() },
];

function AdminDashboard() {
  const { user, getRole, isAdmin } = useAdminAuthStore();
  const [stats] = useState(DEMO_STATS);
  const [contenusRecents] = useState(DEMO_CONTENUS_RECENTS);

  const userRole = getRole();
  const hasAdminRole = isAdmin();

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'PUBLIE':
        return <FiCheckCircle className="status-icon success" />;
      case 'EN_VALIDATION':
        return <FiClock className="status-icon warning" />;
      case 'BROUILLON':
        return <FiAlertCircle className="status-icon secondary" />;
      default:
        return null;
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'PUBLIE':
        return 'Publie';
      case 'EN_VALIDATION':
        return 'En validation';
      case 'BROUILLON':
        return 'Brouillon';
      default:
        return statut;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-welcome">
        <div>
          <h1>Bienvenue, {user?.prenom} !</h1>
          <p>Espace d'administration de la plateforme educative</p>
        </div>
        <span className="role-badge">{userRole}</span>
      </div>

      {/* Stats rapides */}
      <div className="admin-stats-grid">
        {hasAdminRole && (
          <div className="admin-stat-card">
            <div className="stat-icon blue">
              <FiUsers />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalUtilisateurs}</span>
              <span className="stat-label">Utilisateurs</span>
            </div>
          </div>
        )}

        <div className="admin-stat-card">
          <div className="stat-icon green">
            <FiBook />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalContenus}</span>
            <span className="stat-label">Contenus</span>
          </div>
        </div>

        <div className="admin-stat-card highlight">
          <div className="stat-icon orange">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.contenusEnValidation}</span>
            <span className="stat-label">En attente</span>
          </div>
        </div>

        {hasAdminRole && (
          <div className="admin-stat-card">
            <div className="stat-icon purple">
              <FiDollarSign />
            </div>
            <div className="stat-info">
              <span className="stat-value">{(stats.revenusMois / 1000).toFixed(0)}k</span>
              <span className="stat-label">FCFA ce mois</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="admin-section">
        <h2>Actions rapides</h2>
        <div className="quick-actions">
          <Link to="/admin/contenus/nouveau" className="quick-action-card">
            <div className="action-icon">
              <FiPlus />
            </div>
            <span>Nouveau contenu</span>
          </Link>

          <Link to="/admin/contenus" className="quick-action-card">
            <div className="action-icon">
              <FiList />
            </div>
            <span>Gerer les contenus</span>
          </Link>

          {hasAdminRole && (
            <Link to="/admin/utilisateurs" className="quick-action-card">
              <div className="action-icon">
                <FiUsers />
              </div>
              <span>Utilisateurs</span>
            </Link>
          )}
        </div>
      </div>

      {/* Contenus recents */}
      <div className="admin-section">
        <div className="section-header">
          <h2>Contenus recents</h2>
          <Link to="/admin/contenus" className="view-all-link">
            Voir tout
          </Link>
        </div>

        <div className="contenus-list">
          {contenusRecents.map((contenu) => (
            <div key={contenu.id} className="contenu-item">
              <div className="contenu-info">
                <strong>{contenu.titre}</strong>
                <span className="contenu-date">
                  {new Date(contenu.dateCreation).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="contenu-status">
                {getStatutIcon(contenu.statut)}
                <span>{getStatutLabel(contenu.statut)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aide */}
      <div className="admin-help-card">
        <h3>Besoin d'aide ?</h3>
        <p>
          Consultez la documentation ou contactez le support technique pour toute
          question concernant la gestion des contenus.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
