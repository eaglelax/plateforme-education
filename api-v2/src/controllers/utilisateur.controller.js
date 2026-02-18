const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtenir son propre profil
 * GET /api/utilisateurs/profil
 */
const getProfil = asyncHandler(async (req, res) => {
  const [user] = await query(
    `SELECT u.id, u.nom, u.prenom, u.telephone, u.email, u.statut_compte,
            u.derniere_connexion, u.date_creation, r.nom as role,
            (SELECT COUNT(*) FROM profils_enfants WHERE parent_id = u.id) as enfants_count,
            (SELECT COUNT(*) FROM appareils WHERE parent_id = u.id) as appareils_count
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  // Récupérer les enfants
  const enfants = await query(
    `SELECT id, nom_pseudo, avatar, age, code_connexion, statut, points_xp, niveau_global
     FROM profils_enfants
     WHERE parent_id = ?
     ORDER BY date_creation DESC`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      ...user,
      enfants
    }
  });
});

/**
 * Mettre à jour son profil
 * PUT /api/utilisateurs/profil
 */
const updateProfil = asyncHandler(async (req, res) => {
  const { nom, prenom, email } = req.body;

  // Vérifier si l'email est déjà pris
  if (email) {
    const [existing] = await query(
      'SELECT id FROM utilisateurs WHERE email = ? AND id != ?',
      [email, req.user.id]
    );
    if (existing) {
      throw ApiError.conflict('Cet email est déjà utilisé');
    }
  }

  // Construire la requête de mise à jour
  const updates = [];
  const values = [];

  if (nom) {
    updates.push('nom = ?');
    values.push(nom);
  }
  if (prenom) {
    updates.push('prenom = ?');
    values.push(prenom);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email || null);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(req.user.id);

  await query(
    `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // Récupérer le profil mis à jour
  const [user] = await query(
    `SELECT id, nom, prenom, telephone, email, statut_compte
     FROM utilisateurs WHERE id = ?`,
    [req.user.id]
  );

  res.json({
    success: true,
    message: 'Profil mis à jour',
    data: user
  });
});

/**
 * Lister tous les utilisateurs (Admin)
 * GET /api/utilisateurs
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { role, statut, search } = req.query;

  // Construction de la requête avec filtres
  let whereClause = '1=1';
  const params = [];

  if (role) {
    whereClause += ' AND r.nom = ?';
    params.push(role);
  }

  if (statut) {
    whereClause += ' AND u.statut_compte = ?';
    params.push(statut);
  }

  if (search) {
    whereClause += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ? OR u.telephone LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Compter le total
  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE ${whereClause}`,
    params
  );

  // Récupérer les utilisateurs
  const users = await query(
    `SELECT u.id, u.nom, u.prenom, u.telephone, u.email, u.statut_compte,
            u.derniere_connexion, u.date_creation, r.nom as role,
            (SELECT COUNT(*) FROM profils_enfants WHERE parent_id = u.id) as enfants_count
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE ${whereClause}
     ORDER BY u.date_creation DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    success: true,
    data: users,
    pagination: paginationMeta(countResult.total, page, limit)
  });
});

/**
 * Obtenir un utilisateur par ID (Admin)
 * GET /api/utilisateurs/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [user] = await query(
    `SELECT u.id, u.nom, u.prenom, u.telephone, u.email, u.statut_compte,
            u.derniere_connexion, u.date_creation, r.nom as role, r.id as role_id
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [id]
  );

  if (!user) {
    throw ApiError.notFound('Utilisateur non trouvé');
  }

  // Récupérer les enfants
  const enfants = await query(
    `SELECT id, nom_pseudo, avatar, age, code_connexion, statut, date_creation
     FROM profils_enfants
     WHERE parent_id = ?`,
    [id]
  );

  // Récupérer les appareils
  const appareils = await query(
    `SELECT id, nom, type, imei, statut, derniere_connexion
     FROM appareils
     WHERE parent_id = ?`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...user,
      enfants,
      appareils
    }
  });
});

/**
 * Modifier un utilisateur (Admin)
 * PUT /api/utilisateurs/:id
 */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, statutCompte } = req.body;

  // Vérifier que l'utilisateur existe
  const [existing] = await query('SELECT id FROM utilisateurs WHERE id = ?', [id]);
  if (!existing) {
    throw ApiError.notFound('Utilisateur non trouvé');
  }

  // Construire la requête de mise à jour
  const updates = [];
  const values = [];

  if (nom) {
    updates.push('nom = ?');
    values.push(nom);
  }
  if (prenom) {
    updates.push('prenom = ?');
    values.push(prenom);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (statutCompte) {
    updates.push('statut_compte = ?');
    values.push(statutCompte);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('Aucune donnée à mettre à jour');
  }

  values.push(id);

  await query(
    `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Utilisateur mis à jour'
  });
});

/**
 * Supprimer un utilisateur (Admin)
 * DELETE /api/utilisateurs/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier que l'utilisateur existe
  const [user] = await query(
    'SELECT id, role_id FROM utilisateurs WHERE id = ?',
    [id]
  );

  if (!user) {
    throw ApiError.notFound('Utilisateur non trouvé');
  }

  // Empêcher la suppression de soi-même
  if (parseInt(id) === req.user.id) {
    throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
  }

  // Supprimer l'utilisateur (cascade supprime enfants, appareils, etc.)
  await query('DELETE FROM utilisateurs WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Utilisateur supprimé'
  });
});

/**
 * Changer le rôle d'un utilisateur (Admin)
 * PUT /api/utilisateurs/:id/role
 */
const changeRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleId } = req.body;

  // Vérifier que l'utilisateur existe
  const [user] = await query('SELECT id FROM utilisateurs WHERE id = ?', [id]);
  if (!user) {
    throw ApiError.notFound('Utilisateur non trouvé');
  }

  // Vérifier que le rôle existe
  const [role] = await query('SELECT id, nom FROM roles WHERE id = ?', [roleId]);
  if (!role) {
    throw ApiError.notFound('Rôle non trouvé');
  }

  // Empêcher de changer son propre rôle
  if (parseInt(id) === req.user.id) {
    throw ApiError.badRequest('Vous ne pouvez pas changer votre propre rôle');
  }

  await query('UPDATE utilisateurs SET role_id = ? WHERE id = ?', [roleId, id]);

  res.json({
    success: true,
    message: `Rôle changé en ${role.nom}`
  });
});

/**
 * Creer un utilisateur avec un role specifique
 * POST /api/utilisateurs
 * - VALIDATEUR peut creer des GESTIONNAIRE_CONTENU
 * - ADMIN peut creer des VALIDATEUR et GESTIONNAIRE_CONTENU
 */
const createUser = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, email, motDePasse, roleId } = req.body;

  // Verifier que le role demande existe
  const [role] = await query('SELECT id, nom FROM roles WHERE id = ?', [roleId]);
  if (!role) {
    throw ApiError.notFound('Role non trouve');
  }

  const roleName = role.nom.toUpperCase();
  const callerRole = req.user.role;

  // Verifier les permissions de creation selon le role de l'appelant
  if (callerRole === 'VALIDATEUR') {
    if (roleName !== 'GESTIONNAIRE_CONTENU') {
      throw ApiError.forbidden('Un validateur ne peut creer que des comptes gestionnaire de contenu');
    }
  } else if (callerRole === 'ADMIN') {
    if (!['VALIDATEUR', 'GESTIONNAIRE_CONTENU'].includes(roleName)) {
      throw ApiError.forbidden('Vous ne pouvez creer que des comptes validateur ou gestionnaire de contenu');
    }
  } else {
    throw ApiError.forbidden('Vous n\'avez pas les droits pour creer des utilisateurs');
  }

  // Verifier si le telephone existe deja
  const [existingPhone] = await query(
    'SELECT id FROM utilisateurs WHERE telephone = ?',
    [telephone]
  );
  if (existingPhone) {
    throw ApiError.conflict('Ce numero de telephone est deja utilise');
  }

  // Verifier si l'email existe deja
  if (email) {
    const [existingEmail] = await query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );
    if (existingEmail) {
      throw ApiError.conflict('Cet email est deja utilise');
    }
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(motDePasse, 12);

  // Creer l'utilisateur
  const result = await query(
    `INSERT INTO utilisateurs (nom, prenom, telephone, email, mot_de_passe, role_id, statut_compte)
     VALUES (?, ?, ?, ?, ?, ?, 'actif')`,
    [nom, prenom, telephone, email || null, hashedPassword, roleId]
  );

  // Recuperer l'utilisateur cree
  const [newUser] = await query(
    `SELECT u.id, u.nom, u.prenom, u.telephone, u.email, u.statut_compte, r.nom as role
     FROM utilisateurs u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: `Compte ${roleName} cree avec succes`,
    data: newUser
  });
});

module.exports = {
  getProfil,
  updateProfil,
  getAll,
  getById,
  update,
  delete: deleteUser,
  changeRole,
  createUser
};
