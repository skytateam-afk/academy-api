const express = require('express');
const router = express.Router();
const settingsController = require('./controller');
const { authenticateToken } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const uploadImage = require('../../middleware/uploadImage');

// Institution settings routes (public read)
router.get('/institution', settingsController.getInstitutionSettings);

// All subsequent routes require authentication
router.use(authenticateToken);

// User settings routes
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Institution settings routes (admin write)
router.put('/institution', requirePermission('settings.update'), settingsController.updateInstitutionSettings);

// Institution logo management (admin only)
router.post('/institution/logo',
    requirePermission('settings.update'),
    uploadImage.single('logo'),
    settingsController.uploadInstitutionLogo
);
router.delete('/institution/logo/:type',
    requirePermission('settings.update'),
    settingsController.deleteInstitutionLogo
);

// XP Activities management (admin only)
router.get('/xp-activities',
    requirePermission('settings.update'),
    settingsController.getXPActivities
);
router.post('/xp-activities',
    requirePermission('settings.update'),
    settingsController.createXPActivity
);
router.put('/xp-activities/:id',
    requirePermission('settings.update'),
    settingsController.updateXPActivity
);
router.patch('/xp-activities/:id/toggle',
    requirePermission('settings.update'),
    settingsController.toggleXPActivity
);
router.delete('/xp-activities/:id',
    requirePermission('settings.update'),
    settingsController.deleteXPActivity
);

module.exports = router;
