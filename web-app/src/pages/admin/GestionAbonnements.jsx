import { useState, useEffect } from 'react';
import { FiPackage, FiEye, FiRefreshCw, FiAlertCircle, FiX, FiUser, FiCalendar, FiCreditCard, FiPlus, FiEdit2, FiCheck, FiGrid } from 'react-icons/fi';
import { abonnementService, contenuService } from '../../services/api';
import './AdminPages.css';
import './GestionAbonnements.css';

function GestionAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [types, setTypes] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [selectedAbo, setSelectedAbo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editTypeId, setEditTypeId] = useState(null);
  const [typeForm, setTypeForm] = useState({ nom: '', description: '', prix: '', duree: 'MENSUEL', nombreAppareilsMax: 1, domaineIds: [] });
  const [showDomainsModal, setShowDomainsModal] = useState(false);
  const [domainsType, setDomainsType] = useState(null);
  const [selectedDomainIds, setSelectedDomainIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, [pagination.page, filterStatut]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [abonnementsRes, typesRes, domainesRes] = await Promise.all([
        abonnementService.getAll({
          page: pagination.page,
          limit: pagination.limit,
          statut: filterStatut || undefined
        }),
        abonnementService.getTypes(),
        contenuService.getDomaines()
      ]);
      setAbonnements(abonnementsRes.data?.data || []);
      setTypes(typesRes.data?.data || []);
      setDomaines(domainesRes.data?.data || []);
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
    if (!typeForm.nom.trim() || !typeForm.prix) {
      setError('Nom et prix sont requis'); return;
    }
    try {
      const payload = {
        nom: typeForm.nom,
        description: typeForm.description,
        prix: parseFloat(typeForm.prix),
        duree: typeForm.duree,
        nombreAppareilsMax: parseInt(typeForm.nombreAppareilsMax) || 1,
        domaineIds: typeForm.domaineIds
      };
      if (editTypeId) {
        await abonnementService.updateType(editTypeId, payload);
        // MAJ des domaines (separe car endpoint dedie)
        await abonnementService.setPackDomaines(editTypeId, typeForm.domaineIds);
        setSuccess('Type modifie avec succes');
      } else {
        await abonnementService.createType(payload);
        setSuccess('Type cree avec succes');
      }
      resetTypeForm();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const editType = async (type) => {
    setEditTypeId(type.id);
    let domaineIds = (type.domaines || []).map(d => d.id);
    if (domaineIds.length === 0) {
      // Charger les domaines depuis l'endpoint dedie au cas ou
      try {
        const res = await abonnementService.getPackDomaines(type.id);
        domaineIds = (res.data?.data || []).map(d => d.id);
      } catch (e) { /* ignore */ }
    }
    setTypeForm({
      nom: type.nom || '',
      description: type.description || '',
      prix: type.prix || '',
      duree: type.duree || 'MENSUEL',
      nombreAppareilsMax: type.nombre_appareils_max || 1,
      domaineIds
    });
    setShowTypeForm(true);
  };

  const resetTypeForm = () => {
    setEditTypeId(null);
    setTypeForm({ nom: '', description: '', prix: '', duree: 'MENSUEL', nombreAppareilsMax: 1, domaineIds: [] });
    setShowTypeForm(false);
  };

  const toggleDomainInForm = (domaineId) => {
    setTypeForm(prev => ({
      ...prev,
      domaineIds: prev.domaineIds.includes(domaineId)
        ? prev.domaineIds.filter(id => id !== domaineId)
        : [...prev.domaineIds, domaineId]
    }));
  };

  const openDomainsModal = async (type) => {
    setDomainsType(type);
    try {
      const res = await abonnementService.getPackDomaines(type.id);
      setSelectedDomainIds((res.data?.data || []).map(d => d.id));
    } catch (err) {
      setSelectedDomainIds([]);
    }
    setShowDomainsModal(true);
  };

  const toggleDomainModal = (domaineId) => {
    setSelectedDomainIds(prev =>
      prev.includes(domaineId)
        ? prev.filter(id => id !== domaineId)
        : [...prev, domaineId]
    );
  };

  const saveDomainsConfig = async () => {
    if (!domainsType) return;
    try {
      await abonnementService.setPackDomaines(domainsType.id, selectedDomainIds);
      setSuccess(`${selectedDomainIds.length} domaine(s) configure(s) pour ${domainsType.nom}`);
      setShowDomainsModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
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
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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
    <div className="admin-page gestion-abonnements-page">
      <div className="page-header">
        <div className="header-content">
          <FiPackage className="header-icon" />
          <div>
            <h1>Gestion des abonnements</h1>
            <p>Gerez les packs et leurs domaines inclus</p>
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
          <h3 style={{ margin: 0 }}>Packs d'abonnement</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { resetTypeForm(); setShowTypeForm(true); }}>
            <FiPlus /> Nouveau pack
          </button>
        </div>

        {showTypeForm && (
          <div className="form-card" style={{ marginBottom: '1rem' }}>
            <h3>{editTypeId ? 'Modifier le pack' : 'Nouveau pack d\'abonnement'}</h3>
            <form onSubmit={handleTypeSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input type="text" className="form-input" value={typeForm.nom} onChange={(e) => setTypeForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Pack Premium Mensuel" />
                </div>
                <div className="form-group">
                  <label>Prix (FCFA) *</label>
                  <input type="number" className="form-input" value={typeForm.prix} onChange={(e) => setTypeForm(p => ({ ...p, prix: e.target.value }))} placeholder="5000" min="0" />
                </div>
                <div className="form-group">
                  <label>Duree *</label>
                  <select className="form-input" value={typeForm.duree} onChange={(e) => setTypeForm(p => ({ ...p, duree: e.target.value }))}>
                    <option value="MENSUEL">Mensuel (30 jours)</option>
                    <option value="TRIMESTRIEL">Trimestriel (90 jours)</option>
                    <option value="ANNUEL">Annuel (365 jours)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" className="form-input" value={typeForm.description} onChange={(e) => setTypeForm(p => ({ ...p, description: e.target.value }))} placeholder="Description du pack" />
                </div>
                <div className="form-group">
                  <label>Appareils max</label>
                  <input type="number" className="form-input" value={typeForm.nombreAppareilsMax} onChange={(e) => setTypeForm(p => ({ ...p, nombreAppareilsMax: e.target.value }))} min="1" max="10" />
                </div>
              </div>

              {/* Domaines inclus */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label><FiGrid style={{ marginRight: 6 }} />Domaines inclus dans ce pack ({typeForm.domaineIds.length}/{domaines.length})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {domaines.map(d => (
                    <label key={d.id} className="checkbox-label" style={{ background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={typeForm.domaineIds.includes(d.id)}
                        onChange={() => toggleDomainInForm(d.id)}
                      />
                      <span style={{ marginLeft: 6 }}>{d.icone} {d.nom}</span>
                    </label>
                  ))}
                </div>
                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Si aucun domaine n'est selectionne, les abonnes auront acces a tous les domaines (transition douce).
                </small>
              </div>

              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={resetTypeForm}><FiX /> Annuler</button>
                <button type="submit" className="btn btn-primary"><FiCheck /> {editTypeId ? 'Modifier' : 'Creer'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="types-grid">
          {types.map((type) => (
            <div key={type.id} className="type-card" style={{ position: 'relative' }}>
              <h4>{type.nom}</h4>
              <p className="price">{formatPrice(type.prix)}</p>
              <p className="duration">{type.duree_jours} jours</p>
              <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <FiGrid style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {(type.domaines || []).length === 0
                  ? 'Tous domaines (par defaut)'
                  : `${type.domaines.length} domaine(s)`}
              </div>
              {type.domaines && type.domaines.length > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.75rem' }}>
                  {type.domaines.slice(0, 3).map(d => (
                    <span key={d.id} style={{ display: 'inline-block', marginRight: 4, padding: '2px 6px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 4 }}>{d.icone} {d.nom}</span>
                  ))}
                  {type.domaines.length > 3 && <span style={{ color: 'var(--text-muted)' }}>+{type.domaines.length - 3}</span>}
                </div>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '4px' }}>
                <button className="btn-icon" title="Configurer domaines" onClick={() => openDomainsModal(type)}>
                  <FiGrid />
                </button>
                <button className="btn-icon" title="Modifier" onClick={() => editType(type)}>
                  <FiEdit2 />
                </button>
              </div>
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
              <tr><td colSpan="7" className="empty-cell">Aucun abonnement trouve</td></tr>
            ) : (
              abonnements.map((abo) => (
                <tr key={abo.id}>
                  <td data-label="Enfant"><strong>{abo.enfant?.nom || abo.enfant_nom || abo.nom_pseudo}</strong></td>
                  <td data-label="Type">{abo.type?.nom || abo.type_nom || abo.type_abonnement}</td>
                  <td data-label="Debut">{formatDate(abo.dateDebut || abo.date_debut)}</td>
                  <td data-label="Fin">{formatDate(abo.dateFin || abo.date_fin)}</td>
                  <td data-label="Statut">{getStatusBadge(abo.statut)}</td>
                  <td data-label="Renouvellement">
                    <span className={(abo.renouvellementAuto || abo.renouvellement_auto) ? 'text-success' : 'text-muted'}>
                      {(abo.renouvellementAuto || abo.renouvellement_auto) ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td data-label="Actions" className="actions-cell">
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
          <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Precedent</button>
          <span>Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}</span>
          <button disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Suivant</button>
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
                  <div><label>Enfant</label><span>{selectedAbo.enfant?.nom || selectedAbo.enfant_nom || 'N/A'}</span></div>
                </div>
                <div className="detail-item">
                  <FiPackage className="detail-icon" />
                  <div><label>Type d'abonnement</label><span>{selectedAbo.type?.nom || selectedAbo.type_nom}</span></div>
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div><label>Debut</label><span>{formatDate(selectedAbo.dateDebut || selectedAbo.date_debut)}</span></div>
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div><label>Fin</label><span>{formatDate(selectedAbo.dateFin || selectedAbo.date_fin)}</span></div>
                </div>
                <div className="detail-item">
                  <div><label>Statut</label>{getStatusBadge(selectedAbo.statut)}</div>
                </div>
                <div className="detail-item">
                  <div>
                    <label>Renouvellement automatique</label>
                    <span className={(selectedAbo.renouvellementAuto || selectedAbo.renouvellement_auto) ? 'text-success' : 'text-muted'}>
                      {(selectedAbo.renouvellementAuto || selectedAbo.renouvellement_auto) ? 'Actif' : 'Desactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuration domaines */}
      {showDomainsModal && domainsType && (
        <div className="modal-overlay" onClick={() => setShowDomainsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiGrid style={{ marginRight: 8 }} />Domaines : {domainsType.nom}</h3>
              <button className="modal-close" onClick={() => setShowDomainsModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Selectionnez les domaines inclus dans ce pack. Les abonnements deja actifs ne seront pas affectes (snapshot a la souscription).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {domaines.map(d => (
                  <label key={d.id} className="checkbox-label" style={{ background: selectedDomainIds.includes(d.id) ? 'var(--accent-soft)' : 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${selectedDomainIds.includes(d.id) ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedDomainIds.includes(d.id)}
                      onChange={() => toggleDomainModal(d.id)}
                    />
                    <span style={{ marginLeft: 8 }}>{d.icone} {d.nom}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 8, background: 'var(--warning-soft)', borderRadius: 6, color: 'var(--warning)', fontSize: '0.85rem' }}>
                {selectedDomainIds.length === 0
                  ? '⚠ Aucun domaine selectionne : les nouveaux abonnes auront acces a tous les domaines (defaut).'
                  : `${selectedDomainIds.length} domaine(s) selectionne(s)`}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDomainsModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveDomainsConfig}><FiCheck /> Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionAbonnements;
