import { useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiEye, FiRefreshCw, FiAlertCircle, FiX, FiUser, FiCalendar, FiCreditCard, FiPlus, FiEdit2, FiCheck } from 'react-icons/fi';
import { abonnementService } from '../../services/api';
import api from '../../services/api';
import './AdminPages.css';
import './GestionAbonnements.css';

function GestionAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [selectedAbo, setSelectedAbo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editTypeId, setEditTypeId] = useState(null);
  const [typeForm, setTypeForm] = useState({ nom: '', description: '', prix: '', duree_jours: '', nombre_appareils: 1, telechargement: false, contenu_premium: false });

  useEffect(() => {
    fetchData();
  }, [pagination.page, filterStatut]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [abonnementsRes, typesRes] = await Promise.all([
        abonnementService.getAll({
          page: pagination.page,
          limit: pagination.limit,
          statut: filterStatut || undefined
        }),
        abonnementService.getTypes()
      ]);
      setAbonnements(abonnementsRes.data?.data || []);
      setTypes(typesRes.data?.data || []);
      if (abonnementsRes.data?.pagination) {
        setPagination(prev => ({ ...prev, total: abonnementsRes.data.pagination.total }));
      }
    } catch (err) {
      setError('Erreur lors du chargement des abonnements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    if (!typeForm.nom.trim() || !typeForm.prix || !typeForm.duree_jours) {
      setError('Nom, prix et duree sont requis'); return;
    }
    try {
      const payload = { ...typeForm, prix: parseInt(typeForm.prix), duree_jours: parseInt(typeForm.duree_jours), nombre_appareils: parseInt(typeForm.nombre_appareils) };
      if (editTypeId) {
        await api.put(`/abonnements/types/${editTypeId}`, payload);
        setSuccess('Type modifie avec succes');
      } else {
        await api.post('/abonnements/types', payload);
        setSuccess('Type cree avec succes');
      }
      resetTypeForm();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const editType = (type) => {
    setEditTypeId(type.id);
    setTypeForm({
      nom: type.nom || '', description: type.description || '',
      prix: type.prix || '', duree_jours: type.duree_jours || '',
      nombre_appareils: type.nombre_appareils || 1,
      telechargement: type.telechargement || false,
      contenu_premium: type.contenu_premium || false,
    });
    setShowTypeForm(true);
  };

  const resetTypeForm = () => {
    setEditTypeId(null);
    setTypeForm({ nom: '', description: '', prix: '', duree_jours: '', nombre_appareils: 1, telechargement: false, contenu_premium: false });
    setShowTypeForm(false);
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'actif': return <span className="status-badge active">Actif</span>;
      case 'expire': return <span className="status-badge expired">Expire</span>;
      case 'periode_grace': return <span className="status-badge grace">Periode de grace</span>;
      case 'annule': return <span className="status-badge cancelled">Annule</span>;
      default: return <span className="status-badge">{statut}</span>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  if (loading && abonnements.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiPackage className="header-icon" />
          <div>
            <h1>Gestion des abonnements</h1>
            <p>Suivez et gerez les abonnements des utilisateurs</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}
      {success && (
        <div className="success-alert"><FiCheck /><span>{success}</span></div>
      )}

      {/* Types d'abonnements */}
      <div className="types-overview">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Types d'abonnements</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { resetTypeForm(); setShowTypeForm(true); }}>
            <FiPlus /> Nouveau type
          </button>
        </div>

        {showTypeForm && (
          <div className="form-card" style={{ marginBottom: '1rem' }}>
            <h3>{editTypeId ? 'Modifier le type' : 'Nouveau type d\'abonnement'}</h3>
            <form onSubmit={handleTypeSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input type="text" className="form-input" value={typeForm.nom} onChange={(e) => setTypeForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Premium Mensuel" />
                </div>
                <div className="form-group">
                  <label>Prix (FCFA) *</label>
                  <input type="number" className="form-input" value={typeForm.prix} onChange={(e) => setTypeForm(p => ({ ...p, prix: e.target.value }))} placeholder="5000" min="0" />
                </div>
                <div className="form-group">
                  <label>Duree (jours) *</label>
                  <input type="number" className="form-input" value={typeForm.duree_jours} onChange={(e) => setTypeForm(p => ({ ...p, duree_jours: e.target.value }))} placeholder="30" min="1" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" className="form-input" value={typeForm.description} onChange={(e) => setTypeForm(p => ({ ...p, description: e.target.value }))} placeholder="Description du plan" />
                </div>
                <div className="form-group">
                  <label>Appareils max</label>
                  <input type="number" className="form-input" value={typeForm.nombre_appareils} onChange={(e) => setTypeForm(p => ({ ...p, nombre_appareils: e.target.value }))} min="1" max="10" />
                </div>
              </div>
              <div className="form-row checkboxes" style={{ marginBottom: '1rem' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={typeForm.telechargement} onChange={(e) => setTypeForm(p => ({ ...p, telechargement: e.target.checked }))} />
                  <span>Telechargement hors ligne</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={typeForm.contenu_premium} onChange={(e) => setTypeForm(p => ({ ...p, contenu_premium: e.target.checked }))} />
                  <span>Acces contenu premium</span>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetTypeForm}><FiX /> Annuler</button>
                <button type="submit" className="btn btn-primary"><FiCheck /> {editTypeId ? 'Modifier' : 'Creer'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="types-grid">
          {types.map((type) => (
            <div key={type.id} className="type-card">
              <h4>{type.nom}</h4>
              <p className="price">{formatPrice(type.prix)}</p>
              <p className="duration">{type.duree_jours} jours</p>
              <button className="btn-icon" title="Modifier" onClick={() => editType(type)} style={{ position: 'absolute', top: 8, right: 8 }}>
                <FiEdit2 />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="filters-section">
        <select
          value={filterStatut}
          onChange={(e) => {
            setFilterStatut(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="expire">Expires</option>
          <option value="periode_grace">Periode de grace</option>
          <option value="annule">Annules</option>
        </select>

        <button className="btn btn-secondary" onClick={fetchData}>
          <FiRefreshCw /> Actualiser
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Enfant</th>
              <th>Type</th>
              <th>Debut</th>
              <th>Fin</th>
              <th>Statut</th>
              <th>Renouvellement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {abonnements.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  Aucun abonnement trouve
                </td>
              </tr>
            ) : (
              abonnements.map((abo) => (
                <tr key={abo.id}>
                  <td>
                    <strong>{abo.enfant_nom || abo.nom_pseudo}</strong>
                  </td>
                  <td>{abo.type_nom || abo.type_abonnement}</td>
                  <td>{formatDate(abo.date_debut)}</td>
                  <td>{formatDate(abo.date_fin)}</td>
                  <td>{getStatusBadge(abo.statut)}</td>
                  <td>
                    <span className={abo.renouvellement_auto ? 'text-success' : 'text-muted'}>
                      {abo.renouvellement_auto ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon" title="Voir details" onClick={() => { setSelectedAbo(abo); setShowModal(true); }}>
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.total > pagination.limit && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            Precedent
          </button>
          <span>Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}</span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            Suivant
          </button>
        </div>
      )}
      {/* Modal Detail Abonnement */}
      {showModal && selectedAbo && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail de l'abonnement</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <FiUser className="detail-icon" />
                  <div>
                    <label>Enfant</label>
                    <span>{selectedAbo.enfant_nom || selectedAbo.nom_pseudo || 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <FiPackage className="detail-icon" />
                  <div>
                    <label>Type d'abonnement</label>
                    <span>{selectedAbo.type_nom || selectedAbo.type_abonnement}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div>
                    <label>Date de debut</label>
                    <span>{formatDate(selectedAbo.date_debut)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div>
                    <label>Date de fin</label>
                    <span>{formatDate(selectedAbo.date_fin)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div>
                    <label>Statut</label>
                    {getStatusBadge(selectedAbo.statut)}
                  </div>
                </div>
                <div className="detail-item">
                  <div>
                    <label>Renouvellement automatique</label>
                    <span className={selectedAbo.renouvellement_auto ? 'text-success' : 'text-muted'}>
                      {selectedAbo.renouvellement_auto ? 'Actif' : 'Desactive'}
                    </span>
                  </div>
                </div>
                {selectedAbo.montant && (
                  <div className="detail-item">
                    <FiCreditCard className="detail-icon" />
                    <div>
                      <label>Montant</label>
                      <span>{formatPrice(selectedAbo.montant)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionAbonnements;
