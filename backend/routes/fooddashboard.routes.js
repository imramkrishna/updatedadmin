const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/fooddashboard.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get dashboard statistics
router.get('/statistics', dashboardController.getStatistics);

// Get user list
router.get('/users', dashboardController.getUserList);

// Get user type statistics
router.get('/user-statistics', dashboardController.getUserTypeStatistics);

module.exports = router;
