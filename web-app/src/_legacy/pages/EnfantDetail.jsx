import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiClock,
  FiAward,
  FiBookOpen,
  FiTrendingUp,
  FiSettings,
  FiEdit2,
  FiCalendar,
  FiStar,
} from 'react-icons/fi';
import { enfantService, historiqueService } from '../services/api';
import './EnfantDetail.css';

function EnfantDetail() {
  const { id } = useParams();
  const [enfant, setEnfant] = useState(null);
  const [resume, setResume] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [enfantRes, resumeRes, histRes] = await Promise.all([
        enfantService.getById(id),
        historiqueService.getResume(id).catch(() => ({ data: { data: null } })),
        historiqueService.getHistorique(id).catch(() => ({ data: { data: [] } })),
      ]);

      setEnfant(enfantRes.data?.data || enfantRes.data);
      setResume(resumeRes.data?.data || {});
      setHistorique(histRes.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les donnees');
    } finally {
      setLoading(false);
    }
  };

  const formatDuree = (minutes) => {
    if (!minutes) return '0 min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  };

  const getProgressColor = (pourcentage) => {
    if (pourcentage >= 80) return '#10b981';
    if (pourcentage >= 50) return '#FF6B35';
    if (pourcentage >= 25) return '#f59e0b';
    return '#94a3b8';
  };

  const getAvatarColor = (id) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return colors[(id || 0) % colors.length];
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !enfant) {
    return (
      <div className="enfant-detail-page">
        <div className="error-state">
          <h3>{error || 'Enfant non trouve'}</h3>
          <Link to="/enfants" className="btn-primary">Retour a la liste</Link>
        </div>
      </div>
    );
  }

  const stats = {
    tempsTotal: resume?.tempsTotal || 0,
    contenusVus: resume?.contenusVus || 0,
    badgesObtenus: resume?.badgesObtenus || 0,
    xpTotal: resume?.xpTotal || 0,
    progressionGlobale: resume?.progressionGlobale || 0,
    tempsParJour: resume?.tempsParJour || [],
    progressionDomaines: resume?.progressionDomaines || [],
  };

  const maxMinutes = Math.max(...(stats.tempsParJour.map((d) => d.minutes) || [60]), 60);

  return (
    <div className="enfant-detail-page">
      <header className="detail-header">
        <Link to="/enfants" className="btn-back">
          <FiArrowLeft /> Retour
        </Link>
        <div className="header-actions">
          <Link to={`/enfants/${id}/parametres`} className="btn-outline">
            <FiSettings /> Parametres
          </Link>
          <Link to={`/enfants/${id}/modifier`} className="btn-outline">
            <FiEdit2 /> Modifier
          </Link>
        </div>
      </header>

      <div className="profile-card">
        <div
          className="profile-avatar"
          style={{ backgroundColor: getAvatarColor(enfant.id) }}
        >
          {(enfant.nomPseudo || enfant.prenom || '?').charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1>{enfant.nomPseudo || enfant.prenom}</h1>
          <span className="profile-age">{enfant.age || 0} ans</span>
          {enfant.codeConnexion && (
            <span className="profile-code">Code: {enfant.codeConnexion}</span>
          )}
        </div>
        <div className="profile-xp">
          <FiStar />
          <span>{stats.xpTotal} XP</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiClock className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{formatDuree(stats.tempsTotal)}</span>
            <span className="stat-label">Temps total</span>
          </div>
        </div>
        <div className="stat-card">
          <FiBookOpen className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.contenusVus}</span>
            <span className="stat-label">Contenus vus</span>
          </div>
        </div>
        <div className="stat-card">
          <FiAward className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.badgesObtenus}</span>
            <span className="stat-label">Badges</span>
          </div>
        </div>
        <div className="stat-card">
          <FiTrendingUp className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.progressionGlobale}%</span>
            <span className="stat-label">Progression</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {stats.tempsParJour.length > 0 && (
          <section className="detail-section">
            <h2><FiClock /> Temps d'utilisation</h2>
            <div className="chart-temps">
              {stats.tempsParJour.map((jour, index) => (
                <div key={index} className="bar-container">
                  <div
                    className="bar"
                    style={{
                      height: `${(jour.minutes / maxMinutes) * 100}%`,
                    }}
                  >
                    <span className="bar-value">{jour.minutes}m</span>
                  </div>
                  <span className="bar-label">{jour.jour}</span>
                </div>
              ))}
            </div>
            <div className="chart-total">
              Total: <strong>{formatDuree(stats.tempsTotal)}</strong>
            </div>
          </section>
        )}

        {stats.progressionDomaines.length > 0 && (
          <section className="detail-section">
            <h2><FiTrendingUp /> Progression par domaine</h2>
            <div className="domaines-list">
              {stats.progressionDomaines.map((domaine, index) => (
                <div key={index} className="domaine-item">
                  <div className="domaine-header">
                    <span className="domaine-nom">{domaine.nom}</span>
                    <span className="domaine-pct">{domaine.progression}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${domaine.progression}%`,
                        backgroundColor: getProgressColor(domaine.progression),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="detail-section activites-section">
        <h2><FiCalendar /> Activites recentes</h2>
        {historique.length === 0 ? (
          <div className="empty-activites">
            <p>Aucune activite enregistree pour le moment</p>
          </div>
        ) : (
          <div className="activites-list">
            {historique.slice(0, 10).map((activite, index) => (
              <div key={index} className="activite-item">
                <div className="activite-icon">
                  <FiBookOpen />
                </div>
                <div className="activite-info">
                  <h4>{activite.contenu?.titre || 'Contenu'}</h4>
                  <p>
                    {activite.contenu?.domaine?.nom || 'Domaine'} - {formatDuree(activite.dureeMinutes)}
                  </p>
                </div>
                <div className="activite-meta">
                  <span className="activite-date">
                    {new Date(activite.dateConsultation).toLocaleDateString('fr-FR')}
                  </span>
                  {activite.scoreQuiz && (
                    <span className="activite-score">
                      <FiStar /> {activite.scoreQuiz}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default EnfantDetail;
