const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ============================================
// GESTION DES QUIZ
// ============================================

/**
 * Obtenir le quiz d'un contenu
 * GET /api/quiz/contenu/:contenuId
 */
const getByContenuId = asyncHandler(async (req, res) => {
  const { contenuId } = req.params;

  // Verifier que le contenu existe
  const [contenu] = await query('SELECT id, createur_id, statut FROM contenus WHERE id = ?', [contenuId]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  // Verifier les droits (createur, validateur, ou admin)
  const isCreateur = contenu.createur_id === req.user.id;
  const isValidateurOrAdmin = ['validateur', 'admin'].includes(req.user.role);

  if (!isCreateur && !isValidateurOrAdmin) {
    throw ApiError.forbidden('Acces non autorise');
  }

  // Recuperer le quiz
  const [quiz] = await query('SELECT * FROM quiz WHERE contenu_id = ?', [contenuId]);

  if (!quiz) {
    return res.json({
      success: true,
      data: null,
      message: 'Aucun quiz associe a ce contenu'
    });
  }

  // Recuperer les questions et reponses
  const questions = await query(
    `SELECT * FROM questions WHERE quiz_id = ? ORDER BY ordre`,
    [quiz.id]
  );

  for (let question of questions) {
    const reponses = await query(
      `SELECT id, texte, est_correcte, ordre FROM reponses WHERE question_id = ? ORDER BY ordre`,
      [question.id]
    );
    question.reponses = reponses;
  }

  res.json({
    success: true,
    data: {
      ...quiz,
      questions
    }
  });
});

/**
 * Creer ou modifier le quiz d'un contenu
 * POST /api/quiz/contenu/:contenuId
 */
const createOrUpdate = asyncHandler(async (req, res) => {
  const { contenuId } = req.params;
  const {
    titre, description, tempsLimiteMinutes, scoreMinimum,
    melangerQuestions, afficherCorrection, questions
  } = req.body;

  // Verifier que le contenu existe et appartient a l'utilisateur
  const [contenu] = await query('SELECT id, createur_id, statut FROM contenus WHERE id = ?', [contenuId]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  if (contenu.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Vous ne pouvez modifier que vos propres contenus');
  }

  // Verifier le statut
  if (!['brouillon', 'a_amender'].includes(contenu.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie');
  }

  // Valider les questions
  if (!questions || questions.length === 0) {
    throw ApiError.badRequest('Le quiz doit avoir au moins une question');
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.texte || q.texte.trim().length === 0) {
      throw ApiError.badRequest(`Question ${i + 1}: le texte est requis`);
    }
    if (!q.reponses || q.reponses.length < 2) {
      throw ApiError.badRequest(`Question ${i + 1}: au moins 2 reponses sont requises`);
    }
    const correctes = q.reponses.filter(r => r.estCorrecte);
    if (correctes.length === 0) {
      throw ApiError.badRequest(`Question ${i + 1}: au moins une reponse correcte est requise`);
    }
    if (q.type === 'vrai_faux' && q.reponses.length !== 2) {
      throw ApiError.badRequest(`Question ${i + 1}: une question Vrai/Faux doit avoir exactement 2 reponses`);
    }
  }

  // Verifier si un quiz existe deja
  const [existingQuiz] = await query('SELECT id FROM quiz WHERE contenu_id = ?', [contenuId]);

  let quizId;

  if (existingQuiz) {
    // Mettre a jour le quiz existant
    quizId = existingQuiz.id;

    await query(
      `UPDATE quiz SET
        titre = ?, description = ?, temps_limite_minutes = ?,
        score_minimum = ?, melanger_questions = ?, afficher_correction = ?,
        nombre_questions = ?
       WHERE id = ?`,
      [
        titre || `Quiz: ${contenu.titre}`,
        description || null,
        tempsLimiteMinutes || 0,
        scoreMinimum || 60,
        melangerQuestions !== false,
        afficherCorrection !== false,
        questions.length,
        quizId
      ]
    );

    // Supprimer les anciennes questions et reponses
    await query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);
  } else {
    // Creer un nouveau quiz
    const result = await query(
      `INSERT INTO quiz
       (contenu_id, titre, description, temps_limite_minutes, score_minimum,
        melanger_questions, afficher_correction, nombre_questions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contenuId,
        titre || `Quiz: ${contenu.titre}`,
        description || null,
        tempsLimiteMinutes || 0,
        scoreMinimum || 60,
        melangerQuestions !== false,
        afficherCorrection !== false,
        questions.length
      ]
    );
    quizId = result.insertId;
  }

  // Inserer les nouvelles questions et reponses
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const questionResult = await query(
      `INSERT INTO questions (quiz_id, texte, type, image_url, explication, points, ordre)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        quizId,
        q.texte,
        q.type || 'choix_unique',
        q.imageUrl || null,
        q.explication || null,
        q.points || 1,
        i + 1
      ]
    );

    const questionId = questionResult.insertId;

    // Inserer les reponses
    for (let j = 0; j < q.reponses.length; j++) {
      const r = q.reponses[j];
      await query(
        `INSERT INTO reponses (question_id, texte, est_correcte, ordre)
         VALUES (?, ?, ?, ?)`,
        [questionId, r.texte, r.estCorrecte || false, j + 1]
      );
    }
  }

  res.status(existingQuiz ? 200 : 201).json({
    success: true,
    message: existingQuiz ? 'Quiz mis a jour' : 'Quiz cree',
    data: { quizId }
  });
});

/**
 * Supprimer le quiz d'un contenu
 * DELETE /api/quiz/contenu/:contenuId
 */
const deleteQuiz = asyncHandler(async (req, res) => {
  const { contenuId } = req.params;

  // Verifier que le contenu existe et appartient a l'utilisateur
  const [contenu] = await query('SELECT id, createur_id, statut FROM contenus WHERE id = ?', [contenuId]);

  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  if (contenu.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Vous ne pouvez modifier que vos propres contenus');
  }

  if (!['brouillon', 'a_amender'].includes(contenu.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie');
  }

  const [quiz] = await query('SELECT id FROM quiz WHERE contenu_id = ?', [contenuId]);

  if (!quiz) {
    throw ApiError.notFound('Quiz non trouve');
  }

  // La suppression en cascade supprimera les questions et reponses
  await query('DELETE FROM quiz WHERE id = ?', [quiz.id]);

  res.json({
    success: true,
    message: 'Quiz supprime'
  });
});

// ============================================
// GESTION DES QUESTIONS
// ============================================

/**
 * Ajouter une question a un quiz
 * POST /api/quiz/:quizId/questions
 */
const addQuestion = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { texte, type, imageUrl, explication, points, reponses } = req.body;

  // Verifier que le quiz existe et recuperer le contenu
  const [quiz] = await query(
    `SELECT q.*, c.createur_id, c.statut
     FROM quiz q
     JOIN contenus c ON q.contenu_id = c.id
     WHERE q.id = ?`,
    [quizId]
  );

  if (!quiz) {
    throw ApiError.notFound('Quiz non trouve');
  }

  if (quiz.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acces non autorise');
  }

  if (!['brouillon', 'a_amender'].includes(quiz.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie');
  }

  // Valider les reponses
  if (!reponses || reponses.length < 2) {
    throw ApiError.badRequest('Au moins 2 reponses sont requises');
  }

  const correctes = reponses.filter(r => r.estCorrecte);
  if (correctes.length === 0) {
    throw ApiError.badRequest('Au moins une reponse correcte est requise');
  }

  // Obtenir le prochain ordre
  const [maxOrder] = await query('SELECT MAX(ordre) as max FROM questions WHERE quiz_id = ?', [quizId]);
  const ordre = (maxOrder.max || 0) + 1;

  // Inserer la question
  const questionResult = await query(
    `INSERT INTO questions (quiz_id, texte, type, image_url, explication, points, ordre)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [quizId, texte, type || 'choix_unique', imageUrl || null, explication || null, points || 1, ordre]
  );

  const questionId = questionResult.insertId;

  // Inserer les reponses
  for (let i = 0; i < reponses.length; i++) {
    const r = reponses[i];
    await query(
      `INSERT INTO reponses (question_id, texte, est_correcte, ordre)
       VALUES (?, ?, ?, ?)`,
      [questionId, r.texte, r.estCorrecte || false, i + 1]
    );
  }

  // Mettre a jour le nombre de questions
  await query('UPDATE quiz SET nombre_questions = nombre_questions + 1 WHERE id = ?', [quizId]);

  res.status(201).json({
    success: true,
    message: 'Question ajoutee',
    data: { questionId }
  });
});

/**
 * Modifier une question
 * PUT /api/quiz/questions/:questionId
 */
const updateQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { texte, type, imageUrl, explication, points, reponses } = req.body;

  // Verifier que la question existe et recuperer le contenu
  const [question] = await query(
    `SELECT q.*, qz.id as quiz_id, c.createur_id, c.statut
     FROM questions q
     JOIN quiz qz ON q.quiz_id = qz.id
     JOIN contenus c ON qz.contenu_id = c.id
     WHERE q.id = ?`,
    [questionId]
  );

  if (!question) {
    throw ApiError.notFound('Question non trouvee');
  }

  if (question.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acces non autorise');
  }

  if (!['brouillon', 'a_amender'].includes(question.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie');
  }

  // Mettre a jour la question
  const updates = [];
  const values = [];

  if (texte !== undefined) { updates.push('texte = ?'); values.push(texte); }
  if (type !== undefined) { updates.push('type = ?'); values.push(type); }
  if (imageUrl !== undefined) { updates.push('image_url = ?'); values.push(imageUrl); }
  if (explication !== undefined) { updates.push('explication = ?'); values.push(explication); }
  if (points !== undefined) { updates.push('points = ?'); values.push(points); }

  if (updates.length > 0) {
    values.push(questionId);
    await query(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  // Si des reponses sont fournies, les remplacer
  if (reponses && reponses.length >= 2) {
    const correctes = reponses.filter(r => r.estCorrecte);
    if (correctes.length === 0) {
      throw ApiError.badRequest('Au moins une reponse correcte est requise');
    }

    // Supprimer les anciennes reponses
    await query('DELETE FROM reponses WHERE question_id = ?', [questionId]);

    // Inserer les nouvelles reponses
    for (let i = 0; i < reponses.length; i++) {
      const r = reponses[i];
      await query(
        `INSERT INTO reponses (question_id, texte, est_correcte, ordre)
         VALUES (?, ?, ?, ?)`,
        [questionId, r.texte, r.estCorrecte || false, i + 1]
      );
    }
  }

  res.json({
    success: true,
    message: 'Question mise a jour'
  });
});

/**
 * Supprimer une question
 * DELETE /api/quiz/questions/:questionId
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;

  // Verifier que la question existe et recuperer le contenu
  const [question] = await query(
    `SELECT q.*, qz.id as quiz_id, c.createur_id, c.statut
     FROM questions q
     JOIN quiz qz ON q.quiz_id = qz.id
     JOIN contenus c ON qz.contenu_id = c.id
     WHERE q.id = ?`,
    [questionId]
  );

  if (!question) {
    throw ApiError.notFound('Question non trouvee');
  }

  if (question.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acces non autorise');
  }

  if (!['brouillon', 'a_amender'].includes(question.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie');
  }

  // Supprimer la question (cascade supprime les reponses)
  await query('DELETE FROM questions WHERE id = ?', [questionId]);

  // Mettre a jour le nombre de questions
  await query('UPDATE quiz SET nombre_questions = nombre_questions - 1 WHERE id = ?', [question.quiz_id]);

  // Reordonner les questions restantes
  await query(
    `SET @rank = 0;
     UPDATE questions SET ordre = (@rank := @rank + 1)
     WHERE quiz_id = ? ORDER BY ordre`,
    [question.quiz_id]
  );

  res.json({
    success: true,
    message: 'Question supprimee'
  });
});

/**
 * Reordonner les questions d'un quiz
 * PUT /api/quiz/:quizId/questions/reorder
 */
const reorderQuestions = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { questionIds } = req.body;

  if (!questionIds || !Array.isArray(questionIds)) {
    throw ApiError.badRequest('Liste des IDs de questions requise');
  }

  // Verifier que le quiz existe et recuperer le contenu
  const [quiz] = await query(
    `SELECT q.*, c.createur_id, c.statut
     FROM quiz q
     JOIN contenus c ON q.contenu_id = c.id
     WHERE q.id = ?`,
    [quizId]
  );

  if (!quiz) {
    throw ApiError.notFound('Quiz non trouve');
  }

  if (quiz.createur_id !== req.user.id && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acces non autorise');
  }

  if (!['brouillon', 'a_amender'].includes(quiz.statut)) {
    throw ApiError.badRequest('Ce contenu ne peut plus etre modifie');
  }

  // Mettre a jour l'ordre
  for (let i = 0; i < questionIds.length; i++) {
    await query('UPDATE questions SET ordre = ? WHERE id = ? AND quiz_id = ?',
      [i + 1, questionIds[i], quizId]);
  }

  res.json({
    success: true,
    message: 'Ordre des questions mis a jour'
  });
});

module.exports = {
  getByContenuId,
  createOrUpdate,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions
};
