import { useState, useEffect } from 'react';
import { FiPieChart, FiUsers, FiBook, FiPackage, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { adminService } from '../../services/api';
import './AdminPages.css';
import './Statistiques.css';

function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periode, setPeriode] = useState('30');

  useEffect(() => {
    fetchStats();
  }, [periode]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDashboard();
      setStats(response.data?.data || null);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price || 0) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiPieChart className="header-icon" />
          <div>
            <h1>Statistiques</h1>
            <p>Vue d'ensemble des performances de la plateforme</p>
          </div>
        </div>

        <div className="header-actions">
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">Cette annee</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Vue d'ensemble */}
      <div className="stats-overview">
        <div className="stat-card large">
          <div className="stat-icon users">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Utilisateurs</h3>
            <div className="stat-main">{formatNumber(stats?.utilisateurs?.total)}</div>
            <div className="stat-details">
              <span><strong>{formatNumber(stats?.utilisateurs?.parents)}</strong> parents</span>
              <span><strong>{formatNumber(stats?.utilisateurs?.enfants)}</strong> enfants</span>
            </div>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon content">
            <FiBook />
          </div>
          <div className="stat-content">
            <h3>Contenus</h3>
            <div className="stat-main">{formatNumber(stats?.contenus?.total)}</div>
            <div className="stat-details">
              <span><strong>{formatNumber(stats?.contenus?.publies)}</strong> publies</span>
              <span><strong>{formatNumber(stats?.contenus?.en_attente)}</strong> en attente</span>
            </div>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon subscriptions">
            <FiPackage />
          </div>
          <div className="stat-content">
            <h3>Abonnements</h3>
            <div className="stat-main">{formatNumber(stats?.abonnements?.actifs)}</div>
            <div className="stat-details">
              <span><strong>{formatNumber(stats?.abonnements?.total)}</strong> total</span>
              <span><strong>{formatNumber(stats?.abonnements?.expires)}</strong> expires</span>
            </div>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon revenue">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>Revenus</h3>
            <div className="stat-main">{formatPrice(stats?.revenus?.total)}</div>
            <div className="stat-details">
              <span>Ce mois: <strong>{formatPrice(stats?.revenus?.mois)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Utilisateurs recents */}
      <div className="stats-section">
        <h2>Activite recente</h2>
        <div className="activity-grid">
          <div className="activity-card">
            <h4>Nouvelles inscriptions</h4>
            <div className="activity-value">{formatNumber(stats?.activite?.inscriptions_recentes)}</div>
            <p>ces {periode} derniers jours</p>
          </div>

          <div className="activity-card">
            <h4>Nouveaux abonnements</h4>
            <div className="activity-value">{formatNumber(stats?.activite?.abonnements_recents)}</div>
            <p>ces {periode} derniers jours</p>
          </div>

          <div className="activity-card">
            <h4>Contenus termines</h4>
            <div className="activity-value">{formatNumber(stats?.activite?.contenus_termines)}</div>
            <p>ces {periode} derniers jours</p>
          </div>

          <div className="activity-card">
            <h4>Sessions actives</h4>
            <div className="activity-value">{formatNumber(stats?.activite?.sessions_actives)}</div>
            <p>aujourd'hui</p>
          </div>
        </div>
      </div>

      {/* Section: Repartition par domaine */}
      <div className="stats-section">
        <h2>Repartition des contenus par domaine</h2>
        <div className="domain-stats">
          {stats?.contenus_par_domaine?.map((domaine, index) => (
            <div key={index} className="domain-bar">
              <div className="domain-info">
                <span className="domain-name">{domaine.nom}</span>
                <span className="domain-count">{domaine.count} contenus</span>
              </div>
              <div className="domain-progress">
                <div
                  className="domain-progress-bar"
                  style={{
                    width: `${(domaine.count / (stats?.contenus?.total || 1)) * 100}%`,
                    backgroundColor: domaine.couleur || '#6366f1'
                  }}
                />
              </div>
            </div>
          )) || (
              <p className="no-data">Aucune donnee disponible</p>
            )}
        </div>
      </div>

      {/* Section: Types d'abonnements */}
      <div className="stats-section">
        <h2>Repartition des abonnements</h2>
        <div className="subscription-types">
          {stats?.abonnements_par_type?.map((type, index) => (
            <div key={index} className="type-stat">
              <div className="type-name">{type.nom}</div>
              <div className="type-count">{formatNumber(type.count)}</div>
              <div className="type-revenue">{formatPrice(type.revenus)}</div>
            </div>
          )) || (
              <p className="no-data">Aucune donnee disponible</p>
            )}
        </div>
      </div>
    </div>
  );
}

export default Statistiques;
