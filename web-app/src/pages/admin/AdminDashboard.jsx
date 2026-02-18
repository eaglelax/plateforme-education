import { useState, useEffect } from 'react';
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
import { contenuService, adminService, validationService, gestionContenuService } from '../../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const { user, getRole, isAdmin } = useAdminAuthStore();
  const [stats, setStats] = useState({
    totalUtilisateurs: 0,
    totalContenus: 0,
    contenusEnValidation: 0,
    revenusMois: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [contenusRecents, setContenusRecents] = useState([]);
  const [loadingContenus, setLoadingContenus] = useState(true);

  const userRole = getRole();
  const hasAdminRole = isAdmin();

  // Charger les statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        if (hasAdminRole) {
          // Admin: utiliser l'endpoint admin/dashboard
          const [dashRes, validRes] = await Promise.allSettled([
            adminService.getDashboard(),
            validationService.getStats(),
          ]);
          const data = dashRes.status === 'fulfilled' ? dashRes.value.data?.data : null;
          const validData = validRes.status === 'fulfilled' ? validRes.value.data?.data : null;
          if (data) {
            setStats({
              totalUtilisateurs: data.compteurs?.utilisateurs?.total || 0,
              totalContenus: data.compteurs?.contenus?.total || 0,
              contenusEnValidation: validData?.enAttente || 0,
              revenusMois: data.compteurs?.revenus?.moisEnCours || 0,
            });
          }
        } else if (userRole?.toUpperCase() === 'VALIDATEUR') {
          // Validateur: utiliser stats-validation
          const response = await validationService.getStats();
          const data = response.data?.data;
          if (data) {
            setStats({
              totalUtilisateurs: 0,
              totalContenus: data.publies || 0,
              contenusEnValidation: data.enAttente || 0,
              revenusMois: 0,
            });
          }
        } else if (userRole?.toUpperCase() === 'GESTIONNAIRE_CONTENU') {
          // Gestionnaire: utiliser mes-contenus qui retourne des stats
          const response = await gestionContenuService.getMesContenus();
          const data = response.data;
          const statsData = data?.stats || {};
          const total = data?.pagination?.total || 0;
          setStats({
            totalUtilisateurs: 0,
            totalContenus: total,
            contenusEnValidation: (statsData.en_attente || 0) + (statsData.a_amender || 0),
            revenusMois: 0,
          });
        }
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [hasAdminRole, userRole]);

  // Charger les contenus recents depuis l'API
  useEffect(() => {
    const fetchContenusRecents = async () => {
      setLoadingContenus(true);
      try {
        const response = await contenuService.getAllAdmin({ limit: 5 });
        const data = response.data?.data || response.data || [];
        setContenusRecents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur chargement contenus recents:', error);
        setContenusRecents([]);
      } finally {
        setLoadingContenus(false);
      }
    };

    fetchContenusRecents();
  }, []);

  const getStatutConfig = (statut) => {
    const s = statut?.toLowerCase();
    const configs = {
      publie: { icon: <FiCheckCircle className="status-icon success" />, label: 'Publie' },
      en_attente: { icon: <FiClock className="status-icon warning" />, label: 'En attente' },
      brouillon: { icon: <FiAlertCircle className="status-icon secondary" />, label: 'Brouillon' },
      valide: { icon: <FiCheckCircle className="status-icon success" />, label: 'Valide' },
      a_amender: { icon: <FiAlertCircle className="status-icon danger" />, label: 'A amender' },
      rejete: { icon: <FiAlertCircle className="status-icon danger" />, label: 'Rejete' },
      archive: { icon: <FiAlertCircle className="status-icon secondary" />, label: 'Archive' },
    };
    return configs[s] || { icon: null, label: statut || '-' };
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
              <span className="stat-value">
                {loadingStats ? '...' : stats.totalUtilisateurs}
              </span>
              <span className="stat-label">Utilisateurs</span>
            </div>
          </div>
        )}

        <Link
          to={userRole?.toUpperCase() === 'GESTIONNAIRE_CONTENU' ? '/admin/mes-contenus' : '/admin/contenus'}
          className="admin-stat-card clickable"
        >
          <div className="stat-icon green">
            <FiBook />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {loadingStats ? '...' : stats.totalContenus}
            </span>
            <span className="stat-label">
              {userRole?.toUpperCase() === 'GESTIONNAIRE_CONTENU' ? 'Mes contenus' : 'Contenus'}
            </span>
          </div>
        </Link>

        <Link
          to={userRole?.toUpperCase() === 'VALIDATEUR' ? '/admin/validations' : '/admin/contenus'}
          className="admin-stat-card highlight clickable"
        >
          <div className="stat-icon orange">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {loadingStats ? '...' : stats.contenusEnValidation}
            </span>
            <span className="stat-label">
              {userRole?.toUpperCase() === 'VALIDATEUR' ? 'A valider' : 'En attente'}
            </span>
          </div>
        </Link>

        {hasAdminRole && (
          <div className="admin-stat-card">
            <div className="stat-icon purple">
              <FiDollarSign />
            </div>
            <div className="stat-info">
              <span className="stat-value">
                {loadingStats ? '...' : `${(stats.revenusMois / 1000).toFixed(0)}k`}
              </span>
              <span className="stat-label">FCFA ce mois</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="admin-section">
        <h2>Actions rapides</h2>
        <div className="quick-actions">
          {/* Bug A: Masquer "Nouveau contenu" pour le validateur */}
          {(userRole?.toUpperCase() === 'GESTIONNAIRE_CONTENU' || hasAdminRole) && (
            <Link to="/admin/contenus/nouveau" className="quick-action-card">
              <div className="action-icon">
                <FiPlus />
              </div>
              <span>Nouveau contenu</span>
            </Link>
          )}

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
          {loadingContenus ? (
            <div className="loading-contenus">
              <div className="loader small"></div>
              <span>Chargement...</span>
            </div>
          ) : contenusRecents.length === 0 ? (
            <div className="empty-contenus">
              <span>Aucun contenu recent</span>
            </div>
          ) : (
            contenusRecents.map((contenu) => {
              const cfg = getStatutConfig(contenu.statut);
              return (
                <div key={contenu.id} className="contenu-item">
                  <div className="contenu-info">
                    <strong>{contenu.titre}</strong>
                    <span className="contenu-date">
                      {new Date(contenu.date_creation || contenu.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="contenu-status">
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </div>
                </div>
              );
            })
          )}
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
