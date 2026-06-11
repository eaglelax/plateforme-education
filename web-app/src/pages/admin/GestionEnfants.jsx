import { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiEye, FiRefreshCw, FiAlertCircle, FiX, FiAward, FiStar } from 'react-icons/fi';
import { enfantService } from '../../services/api';
import './AdminPages.css';

function GestionEnfants() {
  const [enfants, setEnfants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEnfant, setSelectedEnfant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchEnfants(); }, []);

  const fetchEnfants = async () => {
    setLoading(true);
    try {
      const response = await enfantService.getAll({ limit: 200 });
      setEnfants(response.data?.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des profils enfants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (enfant) => {
    setShowModal(true);
    setDetailLoading(true);
    try {
      const response = await enfantService.getById(enfant.id);
      setSelectedEnfant(response.data?.data || enfant);
    } catch (err) {
      setSelectedEnfant(enfant);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filtered = enfants.filter(e =>
    (e.nom_pseudo || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.code_connexion || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container"><div className="loader"></div><p>Chargement des profils enfants...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiUsers className="header-icon" />
          <div>
            <h1>Profils enfants</h1>
            <p>{enfants.length} enfants inscrits sur la plateforme</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchEnfants}><FiRefreshCw /> Actualiser</button>
        </div>
      </div>

      {error && <div className="error-alert"><FiAlertCircle /><span>{error}</span></div>}

      <div className="filters-section">
        <div className="search-form">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Rechercher par pseudo ou code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pseudo</th>
              <th>Age</th>
              <th>Code connexion</th>
              <th>XP</th>
              <th>Niveau</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="empty-cell">Aucun enfant trouve</td></tr>
            ) : filtered.map((enfant) => (
              <tr key={enfant.id}>
                <td data-label="Pseudo"><strong>{enfant.nom_pseudo}</strong></td>
                <td data-label="Age">{enfant.age} ans</td>
                <td data-label="Code connexion"><code>{enfant.code_connexion}</code></td>
                <td data-label="XP">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiStar size={14} color="var(--gold)" /> {enfant.points_xp || 0}
                  </span>
                </td>
                <td data-label="Niveau">Niv. {enfant.niveau_global || 1}</td>
                <td data-label="Statut">
                  <span className={`status-badge ${enfant.statut === 'actif' ? 'active' : 'inactive'}`}>
                    {enfant.statut || 'actif'}
                  </span>
                </td>
                <td data-label="Actions" className="actions-cell">
                  <button className="btn-icon" title="Voir details" onClick={() => handleView(enfant)}><FiEye /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Enfant */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedEnfant(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profil enfant</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setSelectedEnfant(null); }}><FiX /></button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
              ) : selectedEnfant ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <div><label>Pseudo</label><span>{selectedEnfant.nom_pseudo}</span></div>
                  </div>
                  <div className="detail-item">
                    <div><label>Age</label><span>{selectedEnfant.age} ans</span></div>
                  </div>
                  <div className="detail-item">
                    <div><label>Code connexion</label><span><code>{selectedEnfant.code_connexion}</code></span></div>
                  </div>
                  <div className="detail-item">
                    <div><label>Points XP</label><span>{selectedEnfant.points_xp || 0}</span></div>
                  </div>
                  <div className="detail-item">
                    <div><label>Niveau global</label><span>{selectedEnfant.niveau_global || 1}</span></div>
                  </div>
                  <div className="detail-item">
                    <div><label>Statut</label><span className={`status-badge ${selectedEnfant.statut === 'actif' ? 'active' : 'inactive'}`}>{selectedEnfant.statut || 'actif'}</span></div>
                  </div>
                  <div className="detail-item">
                    <div><label>Date creation</label><span>{formatDate(selectedEnfant.date_creation)}</span></div>
                  </div>
                  {selectedEnfant.parent_nom && (
                    <div className="detail-item">
                      <div><label>Parent</label><span>{selectedEnfant.parent_prenom} {selectedEnfant.parent_nom}</span></div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedEnfant(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEnfants;
