import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiVideo,
  FiFileText,
  FiImage,
  FiMusic,
  FiPlay,
  FiHelpCircle,
} from 'react-icons/fi';
import { contenuService } from '../../services/api';
import './GestionContenus.css';

const DEMO_CONTENUS = [
  {
    id: 1,
    titre: 'Les lettres de l\'alphabet',
    description: 'Apprendre a reconnaitre les lettres',
    format: 'VIDEO',
    domaine: { nom: 'Lecture' },
    niveau: { libelle: 'CP1' },
    statut: 'PUBLIE',
    duree: 15,
  },
  {
    id: 2,
    titre: 'Addition et soustraction',
    description: 'Exercices de calcul mental',
    format: 'QUIZ',
    domaine: { nom: 'Mathematiques' },
    niveau: { libelle: 'CE1' },
    statut: 'BROUILLON',
    duree: 20,
  },
  {
    id: 3,
    titre: 'Les animaux du Burkina',
    description: 'Decouvrir la faune locale',
    format: 'IMAGE',
    domaine: { nom: 'Sciences' },
    niveau: { libelle: 'CE2' },
    statut: 'EN_VALIDATION',
    duree: 10,
  },
];

const TYPES_ICONS = {
  VIDEO: FiVideo,
  QUIZ: FiHelpCircle,
  IMAGE: FiImage,
  AUDIO: FiMusic,
  JEU_INTERACTIF: FiPlay,
  PDF: FiFileText,
};

function GestionContenus() {
  const [contenus, setContenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDomaine, setFilterDomaine] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [domaines, setDomaines] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contenusRes, domainesRes] = await Promise.allSettled([
        contenuService.getCatalogue({ limit: 100 }),
        contenuService.getDomaines(),
      ]);

      if (contenusRes.status === 'fulfilled') {
        const data = contenusRes.value.data?.contenus || contenusRes.value.data || [];
        setContenus(Array.isArray(data) ? data : DEMO_CONTENUS);
      } else {
        setContenus(DEMO_CONTENUS);
      }

      if (domainesRes.status === 'fulfilled') {
        const domainesData = domainesRes.value.data?.data || domainesRes.value.data || [];
        setDomaines(Array.isArray(domainesData) ? domainesData : []);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setContenus(DEMO_CONTENUS);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contenu ?')) return;

    try {
      await contenuService.delete(id);
      setContenus(contenus.filter((c) => c.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleValider = async (id, action) => {
    try {
      await contenuService.valider(id, { action });
      loadData();
    } catch (error) {
      alert('Erreur lors de la validation');
    }
  };

  const filteredContenus = contenus.filter((c) => {
    const matchSearch =
      c.titre?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchDomaine = !filterDomaine || c.domaine?.nom === filterDomaine;
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchDomaine && matchStatut;
  });

  const getStatutBadge = (statut) => {
    const badges = {
      PUBLIE: { class: 'badge-success', label: 'Publie' },
      BROUILLON: { class: 'badge-secondary', label: 'Brouillon' },
      EN_VALIDATION: { class: 'badge-warning', label: 'En validation' },
      REJETE: { class: 'badge-danger', label: 'Rejete' },
    };
    return badges[statut] || { class: 'badge-secondary', label: statut };
  };

  const getTypeIcon = (type) => {
    const Icon = TYPES_ICONS[type] || FiFileText;
    return <Icon />;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="gestion-contenus-page">
      <div className="page-header page-header-actions">
        <div>
          <h1>Gestion des contenus</h1>
          <p>{contenus.length} contenus au total</p>
        </div>
        <Link to="/admin/contenus/nouveau" className="btn btn-primary">
          <FiPlus /> Nouveau contenu
        </Link>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Rechercher un contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={filterDomaine}
          onChange={(e) => setFilterDomaine(e.target.value)}
        >
          <option value="">Tous les domaines</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.nom}>
              {d.nom}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="EN_VALIDATION">En validation</option>
          <option value="PUBLIE">Publie</option>
          <option value="REJETE">Rejete</option>
        </select>
      </div>

      <div className="contenus-table-container">
        <table className="contenus-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Titre</th>
              <th>Domaine</th>
              <th>Niveau</th>
              <th>Statut</th>
              <th>Duree</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContenus.map((contenu) => {
              const badge = getStatutBadge(contenu.statut);
              return (
                <tr key={contenu.id}>
                  <td>
                    <div className="type-icon">{getTypeIcon(contenu.format)}</div>
                  </td>
                  <td>
                    <div className="contenu-info">
                      <strong>{contenu.titre}</strong>
                      <span>{contenu.description?.substring(0, 50)}...</span>
                    </div>
                  </td>
                  <td>{contenu.domaine?.nom}</td>
                  <td>{contenu.niveau?.libelle}</td>
                  <td>
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                  </td>
                  <td>{contenu.duree} min</td>
                  <td>
                    <div className="actions-cell">
                      <Link
                        to={`/admin/contenus/${contenu.id}`}
                        className="btn-icon"
                        title="Voir"
                      >
                        <FiEye />
                      </Link>
                      <Link
                        to={`/admin/contenus/${contenu.id}/modifier`}
                        className="btn-icon"
                        title="Modifier"
                      >
                        <FiEdit2 />
                      </Link>
                      {contenu.statut === 'EN_VALIDATION' && (
                        <>
                          <button
                            className="btn-icon success"
                            title="Approuver"
                            onClick={() => handleValider(contenu.id, 'APPROUVER')}
                          >
                            <FiCheck />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Rejeter"
                            onClick={() => handleValider(contenu.id, 'REJETER')}
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                      <button
                        className="btn-icon danger"
                        title="Supprimer"
                        onClick={() => handleDelete(contenu.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredContenus.length === 0 && (
          <div className="empty-state">
            <p>Aucun contenu trouve</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionContenus;
