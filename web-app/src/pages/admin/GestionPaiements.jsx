import { useState, useEffect } from 'react';
import { FiCreditCard, FiSearch, FiEye, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiClock, FiXCircle, FiX, FiUser, FiHash, FiRotateCcw, FiCheck } from 'react-icons/fi';
import { paiementService } from '../../services/api';
import './AdminPages.css';
import './GestionPaiements.css';

function GestionPaiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPaiements();
  }, [pagination.page, filterStatut]);

  const fetchPaiements = async () => {
    setLoading(true);
    try {
      const response = await paiementService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        statut: filterStatut || undefined
      });
      setPaiements(response.data?.data || []);
      if (response.data?.pagination) {
        setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
      }
    } catch (err) {
      setError('Erreur lors du chargement des paiements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'complete': return <FiCheckCircle className="status-icon success" />;
      case 'en_attente': return <FiClock className="status-icon pending" />;
      case 'echoue': return <FiXCircle className="status-icon error" />;
      default: return null;
    }
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'complete': return <span className="status-badge active">Complete</span>;
      case 'en_attente': return <span className="status-badge pending">En attente</span>;
      case 'echoue': return <span className="status-badge error">Echoue</span>;
      case 'rembourse': return <span className="status-badge refunded">Rembourse</span>;
      default: return <span className="status-badge">{statut}</span>;
    }
  };

  const getMethodeBadge = (methode) => {
    const methodes = {
      orange_money: { label: 'Orange Money', class: 'orange' },
      moov_money: { label: 'Moov Money', class: 'moov' },
      carte_bancaire: { label: 'Carte bancaire', class: 'card' },
      wave: { label: 'Wave', class: 'wave' }
    };
    const m = methodes[methode] || { label: methode, class: 'default' };
    return <span className={`method-badge ${m.class}`}>{m.label}</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const [success, setSuccess] = useState('');

  const handleRembourser = async (id) => {
    if (!confirm('Confirmer le remboursement de ce paiement ?')) return;
    try {
      await paiementService.rembourser(id);
      setSuccess('Paiement rembourse avec succes');
      setShowModal(false);
      fetchPaiements();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du remboursement');
    }
  };

  // Calcul des statistiques
  const stats = {
    total: paiements.reduce((sum, p) => p.statut === 'complete' ? sum + (p.montant || 0) : sum, 0),
    completed: paiements.filter(p => p.statut === 'complete').length,
    pending: paiements.filter(p => p.statut === 'en_attente').length,
    failed: paiements.filter(p => p.statut === 'echoue').length
  };

  if (loading && paiements.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page gestion-paiements-page">
      <div className="page-header">
        <div className="header-content">
          <FiCreditCard className="header-icon" />
          <div>
            <h1>Gestion des paiements</h1>
            <p>Suivez tous les paiements effectues sur la plateforme</p>
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

      {/* Stats rapides */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-label">Total encaisse</span>
          <span className="stat-value">{formatPrice(stats.total)}</span>
        </div>
        <div className="stat-item success">
          <span className="stat-label">Completes</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-item pending">
          <span className="stat-label">En attente</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-item error">
          <span className="stat-label">Echoues</span>
          <span className="stat-value">{stats.failed}</span>
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
          <option value="complete">Completes</option>
          <option value="en_attente">En attente</option>
          <option value="echoue">Echoues</option>
          <option value="rembourse">Rembourses</option>
        </select>

        <button className="btn btn-secondary" onClick={fetchPaiements}>
          <FiRefreshCw /> Actualiser
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Utilisateur</th>
              <th>Montant</th>
              <th>Methode</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paiements.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  Aucun paiement trouve
                </td>
              </tr>
            ) : (
              paiements.map((paiement) => (
                <tr key={paiement.id}>
                  <td data-label="Reference">
                    <code className="reference">{paiement.reference || `PAY-${paiement.id}`}</code>
                  </td>
                  <td data-label="Utilisateur">
                    <strong>{paiement.utilisateur_nom || 'N/A'}</strong>
                  </td>
                  <td data-label="Montant" className="amount">{formatPrice(paiement.montant)}</td>
                  <td data-label="Methode">{getMethodeBadge(paiement.methode)}</td>
                  <td data-label="Statut">
                    <div className="status-with-icon">
                      {getStatusIcon(paiement.statut)}
                      {getStatusBadge(paiement.statut)}
                    </div>
                  </td>
                  <td data-label="Date">{formatDate(paiement.date_creation)}</td>
                  <td data-label="Actions" className="actions-cell">
                    <button className="btn-icon" title="Voir details" onClick={() => { setSelectedPaiement(paiement); setShowModal(true); }}>
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
      {/* Modal Detail Paiement */}
      {showModal && selectedPaiement && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail du paiement</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <FiHash className="detail-icon" />
                  <div>
                    <label>Reference</label>
                    <span><code>{selectedPaiement.reference || `PAY-${selectedPaiement.id}`}</code></span>
                  </div>
                </div>
                <div className="detail-item">
                  <FiUser className="detail-icon" />
                  <div>
                    <label>Utilisateur</label>
                    <span>{selectedPaiement.utilisateur_nom || 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <FiCreditCard className="detail-icon" />
                  <div>
                    <label>Montant</label>
                    <span className="amount">{formatPrice(selectedPaiement.montant)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div>
                    <label>Methode de paiement</label>
                    {getMethodeBadge(selectedPaiement.methode)}
                  </div>
                </div>
                <div className="detail-item">
                  <div>
                    <label>Statut</label>
                    <div className="status-with-icon">
                      {getStatusIcon(selectedPaiement.statut)}
                      {getStatusBadge(selectedPaiement.statut)}
                    </div>
                  </div>
                </div>
                <div className="detail-item">
                  <div>
                    <label>Date</label>
                    <span>{formatDate(selectedPaiement.date_creation)}</span>
                  </div>
                </div>
                {selectedPaiement.telephone && (
                  <div className="detail-item">
                    <div>
                      <label>Telephone</label>
                      <span>{selectedPaiement.telephone}</span>
                    </div>
                  </div>
                )}
                {selectedPaiement.transaction_id && (
                  <div className="detail-item">
                    <div>
                      <label>ID Transaction</label>
                      <span><code>{selectedPaiement.transaction_id}</code></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
              {selectedPaiement.statut === 'complete' && (
                <button className="btn btn-danger" onClick={() => handleRembourser(selectedPaiement.id)}>
                  <FiRotateCcw /> Rembourser
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPaiements;
