import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiSend,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiEye,
  FiUpload,
  FiFile,
  FiVideo,
  FiMusic,
  FiFileText,
  FiPlay,
  FiHelpCircle,
  FiRefreshCw,
  FiLayers,
} from 'react-icons/fi';
import { gestionContenuService, contenuService } from '../../services/api';
import './MesContenus.css';

const TYPE_ICONS = {
  video: FiVideo,
  audio: FiMusic,
  document: FiFileText,
  quiz: FiHelpCircle,
  jeu: FiPlay,
  activite: FiFile,
};

const STATUT_CONFIG = {
  brouillon: {
    label: 'Brouillons',
    icon: FiEdit2,
    color: 'secondary',
    description: 'Contenus en cours de creation',
  },
  en_attente: {
    label: 'En attente',
    icon: FiClock,
    color: 'warning',
    description: 'En attente de validation',
  },
  a_amender: {
    label: 'A amender',
    icon: FiAlertTriangle,
    color: 'danger',
    description: 'Modifications demandees',
  },
  valide: {
    label: 'Valides',
    icon: FiCheckCircle,
    color: 'success',
    description: 'Prets a publier',
  },
  publie: {
    label: 'Publies',
    icon: FiUpload,
    color: 'info',
    description: 'Visibles par les enfants',
  },
};

function MesContenus() {
  const [contenus, setContenus] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tous');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await gestionContenuService.getMesContenus();
      setContenus(response.data?.data || []);
      setStats(response.data?.stats || {});
    } catch (err) {
      setError('Erreur lors du chargement des contenus');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSoumettre = async (id) => {
    if (!confirm('Soumettre ce contenu pour validation ?')) return;
    setActionLoading(id);
    try {
      await gestionContenuService.soumettre(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublier = async (id) => {
    if (!confirm('Publier ce contenu ?')) return;
    setActionLoading(id);
    try {
      await gestionContenuService.publier(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSupprimer = async (id) => {
    if (!confirm('Supprimer ce contenu ? Cette action est irreversible.')) return;
    setActionLoading(id);
    try {
      await contenuService.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const getFilteredContenus = () => {
    if (activeTab === 'tous') return contenus;
    return contenus.filter((c) => c.statut === activeTab);
  };

  const getTypeIcon = (type) => {
    const Icon = TYPE_ICONS[type] || FiFile;
    return <Icon />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mes-contenus-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement de vos contenus...</p>
        </div>
      </div>
    );
  }

  const filteredContenus = getFilteredContenus();

  return (
    <div className="mes-contenus-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1>Mes Contenus</h1>
          <p>Gerez vos contenus educatifs</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchData} title="Rafraichir">
            <FiRefreshCw />
          </button>
          <Link to="/admin/contenus/nouveau" className="btn btn-primary">
            <FiPlus /> Nouveau contenu
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertTriangle />
          <span>{error}</span>
          <button onClick={() => setError('')}>Fermer</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-cards">
        <button
          className={`stat-card ${activeTab === 'tous' ? 'active' : ''}`}
          onClick={() => setActiveTab('tous')}
        >
          <FiLayers className="stat-icon" />
          <span className="stat-value">{contenus.length}</span>
          <span className="stat-label">Total</span>
        </button>
        {Object.entries(STATUT_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = stats[key] || 0;
          return (
            <button
              key={key}
              className={`stat-card ${config.color} ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon className="stat-icon" />
              <span className="stat-value">{count}</span>
              <span className="stat-label">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content List */}
      <div className="contenus-section">
        <h2>
          {activeTab === 'tous' ? 'Tous les contenus' : STATUT_CONFIG[activeTab]?.label}
          <span className="count">({filteredContenus.length})</span>
        </h2>

        {filteredContenus.length === 0 ? (
          <div className="empty-state">
            <FiFile size={48} />
            <p>Aucun contenu {activeTab !== 'tous' ? `en statut "${STATUT_CONFIG[activeTab]?.label}"` : ''}</p>
            <Link to="/admin/contenus/nouveau" className="btn btn-primary">
              <FiPlus /> Creer un contenu
            </Link>
          </div>
        ) : (
          <div className="contenus-list">
            {filteredContenus.map((contenu) => {
              const statutConfig = STATUT_CONFIG[contenu.statut];
              const StatusIcon = statutConfig?.icon || FiFile;

              return (
                <div key={contenu.id} className={`contenu-card ${contenu.statut}`}>
                  <div className="contenu-type">{getTypeIcon(contenu.type)}</div>

                  <div className="contenu-info">
                    <h3>{contenu.titre}</h3>
                    <p className="description">
                      {contenu.description?.substring(0, 100)}
                      {contenu.description?.length > 100 ? '...' : ''}
                    </p>
                    <div className="meta">
                      <span className="domaine">{contenu.domaine_nom}</span>
                      <span className="age">{contenu.tranche_age_min}-{contenu.tranche_age_max} ans</span>
                      <span className="date">Cree le {formatDate(contenu.date_creation)}</span>
                    </div>
                  </div>

                  <div className="contenu-status">
                    <span className={`badge ${statutConfig?.color}`}>
                      <StatusIcon />
                      {statutConfig?.label}
                    </span>
                  </div>

                  {/* Commentaire validateur pour contenus a_amender */}
                  {contenu.statut === 'a_amender' && contenu.commentaire_validation && (
                    <div className="validation-comment">
                      <FiAlertTriangle />
                      <div>
                        <strong>Commentaire du validateur:</strong>
                        <p>{contenu.commentaire_validation}</p>
                        {contenu.validateurNom && (
                          <span className="validateur">- {contenu.validateurNom}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="contenu-actions">
                    {/* Actions selon le statut */}
                    {['brouillon', 'a_amender'].includes(contenu.statut) && (
                      <>
                        <Link
                          to={`/admin/contenus/${contenu.id}/modifier`}
                          className="btn btn-secondary btn-sm"
                        >
                          <FiEdit2 /> Modifier
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSoumettre(contenu.id)}
                          disabled={actionLoading === contenu.id}
                        >
                          <FiSend /> Soumettre
                        </button>
                      </>
                    )}

                    {contenu.statut === 'en_attente' && (
                      <span className="waiting-badge">
                        <FiClock /> En attente de validation
                      </span>
                    )}

                    {contenu.statut === 'valide' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handlePublier(contenu.id)}
                        disabled={actionLoading === contenu.id}
                      >
                        <FiUpload /> Publier
                      </button>
                    )}

                    {contenu.statut === 'publie' && (
                      <Link
                        to={`/admin/contenus/${contenu.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <FiEye /> Voir
                      </Link>
                    )}

                    {/* Supprimer uniquement pour brouillons */}
                    {contenu.statut === 'brouillon' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleSupprimer(contenu.id)}
                        disabled={actionLoading === contenu.id}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MesContenus;
