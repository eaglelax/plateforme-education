import { useState, useEffect } from 'react';
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { contenuService } from '../../services/api';
import './AdminPages.css';

function GestionDomaines() {
  const [domaines, setDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ nom: '', description: '', icone: '', couleur: '#6366f1' });

  useEffect(() => { fetchDomaines(); }, []);

  const fetchDomaines = async () => {
    setLoading(true);
    try {
      const response = await contenuService.getDomaines();
      setDomaines(response.data?.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des domaines');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) { setError('Le nom est requis'); return; }
    try {
      if (editId) {
        await contenuService.updateDomaine(editId, formData);
        setSuccess('Domaine modifie avec succes');
      } else {
        await contenuService.createDomaine(formData);
        setSuccess('Domaine cree avec succes');
      }
      resetForm();
      fetchDomaines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (domaine) => {
    setEditId(domaine.id);
    setFormData({
      nom: domaine.nom || '',
      description: domaine.description || '',
      icone: domaine.icone || '',
      couleur: domaine.couleur || '#6366f1',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nom: '', description: '', icone: '', couleur: '#6366f1' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container"><div className="loader"></div><p>Chargement des domaines...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiGrid className="header-icon" />
          <div>
            <h1>Gestion des domaines</h1>
            <p>{domaines.length} domaines educatifs</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchDomaines}><FiRefreshCw /> Actualiser</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}><FiPlus /> Nouveau domaine</button>
        </div>
      </div>

      {error && (
        <div className="error-alert"><FiAlertCircle /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>
      )}
      {success && (
        <div className="success-alert"><FiCheck /><span>{success}</span></div>
      )}

      {showForm && (
        <div className="form-card">
          <h3>{editId ? 'Modifier le domaine' : 'Nouveau domaine'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom *</label>
                <input type="text" className="form-input" value={formData.nom} onChange={(e) => setFormData(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Mathematiques" />
              </div>
              <div className="form-group">
                <label>Icone</label>
                <input type="text" className="form-input" value={formData.icone} onChange={(e) => setFormData(p => ({ ...p, icone: e.target.value }))} placeholder="Ex: calculator" />
              </div>
              <div className="form-group">
                <label>Couleur</label>
                <input type="color" className="form-input" value={formData.couleur} onChange={(e) => setFormData(p => ({ ...p, couleur: e.target.value }))} style={{ height: 40, padding: 2 }} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Description du domaine..." />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}><FiX /> Annuler</button>
              <button type="submit" className="btn btn-primary"><FiCheck /> {editId ? 'Modifier' : 'Creer'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Couleur</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Icone</th>
              <th>Contenus</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {domaines.length === 0 ? (
              <tr><td colSpan="6" className="empty-cell">Aucun domaine</td></tr>
            ) : domaines.map((d) => (
              <tr key={d.id}>
                <td><div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: d.couleur || '#6366f1' }} /></td>
                <td><strong>{d.nom}</strong></td>
                <td>{d.description || '-'}</td>
                <td>{d.icone || '-'}</td>
                <td>{d.contenus_count ?? d.count ?? '-'}</td>
                <td className="actions-cell">
                  <button className="btn-icon" title="Modifier" onClick={() => handleEdit(d)}><FiEdit2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionDomaines;
