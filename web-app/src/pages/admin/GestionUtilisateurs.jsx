import { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiEdit2, FiTrash2, FiEye, FiAlertCircle } from 'react-icons/fi';
import { adminService } from '../../services/api';
import './AdminPages.css';
import './GestionUtilisateurs.css';

function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  useEffect(() => {
    fetchUtilisateurs();
  }, [pagination.page, search]);

  const fetchUtilisateurs = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUtilisateurs({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined
      });
      setUtilisateurs(response.data?.data || []);
      if (response.data?.pagination) {
        setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
      }
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUtilisateurs();
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'badge-admin';
      case 'PARENT': return 'badge-parent';
      case 'VALIDATEUR': return 'badge-validateur';
      case 'GESTIONNAIRE_CONTENU': return 'badge-gestionnaire';
      default: return 'badge-default';
    }
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'actif': return <span className="status-badge active">Actif</span>;
      case 'inactif': return <span className="status-badge inactive">Inactif</span>;
      case 'suspendu': return <span className="status-badge suspended">Suspendu</span>;
      default: return <span className="status-badge">{statut}</span>;
    }
  };

  if (loading && utilisateurs.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiUsers className="header-icon" />
          <div>
            <h1>Gestion des utilisateurs</h1>
            <p>Gerez les comptes utilisateurs de la plateforme</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou telephone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Rechercher</button>
        </form>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Statut</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  Aucun utilisateur trouve
                </td>
              </tr>
            ) : (
              utilisateurs.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.prenom?.[0]}{user.nom?.[0]}
                      </div>
                      <div>
                        <strong>{user.prenom} {user.nom}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <span>{user.email}</span>
                      <span className="phone">{user.telephone}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role_nom || user.role)}`}>
                      {user.role_nom || user.role}
                    </span>
                  </td>
                  <td>{getStatusBadge(user.statut_compte)}</td>
                  <td>{new Date(user.date_creation).toLocaleDateString('fr-FR')}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" title="Voir">
                      <FiEye />
                    </button>
                    <button className="btn-icon" title="Modifier">
                      <FiEdit2 />
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

export default GestionUtilisateurs;
