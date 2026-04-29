import { useState, useEffect } from 'react';
import { FiBell, FiSend, FiUsers, FiUser, FiAlertCircle, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { adminService, notificationService } from '../../services/api';
import './AdminPages.css';

function AdminNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('individual'); // individual or broadcast
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [formData, setFormData] = useState({
    destinataireId: '',
    titre: '',
    message: '',
    type: 'info',
  });

  useEffect(() => { fetchUtilisateurs(); }, []);

  const fetchUtilisateurs = async () => {
    try {
      const response = await adminService.getUtilisateurs({ limit: 200 });
      setUtilisateurs(response.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.message.trim()) {
      setError('Le titre et le message sont requis');
      return;
    }
    if (mode === 'individual' && !formData.destinataireId) {
      setError('Selectionnez un destinataire');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (mode === 'broadcast') {
        await notificationService.broadcast({
          titre: formData.titre,
          message: formData.message,
          type: formData.type,
        });
        setSuccess('Notification envoyee a tous les utilisateurs');
      } else {
        await notificationService.envoyer({
          destinataireId: parseInt(formData.destinataireId),
          titre: formData.titre,
          message: formData.message,
          type: formData.type,
        });
        setSuccess('Notification envoyee avec succes');
      }
      setFormData({ destinataireId: '', titre: '', message: '', type: 'info' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiBell className="header-icon" />
          <div>
            <h1>Notifications</h1>
            <p>Envoyez des notifications aux utilisateurs</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert"><FiAlertCircle /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>
      )}
      {success && (
        <div className="success-alert"><FiCheck /><span>{success}</span></div>
      )}

      {/* Mode selector */}
      <div className="mode-selector">
        <button className={`mode-btn ${mode === 'individual' ? 'active' : ''}`} onClick={() => setMode('individual')}>
          <FiUser /> Envoi individuel
        </button>
        <button className={`mode-btn ${mode === 'broadcast' ? 'active' : ''}`} onClick={() => setMode('broadcast')}>
          <FiUsers /> Diffusion generale
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {mode === 'individual' && (
            <div className="form-group">
              <label>Destinataire *</label>
              <select
                className="form-select"
                value={formData.destinataireId}
                onChange={(e) => setFormData(p => ({ ...p, destinataireId: e.target.value }))}
              >
                <option value="">Selectionnez un utilisateur</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} ({u.email}) - {u.role_nom || u.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Titre *</label>
              <input
                type="text"
                className="form-input"
                value={formData.titre}
                onChange={(e) => setFormData(p => ({ ...p, titre: e.target.value }))}
                placeholder="Titre de la notification"
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-select" value={formData.type} onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}>
                <option value="info">Information</option>
                <option value="succes">Succes</option>
                <option value="avertissement">Avertissement</option>
                <option value="important">Important</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              className="form-input"
              value={formData.message}
              onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
              rows={4}
              placeholder="Contenu de la notification..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FiSend /> {loading ? 'Envoi en cours...' : mode === 'broadcast' ? 'Envoyer a tous' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>

      {mode === 'broadcast' && (
        <div className="info-box">
          <FiAlertCircle />
          <p>La diffusion generale enverra la notification a <strong>tous les utilisateurs actifs</strong> de la plateforme.</p>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
