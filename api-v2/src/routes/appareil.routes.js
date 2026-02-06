const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const appareilController = require('../controllers/appareil.controller');
const validate = require('../middlewares/validate');
const { authenticate, parentOnly, adminOnly } = require('../middlewares/auth');

router.use(authenticate);

/**
 * @route   GET /api/appareils
 * @desc    Lister ses appareils (parent) ou tous (admin)
 * @access  Private
 */
router.get('/', appareilController.getAll);

/**
 * @route   GET /api/appareils/:id
 * @desc    Obtenir un appareil
 * @access  Private
 */
router.get('/:id',
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  appareilController.getById
);

/**
 * @route   POST /api/appareils
 * @desc    Enregistrer un nouvel appareil
 * @access  Parent
 */
router.post('/',
  parentOnly,
  [
    body('nom').trim().notEmpty().withMessage('Nom requis'),
    body('type').optional().isIn(['tablette', 'telephone', 'autre']),
    body('imei').optional().isString(),
    body('modele').optional().isString(),
    body('systemeOs').optional().isString()
  ],
  validate,
  appareilController.create
);

/**
 * @route   PUT /api/appareils/:id
 * @desc    Modifier un appareil
 * @access  Parent
 */
router.put('/:id',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  appareilController.update
);

/**
 * @route   DELETE /api/appareils/:id
 * @desc    Supprimer un appareil
 * @access  Parent
 */
router.delete('/:id',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  appareilController.delete
);

/**
 * @route   PUT /api/appareils/:id/bloquer
 * @desc    Bloquer/débloquer un appareil
 * @access  Parent
 */
router.put('/:id/bloquer',
  parentOnly,
  [
    param('id').isInt().withMessage('ID invalide'),
    body('bloquer').isBoolean().withMessage('Valeur booléenne requise')
  ],
  validate,
  appareilController.toggleBloquer
);

/**
 * @route   GET /api/appareils/:id/sessions
 * @desc    Obtenir les sessions actives sur un appareil
 * @access  Parent
 */
router.get('/:id/sessions',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  appareilController.getSessions
);

/**
 * @route   POST /api/appareils/:id/deconnecter
 * @desc    Déconnecter toutes les sessions sur un appareil
 * @access  Parent
 */
router.post('/:id/deconnecter',
  parentOnly,
  [param('id').isInt().withMessage('ID invalide')],
  validate,
  appareilController.deconnecterSessions
);

module.exports = router;
