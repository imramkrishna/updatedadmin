const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/fooddispatch.controller');

// Dispatch Configuration Routes
router.get('/config', dispatchController.getDispatchConfig);
router.put('/config', dispatchController.updateDispatchConfig);

// Dispatch Zone Routes
router.post('/zones', dispatchController.createDispatchZone);
router.get('/zones', dispatchController.getDispatchZones);
router.put('/zones/:id', dispatchController.updateDispatchZone);

// Order Assignment Routes
router.post('/assign', dispatchController.assignOrder);
router.get('/logs', dispatchController.getDispatchLogs);

module.exports = router;
