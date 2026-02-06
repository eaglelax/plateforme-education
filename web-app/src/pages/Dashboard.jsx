import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCreditCard, FiBook, FiClock, FiPlus, FiChevronRight } from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import { enfantService, abonnementService } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuthStore();
  const [enfants, setEnfants] = useState([]);
  const [abonnement, setAbonnement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Charger les enfants
        const enfantsRes = await enfantService.getMesEnfants();
        const enfantsData = enfantsRes.data?.data || [];
        setEnfants(Array.isArray(enfantsData) ? enfantsData : []);

        // Charger les abonnements
        const aboRes = await abonnementService.getMesAbonnements();
        const aboData = aboRes.data?.data || [];
        const actif = Array.isArray(aboData) ? aboData.find(a => a.statut === 'actif' || a.statut === 'ACTIF') : null;
        setAbonnement(actif);

      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Bonjour, {user?.prenom || 'Parent'} 👋</h1>
          <p>Gerez les profils et apprentissages de vos enfants</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiUsers />
          </div>
          <div className="stat-info">
            <span className="stat-number">{enfants.length}</span>
            <span className="stat-label">Enfant{enfants.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${abonnement ? 'green' : 'gray'}`}>
            <FiCreditCard />
          </div>
          <div className="stat-info">
            <span className="stat-number">{abonnement ? '1' : '0'}</span>
            <span className="stat-label">Abonnement</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FiBook />
          </div>
          <div className="stat-info">
            <span className="stat-number">
              {enfants.reduce((acc, e) => acc + (e.contenusCompletes || 0), 0)}
            </span>
            <span className="stat-label">Contenus vus</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-number">
              {Math.round(enfants.reduce((acc, e) => acc + (e.tempsTotalMinutes || 0), 0) / 60)}h
            </span>
            <span className="stat-label">Temps total</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Section Enfants */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Mes Enfants</h2>
            <Link to="/enfants" className="section-link">
              Voir tout <FiChevronRight />
            </Link>
          </div>

          {enfants.length === 0 ? (
            <div className="empty-state">
              <FiUsers className="empty-icon" />
              <h3>Aucun enfant</h3>
              <p>Ajoutez votre premier enfant pour commencer</p>
              <Link to="/enfants/nouveau" className="btn-primary">
                <FiPlus /> Ajouter un enfant
              </Link>
            </div>
          ) : (
            <div className="enfants-grid">
              {enfants.slice(0, 4).map((enfant) => (
                <Link to={`/enfants/${enfant.id}`} key={enfant.id} className="enfant-card">
                  <div
                    className="enfant-avatar"
                    style={{ backgroundColor: getAvatarColor(enfant.id) }}
                  >
                    {(enfant.prenom || enfant.nomPseudo || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="enfant-details">
                    <h4>{enfant.prenom || enfant.nomPseudo}</h4>
                    <span className="enfant-age">{enfant.age || calculerAge(enfant.dateNaissance)} ans</span>
                  </div>
                  <FiChevronRight className="enfant-arrow" />
                </Link>
              ))}

              {enfants.length < 4 && (
                <Link to="/enfants/nouveau" className="enfant-card add-card">
                  <div className="add-icon">
                    <FiPlus />
                  </div>
                  <span>Ajouter</span>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Section Abonnement */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Mon Abonnement</h2>
            <Link to="/abonnements" className="section-link">
              Gerer <FiChevronRight />
            </Link>
          </div>

          {!abonnement ? (
            <div className="empty-state">
              <FiCreditCard className="empty-icon" />
              <h3>Aucun abonnement actif</h3>
              <p>Souscrivez pour acceder aux contenus educatifs</p>
              <Link to="/abonnements" className="btn-primary">
                Voir les offres
              </Link>
            </div>
          ) : (
            <div className="abonnement-card">
              <div className="abo-header">
                <div>
                  <h3>{abonnement.type?.nom || 'Abonnement'}</h3>
                  <span className="abo-status active">Actif</span>
                </div>
              </div>
              <div className="abo-info">
                <div className="abo-detail">
                  <FiClock />
                  <span>
                    Expire le {new Date(abonnement.dateFin).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <section className="quick-actions">
        <Link to="/contenus" className="quick-action">
          <FiBook />
          <span>Catalogue</span>
        </Link>
        <Link to="/enfants/nouveau" className="quick-action">
          <FiPlus />
          <span>Nouvel enfant</span>
        </Link>
        <Link to="/abonnements" className="quick-action">
          <FiCreditCard />
          <span>Abonnements</span>
        </Link>
      </section>
    </div>
  );
}

// Helpers
function getAvatarColor(id) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[(id || 0) % colors.length];
}

function calculerAge(dateNaissance) {
  if (!dateNaissance) return 0;
  const today = new Date();
  const birth = new Date(dateNaissance);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default Dashboard;
