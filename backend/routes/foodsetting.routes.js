const express = require('express');
const router = express.Router();
const settingController = require('../controllers/foodsetting.controller');

// Business Settings Routes
router.get('/business-settings', settingController.getBusinessSettings);
router.put('/business-settings/:key', settingController.updateBusinessSetting);
router.post("/business-settings", settingController.createOrUpdateBusiness);
router.put('/business-settings', settingController.createOrUpdateBusiness);
router.put('/update-bulk', settingController.updateBusinessSetting);


// Payment Method Routes
router.get('/payment-methods', settingController.getPaymentMethods);
router.put('/payment-methods/:id', settingController.updatePaymentMethod);

// Notification Template Routes
router.get('/notification-templates', settingController.getNotificationTemplates);
router.put('/notification-templates/:type', settingController.updateNotificationTemplate);

// Language Routes
router.get('/languages', settingController.getLanguages);
router.post('/languages', settingController.createLanguage);
router.put('/languages/:code', settingController.updateLanguage);

module.exports = router;
