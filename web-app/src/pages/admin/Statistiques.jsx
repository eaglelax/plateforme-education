import { useState, useEffect } from 'react';
import { FiPieChart, FiUsers, FiBook, FiPackage, FiTrendingUp, FiAlertCircle, FiRefreshCw, FiSmartphone, FiAward, FiBarChart2 } from 'react-icons/fi';
import { adminService } from '../../services/api';
import './AdminPages.css';
import './Statistiques.css';

function Statistiques() {
  const [stats, setStats] = useState(null);
  const [detailedStats, setDetailedStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periode, setPeriode] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, [periode]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes, contenusRes, abosRes, revRes] = await Promise.allSettled([
        adminService.getDashboard(periode),
        adminService.getStats('utilisateurs'),
        adminService.getStats('contenus'),
        adminService.getStats('abonnements'),
        adminService.getStats('revenus'),
      ]);
      // Normalize: API returns data.compteurs.xxx, map to flat stats.xxx
      const raw = dashRes.status === 'fulfilled' ? dashRes.value.data?.data : null;
      const c = raw?.compteurs || {};
      const normalized = raw ? {
        utilisateurs: {
          total: c.utilisateurs?.total || 0,
          parents: c.utilisateurs?.total ? c.utilisateurs.total - (c.enfants?.total || 0) : 0,
          enfants: c.enfants?.total || 0,
        },
        contenus: {
          total: c.contenus?.total || 0,
          publies: c.contenus?.publies || 0,
          en_attente: c.contenus?.total - (c.contenus?.publies || 0) - (c.contenus?.brouillons || 0) || 0,
        },
        abonnements: {
          actifs: c.abonnements?.actifs || 0,
          total: c.abonnements?.total || 0,
          expires: c.abonnements?.expires || 0,
        },
        revenus: {
          total: parseFloat(c.revenus?.total) || 0,
          mois: parseFloat(c.revenus?.moisEnCours) || 0,
        },
        activite: {
          inscriptions_recentes: raw.activiteRecente?.reduce((s, a) => s + (a.inscriptions || 0), 0) || 0,
          abonnements_recents: 0,
          contenus_termines: 0,
          sessions_actives: 0,
        },
        contenus_par_domaine: raw.contenusParDomaine || null,
        abonnements_par_type: raw.abonnementsParType || null,
      } : null;
      setStats(normalized);
      setDetailedStats({
        utilisateurs: usersRes.status === 'fulfilled' ? usersRes.value.data?.data : null,
        contenus: contenusRes.status === 'fulfilled' ? contenusRes.value.data?.data : null,
        abonnements: abosRes.status === 'fulfilled' ? abosRes.value.data?.data : null,
        revenus: revRes.status === 'fulfilled' ? revRes.value.data?.data : null,
      });
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price || 0) + ' FCFA';

  if (loading) {
    return (
      <div className="admin-page statistiques-page">
        <div className="loading-container"><div className="loader"></div><p>Chargement des statistiques...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-page statistiques-page">
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
          <button className="btn btn-secondary" onClick={fetchStats}><FiRefreshCw /></button>
        </div>
      </div>

      {error && (
        <div className="error-alert"><FiAlertCircle /><span>{error}</span></div>
      )}

      {/* Tabs */}
      <div className="mode-selector" style={{ marginBottom: '1.5rem' }}>
        <button className={`mode-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <FiBarChart2 /> Vue d'ensemble
        </button>
        <button className={`mode-btn ${activeTab === 'utilisateurs' ? 'active' : ''}`} onClick={() => setActiveTab('utilisateurs')}>
          <FiUsers /> Utilisateurs
        </button>
        <button className={`mode-btn ${activeTab === 'contenus' ? 'active' : ''}`} onClick={() => setActiveTab('contenus')}>
          <FiBook /> Contenus
        </button>
        <button className={`mode-btn ${activeTab === 'revenus' ? 'active' : ''}`} onClick={() => setActiveTab('revenus')}>
          <FiTrendingUp /> Revenus
        </button>
      </div>

      {/* TAB: Vue d'ensemble */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-overview">
            <div className="stat-card large">
              <div className="stat-icon users"><FiUsers /></div>
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
              <div className="stat-icon content"><FiBook /></div>
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
              <div className="stat-icon subscriptions"><FiPackage /></div>
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
              <div className="stat-icon revenue"><FiTrendingUp /></div>
              <div className="stat-content">
                <h3>Revenus</h3>
                <div className="stat-main">{formatPrice(stats?.revenus?.total)}</div>
                <div className="stat-details">
                  <span>Ce mois: <strong>{formatPrice(stats?.revenus?.mois)}</strong></span>
                </div>
              </div>
            </div>
          </div>

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
                    <div className="domain-progress-bar" style={{ width: `${(domaine.count / (stats?.contenus?.total || 1)) * 100}%`, backgroundColor: domaine.couleur || 'var(--accent)' }} />
                  </div>
                </div>
              )) || <p className="no-data">Aucune donnee disponible</p>}
            </div>
          </div>

          <div className="stats-section">
            <h2>Repartition des abonnements</h2>
            <div className="subscription-types">
              {stats?.abonnements_par_type?.map((type, index) => (
                <div key={index} className="type-stat">
                  <div className="type-name">{type.nom}</div>
                  <div className="type-count">{formatNumber(type.count)}</div>
                  <div className="type-revenue">{formatPrice(type.revenus)}</div>
                </div>
              )) || <p className="no-data">Aucune donnee disponible</p>}
            </div>
          </div>
        </>
      )}

      {/* TAB: Utilisateurs détaillés */}
      {activeTab === 'utilisateurs' && (
        <div className="stats-section">
          <h2>Statistiques utilisateurs detaillees</h2>
          {detailedStats.utilisateurs ? (
            <div className="activity-grid">
              {Object.entries(detailedStats.utilisateurs).map(([key, value]) => (
                <div key={key} className="activity-card">
                  <h4>{key.replace(/_/g, ' ')}</h4>
                  <div className="activity-value">{typeof value === 'number' ? formatNumber(value) : JSON.stringify(value)}</div>
                </div>
              ))}
            </div>
          ) : <p className="no-data">Donnees non disponibles</p>}
        </div>
      )}

      {/* TAB: Contenus détaillés */}
      {activeTab === 'contenus' && (
        <div className="stats-section">
          <h2>Statistiques contenus detaillees</h2>
          {detailedStats.contenus ? (
            <div className="activity-grid">
              {Object.entries(detailedStats.contenus).map(([key, value]) => (
                <div key={key} className="activity-card">
                  <h4>{key.replace(/_/g, ' ')}</h4>
                  <div className="activity-value">
                    {typeof value === 'number' ? formatNumber(value) : Array.isArray(value) ? value.length + ' elements' : JSON.stringify(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="no-data">Donnees non disponibles</p>}
        </div>
      )}

      {/* TAB: Revenus détaillés */}
      {activeTab === 'revenus' && (
        <div className="stats-section">
          <h2>Statistiques revenus detaillees</h2>
          {detailedStats.revenus ? (
            <div className="activity-grid">
              {Object.entries(detailedStats.revenus).map(([key, value]) => (
                <div key={key} className="activity-card">
                  <h4>{key.replace(/_/g, ' ')}</h4>
                  <div className="activity-value">
                    {typeof value === 'number' ? (key.includes('revenu') || key.includes('montant') || key.includes('total') ? formatPrice(value) : formatNumber(value)) : Array.isArray(value) ? value.length + ' elements' : JSON.stringify(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="no-data">Donnees non disponibles</p>}
        </div>
      )}
    </div>
  );
}

export default Statistiques;
