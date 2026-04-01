import { useState, useEffect } from 'react';
import { FiFileText, FiRefreshCw, FiAlertCircle, FiUser, FiClock } from 'react-icons/fi';
import { adminService } from '../../services/api';
import './AdminPages.css';

function JournalAudit() {
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 30 });

  useEffect(() => { fetchJournal(); }, [pagination.page]);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const response = await adminService.getJournal({ page: pagination.page, limit: pagination.limit });
      const data = response.data?.data || response.data || [];
      setJournal(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setPagination(p => ({ ...p, total: response.data.pagination.total }));
      }
    } catch (err) {
      setError('Erreur lors du chargement du journal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const colors = {
      creation: 'badge-success',
      modification: 'badge-info',
      suppression: 'badge-danger',
      validation: 'badge-warning',
      connexion: 'badge-secondary',
    };
    const key = Object.keys(colors).find(k => action?.toLowerCase().includes(k));
    return <span className={`badge ${colors[key] || 'badge-secondary'}`}>{action}</span>;
  };

  if (loading && journal.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-container"><div className="loader"></div><p>Chargement du journal...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiFileText className="header-icon" />
          <div>
            <h1>Journal d'audit</h1>
            <p>Historique de toutes les actions administratives</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchJournal}><FiRefreshCw /> Actualiser</button>
        </div>
      </div>

      {error && (
        <div className="error-alert"><FiAlertCircle /><span>{error}</span></div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {journal.length === 0 ? (
              <tr><td colSpan="4" className="empty-cell">Aucune activite enregistree</td></tr>
            ) : journal.map((entry, i) => (
              <tr key={entry.id || i}>
                <td>
                  <div className="date-cell">
                    <FiClock size={14} />
                    <span>{formatDate(entry.date || entry.date_creation || entry.created_at)}</span>
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <FiUser size={14} />
                    <span>{entry.utilisateur_nom || entry.user_name || entry.nom || 'Systeme'}</span>
                  </div>
                </td>
                <td>{getActionBadge(entry.action || entry.type)}</td>
                <td>{entry.details || entry.description || entry.message || '-'}</td>
              </tr>
            ))}
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
    </div>
  );
}

export default JournalAudit;
