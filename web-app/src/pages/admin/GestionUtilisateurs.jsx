import { useState, useEffect } from 'react';
import {
  FiUsers, FiSearch, FiEdit2, FiTrash2, FiEye, FiAlertCircle,
  FiPlus, FiX, FiUserPlus, FiShield, FiSave
} from 'react-icons/fi';
import { adminService } from '../../services/api';
import useAdminAuthStore from '../../stores/adminAuthStore';
import './AdminPages.css';
import './GestionUtilisateurs.css';

function GestionUtilisateurs() {
  const { getRole, isAdmin } = useAdminAuthStore();
  const userRole = getRole()?.toUpperCase();
  const hasAdminRole = isAdmin();

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', email: '', statutCompte: '' });

  // Create form
  const [createForm, setCreateForm] = useState({
    nom: '', prenom: '', telephone: '', email: '', motDePasse: '', roleId: ''
  });

  useEffect(() => {
    fetchUtilisateurs();
    fetchRoles();
  }, [pagination.page]);

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

  const fetchRoles = async () => {
    try {
      const response = await adminService.getRoles();
      setRoles(response.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement roles:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUtilisateurs();
  };

  // Roles que cet utilisateur peut creer
  const getCreatableRoles = () => {
    if (hasAdminRole) {
      return roles.filter(r => ['VALIDATEUR', 'GESTIONNAIRE_CONTENU'].includes(r.nom?.toUpperCase()));
    }
    if (userRole === 'VALIDATEUR') {
      return roles.filter(r => r.nom?.toUpperCase() === 'GESTIONNAIRE_CONTENU');
    }
    return [];
  };

  // View user detail
  const handleView = async (user) => {
    setModalLoading(true);
    setShowViewModal(true);
    try {
      const response = await adminService.getUtilisateur(user.id);
      setSelectedUser(response.data?.data || user);
    } catch (err) {
      setSelectedUser(user);
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = async (user) => {
    setModalLoading(true);
    setShowEditModal(true);
    try {
      const response = await adminService.getUtilisateur(user.id);
      const u = response.data?.data || user;
      setSelectedUser(u);
      setEditForm({
        nom: u.nom || '',
        prenom: u.prenom || '',
        email: u.email || '',
        statutCompte: u.statut_compte || 'actif',
        roleId: u.role_id || ''
      });
    } catch (err) {
      setSelectedUser(user);
      setEditForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        statutCompte: user.statut_compte || 'actif',
        roleId: ''
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    setError('');
    try {
      // Update user info
      await adminService.updateUtilisateur(selectedUser.id, {
        nom: editForm.nom,
        prenom: editForm.prenom,
        email: editForm.email || undefined,
        statutCompte: editForm.statutCompte
      });

      // If role changed and we have admin rights
      if (editForm.roleId && editForm.roleId !== selectedUser.role_id && hasAdminRole) {
        await adminService.changeRole(selectedUser.id, editForm.roleId);
      }

      setSuccess('Utilisateur mis a jour');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUtilisateurs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise a jour');
    } finally {
      setModalLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (user) => {
    if (!confirm(`Supprimer l'utilisateur ${user.prenom} ${user.nom} ? Cette action est irreversible.`)) return;
    try {
      await adminService.deleteUtilisateur(user.id);
      setSuccess('Utilisateur supprime');
      fetchUtilisateurs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Create user
  const [createError, setCreateError] = useState('');
  const handleCreate = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setCreateError('');
    try {
      await adminService.createUtilisateur(createForm);
      setSuccess('Compte cree avec succes');
      setShowCreateModal(false);
      setCreateForm({ nom: '', prenom: '', telephone: '', email: '', motDePasse: '', roleId: '' });
      fetchUtilisateurs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Erreur lors de la creation');
    } finally {
      setModalLoading(false);
    }
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

  const getRoleLabel = (role) => {
    switch (role?.toUpperCase()) {
      case 'GESTIONNAIRE_CONTENU': return 'Gestionnaire';
      case 'VALIDATEUR': return 'Validateur';
      case 'ADMIN': return 'Admin';
      case 'PARENT': return 'Parent';
      default: return role;
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const creatableRoles = getCreatableRoles();

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
    <div className="admin-page gestion-utilisateurs-page">
      <div className="page-header">
        <div className="header-content">
          <FiUsers className="header-icon" />
          <div>
            <h1>Gestion des utilisateurs</h1>
            <p>Gerez les comptes utilisateurs de la plateforme</p>
          </div>
        </div>
        {creatableRoles.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <FiUserPlus /> Creer un compte
          </button>
        )}
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}>Fermer</button>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
          background: 'var(--success-soft)',
          border: '1px solid var(--success)', borderRadius: '12px', color: 'var(--success)',
          marginBottom: '1.5rem'
        }}>
          <FiShield />
          <span>{success}</span>
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
                  <td data-label="Utilisateur">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.prenom?.[0]}{user.nom?.[0]}
                      </div>
                      <div>
                        <strong>{user.prenom} {user.nom}</strong>
                      </div>
                    </div>
                  </td>
                  <td data-label="Contact">
                    <div className="contact-info">
                      <span>{user.email || '-'}</span>
                      <span className="phone">{user.telephone}</span>
                    </div>
                  </td>
                  <td data-label="Role">
                    <span className={`role-badge ${getRoleBadgeClass(user.role_nom || user.role)}`}>
                      {getRoleLabel(user.role_nom || user.role)}
                    </span>
                  </td>
                  <td data-label="Statut">{getStatusBadge(user.statut_compte)}</td>
                  <td data-label="Inscription">{formatDate(user.date_creation)}</td>
                  <td data-label="Actions" className="actions-cell">
                    <button className="btn-icon" title="Voir" onClick={() => handleView(user)}>
                      <FiEye />
                    </button>
                    {hasAdminRole && (
                      <>
                        <button className="btn-icon" title="Modifier" onClick={() => handleEdit(user)}>
                          <FiEdit2 />
                        </button>
                        <button className="btn-icon" title="Supprimer" onClick={() => handleDelete(user)}
                          style={{ color: 'var(--danger)' }}>
                          <FiTrash2 />
                        </button>
                      </>
                    )}
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

      {/* ========= MODAL: Voir utilisateur ========= */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setSelectedUser(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail de l'utilisateur</h3>
              <button className="modal-close" onClick={() => { setShowViewModal(false); setSelectedUser(null); }}><FiX /></button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
              ) : selectedUser ? (
                <div className="user-detail">
                  <div className="detail-header">
                    <div className="user-avatar-large">
                      {selectedUser.prenom?.[0]}{selectedUser.nom?.[0]}
                    </div>
                    <div>
                      <h2>{selectedUser.prenom} {selectedUser.nom}</h2>
                      <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Email</label>
                      <span>{selectedUser.email || 'Non renseigne'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Telephone</label>
                      <span>{selectedUser.telephone}</span>
                    </div>
                    <div className="detail-item">
                      <label>Statut</label>
                      {getStatusBadge(selectedUser.statut_compte)}
                    </div>
                    <div className="detail-item">
                      <label>Inscription</label>
                      <span>{formatDate(selectedUser.date_creation)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Derniere connexion</label>
                      <span>{selectedUser.derniere_connexion ? formatDate(selectedUser.derniere_connexion) : 'Jamais'}</span>
                    </div>
                  </div>
                  {selectedUser.enfants?.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4>Enfants ({selectedUser.enfants.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {selectedUser.enfants.map(e => (
                          <div key={e.id} style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong>{e.nom_pseudo}</strong> - {e.age} ans</span>
                            <span style={{ color: 'var(--text-muted)' }}>{e.code_connexion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowViewModal(false); setSelectedUser(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ========= MODAL: Modifier utilisateur ========= */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setSelectedUser(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier l'utilisateur</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setSelectedUser(null); }}><FiX /></button>
            </div>
            <div className="modal-body">
              {modalLoading && !selectedUser ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Prenom</label>
                    <input type="text" value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Statut du compte</label>
                    <select value={editForm.statutCompte} onChange={(e) => setEditForm({ ...editForm, statutCompte: e.target.value })}>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="suspendu">Suspendu</option>
                    </select>
                  </div>
                  {hasAdminRole && roles.length > 0 && (
                    <div className="form-group full-width">
                      <label>Role</label>
                      <select value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: parseInt(e.target.value) })}>
                        <option value="">-- Ne pas changer --</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{getRoleLabel(r.nom)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedUser(null); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={modalLoading}>
                <FiSave /> {modalLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========= MODAL: Creer un utilisateur ========= */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiUserPlus /> Creer un compte</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {createError && (
                  <div className="error-alert" style={{ marginBottom: '1rem' }}>
                    <FiAlertCircle />
                    <span>{createError}</span>
                    <button onClick={() => setCreateError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
                  </div>
                )}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Prenom *</label>
                    <input type="text" required value={createForm.prenom}
                      onChange={(e) => setCreateForm({ ...createForm, prenom: e.target.value })}
                      placeholder="Prenom" />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input type="text" required value={createForm.nom}
                      onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })}
                      placeholder="Nom" />
                  </div>
                  <div className="form-group">
                    <label>Telephone *</label>
                    <input type="tel" required value={createForm.telephone}
                      onChange={(e) => setCreateForm({ ...createForm, telephone: e.target.value })}
                      placeholder="Ex: +226 70 00 00 00" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="email@exemple.com" />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input type="password" required minLength={6} value={createForm.motDePasse}
                      onChange={(e) => setCreateForm({ ...createForm, motDePasse: e.target.value })}
                      placeholder="Minimum 6 caracteres" />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select required value={createForm.roleId}
                      onChange={(e) => setCreateForm({ ...createForm, roleId: parseInt(e.target.value) || '' })}>
                      <option value="">-- Selectionner un role --</option>
                      {creatableRoles.map(r => (
                        <option key={r.id} value={r.id}>{getRoleLabel(r.nom)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--accent-soft)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)' }}>
                  {userRole === 'VALIDATEUR'
                    ? 'En tant que validateur, vous pouvez creer des comptes gestionnaire de contenu.'
                    : 'En tant qu\'administrateur, vous pouvez creer des comptes validateur et gestionnaire de contenu.'
                  }
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  <FiUserPlus /> {modalLoading ? 'Creation...' : 'Creer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionUtilisateurs;
