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

  // Verifier les droits d'acces
  const isCreateur = contenu.createur_id === req.user.id;
  const isValidateurOrAdmin = ['VALIDATEUR', 'ADMIN', 'validateur', 'admin'].includes(req.user.role);
  const isEnfant = req.user.role === 'ENFANT' || req.user.enfant_id;
  const isContenuPublie = contenu.statut === 'publie';

  // Les enfants peuvent acceder aux quiz des contenus publies
  // Les createurs, validateurs et admins peuvent acceder a tous les quiz
  if (!isCreateur && !isValidateurOrAdmin && !(isEnfant && isContenuPublie)) {
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

  // Pour les enfants, ne pas exposer directement les reponses correctes
  // Elles seront verifiees cote serveur lors de la soumission
  const hideCorrectAnswers = isEnfant && isContenuPublie;

  for (let question of questions) {
    const reponses = await query(
      `SELECT id, texte, est_correcte, ordre FROM reponses WHERE question_id = ? ORDER BY ordre`,
      [question.id]
    );
    // Pour les enfants, on garde est_correcte pour la verification client-side
    // mais on pourrait le masquer si on veut une verification 100% serveur
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

// ============================================
// LEVEL SYSTEM — Progressive XP thresholds
// ============================================

/**
 * XP thresholds for each level (progressive):
 * Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 450,
 * Level 5: 700, Level 6: 1000, Level 7: 1350, Level 8: 1750, ...
 * Gap formula: 100 + 50*(level-2) for level >= 2
 */
function getXpThreshold(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += 100 + 50 * (i - 2);
  }
  return total;
}

function getLevelFromXp(xp) {
  let level = 1;
  while (getXpThreshold(level + 1) <= xp) {
    level++;
  }
  return level;
}

// ============================================
// BADGE AUTO-CHECK
// ============================================

/**
 * Check and award badges for an enfant after a quiz/content completion
 * Returns list of newly awarded badge names
 */
const checkAndAwardBadges = async (enfantId) => {
  const newBadges = [];

  // Get all active badges not yet earned by this child
  const availableBadges = await query(
    `SELECT b.* FROM badges b
     WHERE b.est_actif = TRUE
       AND b.id NOT IN (SELECT badge_id FROM badges_enfants WHERE enfant_id = ?)`,
    [enfantId]
  );

  if (availableBadges.length === 0) return newBadges;

  // Gather stats for badge evaluation
  const [quizStats] = await query(
    `SELECT
       COUNT(CASE WHEN ha.est_complete = TRUE AND ha.score IS NOT NULL
                   AND (ha.score * 100 / NULLIF(
                     (SELECT COUNT(*) FROM questions q
                      JOIN quiz qz ON q.quiz_id = qz.id
                      WHERE qz.contenu_id = ha.contenu_id), 0)) >= 60
             THEN 1 END) as quiz_reussis,
       COUNT(CASE WHEN ha.est_complete = TRUE AND ha.score IS NOT NULL
                   AND ha.score = (SELECT COUNT(*) FROM questions q
                      JOIN quiz qz ON q.quiz_id = qz.id
                      WHERE qz.contenu_id = ha.contenu_id)
             THEN 1 END) as quiz_parfaits,
       COUNT(CASE WHEN ha.est_complete = TRUE THEN 1 END) as contenus_termines
     FROM historique_apprentissage ha
     WHERE ha.enfant_id = ?`,
    [enfantId]
  );

  // Domains explored (completed at least 1 content in each active domain)
  const [domainStats] = await query(
    `SELECT
       (SELECT COUNT(*) FROM domaines_educatifs WHERE est_actif = TRUE) as total_domaines,
       COUNT(DISTINCT c.domaine_id) as domaines_explores
     FROM historique_apprentissage ha
     JOIN contenus c ON ha.contenu_id = c.id
     WHERE ha.enfant_id = ? AND ha.est_complete = TRUE`,
    [enfantId]
  );

  // Current level
  const [enfant] = await query(
    'SELECT points_xp, niveau_global FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  // Consecutive days (streak)
  const streakDays = await query(
    `SELECT DISTINCT DATE(date_acces) as jour
     FROM historique_apprentissage
     WHERE enfant_id = ?
     ORDER BY jour DESC
     LIMIT 30`,
    [enfantId]
  );

  let streak = 0;
  if (streakDays.length > 0) {
    streak = 1;
    for (let i = 1; i < streakDays.length; i++) {
      const prev = new Date(streakDays[i - 1].jour);
      const curr = new Date(streakDays[i].jour);
      const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Evaluate each badge
  for (const badge of availableBadges) {
    let earned = false;

    switch (badge.nom) {
      case 'Premier Quiz':
        earned = quizStats.quiz_reussis >= 1;
        break;
      case 'Érudit':
        earned = quizStats.quiz_reussis >= 10;
        break;
      case 'Perfectionniste':
        earned = quizStats.quiz_parfaits >= 3;
        break;
      case 'Premier Pas':
        earned = quizStats.contenus_termines >= 1;
        break;
      case 'Lecteur Assidu':
        earned = quizStats.contenus_termines >= 5;
        break;
      case 'Explorateur':
        earned = domainStats.total_domaines > 0 &&
                 domainStats.domaines_explores >= domainStats.total_domaines;
        break;
      case 'Expert':
        earned = (enfant?.niveau_global || 1) >= 5;
        break;
      case 'Assidu':
        earned = streak >= 7;
        break;
    }

    if (earned) {
      try {
        await query(
          'INSERT INTO badges_enfants (enfant_id, badge_id) VALUES (?, ?)',
          [enfantId, badge.id]
        );
        // Award bonus XP from badge
        if (badge.points_bonus > 0) {
          await query(
            'UPDATE profils_enfants SET points_xp = points_xp + ? WHERE id = ?',
            [badge.points_bonus, enfantId]
          );
        }
        newBadges.push(badge.nom);
      } catch (e) {
        // Duplicate key — badge already awarded (race condition), ignore
      }
    }
  }

  return newBadges;
};

// ============================================
// QUIZ RESULT SUBMISSION (ENFANT)
// ============================================

/**
 * Submit quiz result — saves score, awards XP, checks badges, auto-levels
 * POST /api/quiz/contenu/:contenuId/resultat
 *
 * Body: { score: int, totalQuestions: int }
 *
 * Logic:
 * - Score < 60%: save score but NO XP
 * - First attempt >= 60%: award full content XP + mark complete
 * - Replay with higher score: update score, award XP difference if applicable
 * - Replay with lower score: keep best score, no XP change
 */
const submitResult = asyncHandler(async (req, res) => {
  const { contenuId } = req.params;
  const { score, totalQuestions } = req.body;
  const enfantId = req.user.id;

  if (score === undefined || totalQuestions === undefined) {
    throw ApiError.badRequest('score et totalQuestions sont requis');
  }

  // Verify content exists and is published
  const [contenu] = await query(
    'SELECT id, points_xp, titre FROM contenus WHERE id = ? AND statut = "publie"',
    [contenuId]
  );
  if (!contenu) {
    throw ApiError.notFound('Contenu non trouve');
  }

  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const passed = percentage >= 60;

  // Check for existing completed attempt with a score (best score logic)
  const [existingAttempt] = await query(
    `SELECT id, score, points_gagnes, est_complete
     FROM historique_apprentissage
     WHERE enfant_id = ? AND contenu_id = ?
       AND score IS NOT NULL
     ORDER BY score DESC
     LIMIT 1`,
    [enfantId, contenuId]
  );

  let pointsGagnes = 0;
  let isNewBest = false;
  const bestScore = existingAttempt ? Math.max(existingAttempt.score, score) : score;

  if (!existingAttempt) {
    // First attempt — create or update historique entry
    // Check if there's an existing entry (from demarrerContenu)
    const [pendingEntry] = await query(
      `SELECT id FROM historique_apprentissage
       WHERE enfant_id = ? AND contenu_id = ? AND score IS NULL
       ORDER BY date_acces DESC LIMIT 1`,
      [enfantId, contenuId]
    );

    if (passed) {
      pointsGagnes = contenu.points_xp;
    }

    if (pendingEntry) {
      // Update existing entry
      await query(
        `UPDATE historique_apprentissage
         SET score = ?, progression = 100, est_complete = TRUE, points_gagnes = ?
         WHERE id = ?`,
        [score, pointsGagnes, pendingEntry.id]
      );
    } else {
      // Create new entry
      await query(
        `INSERT INTO historique_apprentissage
         (enfant_id, contenu_id, score, progression, est_complete, points_gagnes)
         VALUES (?, ?, ?, 100, TRUE, ?)`,
        [enfantId, contenuId, score, pointsGagnes]
      );
    }

    isNewBest = true;
  } else if (score > existingAttempt.score) {
    // Replay with higher score — update best score
    await query(
      'UPDATE historique_apprentissage SET score = ? WHERE id = ?',
      [score, existingAttempt.id]
    );

    // Award XP difference if now passing and previously didn't, or higher bracket
    const previousPassed = existingAttempt.points_gagnes > 0;
    if (passed && !previousPassed) {
      pointsGagnes = contenu.points_xp;
      await query(
        'UPDATE historique_apprentissage SET points_gagnes = ? WHERE id = ?',
        [pointsGagnes, existingAttempt.id]
      );
    }

    isNewBest = true;
  }
  // else: lower or equal score — keep existing, no changes

  // Award XP to child profile
  if (pointsGagnes > 0) {
    await query(
      'UPDATE profils_enfants SET points_xp = points_xp + ? WHERE id = ?',
      [pointsGagnes, enfantId]
    );
  }

  // Auto level-up
  const [updatedEnfant] = await query(
    'SELECT points_xp, niveau_global FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  const newLevel = getLevelFromXp(updatedEnfant.points_xp);
  const previousLevel = updatedEnfant.niveau_global;
  let leveledUp = false;

  if (newLevel > previousLevel) {
    await query(
      'UPDATE profils_enfants SET niveau_global = ? WHERE id = ?',
      [newLevel, enfantId]
    );
    leveledUp = true;
  }

  // Close any open session
  await query(
    `UPDATE sessions_utilisation
     SET date_fin = NOW(), duree_minutes = TIMESTAMPDIFF(MINUTE, date_debut, NOW())
     WHERE enfant_id = ? AND date_fin IS NULL
     ORDER BY date_debut DESC LIMIT 1`,
    [enfantId]
  );

  // Auto-check badges
  const newBadges = await checkAndAwardBadges(enfantId);

  // Re-fetch XP after badge bonuses
  const [finalEnfant] = await query(
    'SELECT points_xp, niveau_global FROM profils_enfants WHERE id = ?',
    [enfantId]
  );

  // Re-check level after badge bonus XP
  const finalLevel = getLevelFromXp(finalEnfant.points_xp);
  if (finalLevel > finalEnfant.niveau_global) {
    await query(
      'UPDATE profils_enfants SET niveau_global = ? WHERE id = ?',
      [finalLevel, enfantId]
    );
  }

  res.json({
    success: true,
    message: passed ? 'Quiz réussi !' : 'Quiz terminé, essaie encore pour débloquer les XP !',
    data: {
      score,
      totalQuestions,
      percentage: Math.round(percentage),
      passed,
      bestScore,
      isNewBest,
      pointsGagnes,
      totalXp: finalEnfant.points_xp,
      niveau: Math.max(finalLevel, finalEnfant.niveau_global),
      niveauPrecedent: previousLevel,
      leveledUp: finalLevel > previousLevel || leveledUp,
      xpPourProchainNiveau: getXpThreshold(Math.max(finalLevel, finalEnfant.niveau_global) + 1),
      newBadges
    }
  });
});

/**
 * Get level thresholds (public utility)
 * GET /api/quiz/levels
 */
const getLevels = asyncHandler(async (req, res) => {
  const levels = [];
  for (let i = 1; i <= 20; i++) {
    levels.push({ level: i, xpRequired: getXpThreshold(i) });
  }
  res.json({ success: true, data: levels });
});

module.exports = {
  getByContenuId,
  createOrUpdate,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  submitResult,
  getLevels,
  // Export helpers for use in other controllers
  getLevelFromXp,
  getXpThreshold,
  checkAndAwardBadges
};
