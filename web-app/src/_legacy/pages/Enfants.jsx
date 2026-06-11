import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSettings, FiChevronRight, FiUser, FiClock, FiBook, FiAward } from 'react-icons/fi';
import { enfantService } from '../services/api';
import './Enfants.css';

function Enfants() {
  const [enfants, setEnfants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnfants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await enfantService.getMesEnfants();
      const data = response.data?.data || [];
      setEnfants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement enfants:', err);
      setError('Impossible de charger les enfants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnfants();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer ce profil ?')) {
      try {
        await enfantService.delete(id);
        setEnfants(enfants.filter((e) => e.id !== id));
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
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

  return (
    <div className="enfants-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Mes Enfants</h1>
          <p>Gerez les profils et suivez la progression de vos enfants</p>
        </div>
        <Link to="/enfants/nouveau" className="btn-primary">
          <FiPlus /> Ajouter un enfant
        </Link>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchEnfants} className="btn-retry">Reessayer</button>
        </div>
      )}

      {enfants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FiUser />
          </div>
          <h3>Aucun enfant enregistre</h3>
          <p>Ajoutez votre premier enfant pour commencer</p>
          <Link to="/enfants/nouveau" className="btn-primary">
            <FiPlus /> Creer un profil
          </Link>
        </div>
      ) : (
        <div className="enfants-list">
          {enfants.map((enfant) => (
            <div key={enfant.id} className="enfant-card">
              <div className="enfant-main">
                <div
                  className="enfant-avatar"
                  style={{ backgroundColor: getAvatarColor(enfant.id) }}
                >
                  {(enfant.nomPseudo || enfant.prenom || '?').charAt(0).toUpperCase()}
                </div>
                <div className="enfant-info">
                  <h3>{enfant.nomPseudo || enfant.prenom || 'Sans nom'}</h3>
                  <span className="enfant-age">{enfant.age || 0} ans</span>
                  {enfant.codeConnexion && (
                    <span className="enfant-code">Code: {enfant.codeConnexion}</span>
                  )}
                </div>
              </div>

              <div className="enfant-stats">
                <div className="stat-item">
                  <FiBook className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{enfant.contenusVus || 0}</span>
                    <span className="stat-label">Contenus</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FiClock className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{Math.round((enfant.tempsTotalMinutes || 0) / 60)}h</span>
                    <span className="stat-label">Temps</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FiAward className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{enfant.badgesCount || 0}</span>
                    <span className="stat-label">Badges</span>
                  </div>
                </div>
              </div>

              <div className="enfant-actions">
                <Link to={`/enfants/${enfant.id}`} className="action-link primary">
                  Voir les statistiques <FiChevronRight />
                </Link>
                <Link to={`/enfants/${enfant.id}/parametres`} className="action-link">
                  <FiSettings /> Parametres
                </Link>
              </div>
            </div>
          ))}

          <Link to="/enfants/nouveau" className="enfant-card add-card">
            <div className="add-content">
              <div className="add-icon">
                <FiPlus />
              </div>
              <span>Ajouter un enfant</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Enfants;
