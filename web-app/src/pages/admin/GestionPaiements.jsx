import { useState, useEffect } from 'react';
import { FiCreditCard, FiSearch, FiEye, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { paiementService } from '../../services/api';
import './AdminPages.css';
import './GestionPaiements.css';

function GestionPaiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

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
    <div className="admin-page">
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
        </div>
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
                  <td>
                    <code className="reference">{paiement.reference || `PAY-${paiement.id}`}</code>
                  </td>
                  <td>
                    <strong>{paiement.utilisateur_nom || 'N/A'}</strong>
                  </td>
                  <td className="amount">{formatPrice(paiement.montant)}</td>
                  <td>{getMethodeBadge(paiement.methode)}</td>
                  <td>
                    <div className="status-with-icon">
                      {getStatusIcon(paiement.statut)}
                      {getStatusBadge(paiement.statut)}
                    </div>
                  </td>
                  <td>{formatDate(paiement.date_creation)}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" title="Voir details">
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
    </div>
  );
}

export default GestionPaiements;
