import { useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiEye, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { abonnementService } from '../../services/api';
import './AdminPages.css';
import './GestionAbonnements.css';

function GestionAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

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
        </div>
      )}

      {/* Types d'abonnements */}
      <div className="types-overview">
        <h3>Types d'abonnements disponibles</h3>
        <div className="types-grid">
          {types.map((type) => (
            <div key={type.id} className="type-card">
              <h4>{type.nom}</h4>
              <p className="price">{formatPrice(type.prix)}</p>
              <p className="duration">{type.duree_jours} jours</p>
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

export default GestionAbonnements;
