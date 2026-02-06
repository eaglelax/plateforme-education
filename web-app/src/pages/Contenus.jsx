import { useEffect, useState } from 'react';
import {
  FiSearch,
  FiPlay,
  FiFileText,
  FiImage,
  FiHeadphones,
  FiBook,
  FiGrid,
  FiList,
} from 'react-icons/fi';
import { contenuService } from '../services/api';
import './Contenus.css';

function Contenus() {
  const [domaines, setDomaines] = useState([]);
  const [contenus, setContenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Filtres
  const [selectedDomaine, setSelectedDomaine] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchContenus();
  }, [selectedDomaine]);

  const fetchInitialData = async () => {
    try {
      const domainesRes = await contenuService.getDomaines();
      setDomaines(domainesRes.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement domaines:', err);
    }
  };

  const fetchContenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedDomaine) params.domaineId = selectedDomaine;

      const response = await contenuService.getCatalogue(params);
      setContenus(response.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement contenus:', err);
      setError('Impossible de charger les contenus');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case 'VIDEO':
        return <FiPlay />;
      case 'AUDIO':
        return <FiHeadphones />;
      case 'IMAGE':
        return <FiImage />;
      case 'PDF':
      case 'DOCUMENT':
        return <FiFileText />;
      case 'QUIZ':
      case 'JEU':
      case 'JEU_INTERACTIF':
      case 'ACTIVITE':
        return <FiBook />;
      default:
        return <FiFileText />;
    }
  };

  const getTypeLabel = (type) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case 'VIDEO':
        return 'Video';
      case 'AUDIO':
        return 'Audio';
      case 'IMAGE':
        return 'Image';
      case 'PDF':
      case 'DOCUMENT':
        return 'Document';
      case 'QUIZ':
        return 'Quiz';
      case 'JEU':
      case 'JEU_INTERACTIF':
        return 'Jeu';
      case 'ACTIVITE':
        return 'Activite';
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case 'VIDEO':
        return '#E53935';
      case 'AUDIO':
        return '#8E24AA';
      case 'IMAGE':
        return '#43A047';
      case 'PDF':
      case 'DOCUMENT':
        return '#1E88E5';
      case 'QUIZ':
        return '#FB8C00';
      case 'JEU':
      case 'JEU_INTERACTIF':
      case 'ACTIVITE':
        return '#00ACC1';
      default:
        return '#64748b';
    }
  };

  const filteredContenus = contenus.filter((c) =>
    c.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="contenus-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Catalogue des contenus</h1>
          <p>Explorez les ressources educatives disponibles</p>
        </div>
      </header>

      {/* Domaines Navigation */}
      <div className="domaines-nav">
        <button
          className={`domaine-btn ${!selectedDomaine ? 'active' : ''}`}
          onClick={() => setSelectedDomaine('')}
        >
          Tous
        </button>
        {domaines.map((domaine) => (
          <button
            key={domaine.id}
            className={`domaine-btn ${selectedDomaine === domaine.id ? 'active' : ''}`}
            onClick={() => setSelectedDomaine(domaine.id)}
          >
            {domaine.icone && <span className="domaine-icon">{domaine.icone}</span>}
            {domaine.nom}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un contenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid />
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            <FiList />
          </button>
        </div>
      </div>

      {/* Contenus Grid/List */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchContenus} className="btn-primary">Reessayer</button>
        </div>
      ) : filteredContenus.length === 0 ? (
        <div className="empty-state">
          <FiBook className="empty-icon" />
          <h3>Aucun contenu trouve</h3>
          <p>Modifiez vos filtres pour voir plus de resultats</p>
        </div>
      ) : (
        <div className={`contenus-${viewMode}`}>
          {filteredContenus.map((contenu) => (
            <div key={contenu.id} className="contenu-card">
              <div
                className="contenu-thumbnail"
                style={{
                  background: `linear-gradient(135deg, ${getTypeColor(contenu.type)}20, ${getTypeColor(contenu.type)}40)`,
                }}
              >
                <div
                  className="type-icon"
                  style={{ color: getTypeColor(contenu.type) }}
                >
                  {getTypeIcon(contenu.type)}
                </div>
              </div>
              <div className="contenu-info">
                <div className="contenu-meta">
                  <span
                    className="type-badge"
                    style={{
                      backgroundColor: `${getTypeColor(contenu.type)}20`,
                      color: getTypeColor(contenu.type),
                    }}
                  >
                    {getTypeLabel(contenu.type)}
                  </span>
                </div>
                <h3 className="contenu-titre">{contenu.titre}</h3>
                <p className="contenu-description">{contenu.description}</p>
                <div className="contenu-footer">
                  <span className="domaine-tag">{contenu.domaine?.nom}</span>
                  {contenu.dureeMinutes && (
                    <span className="duree">{contenu.dureeMinutes} min</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Contenus;
