const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// User Management Routes
router.post('/create', userController.createUser);
router.get('/list', userController.getAllUsers);
router.put('/:id', userController.updateUser);

// Delivery Man Routes
router.post('/delivery-man/create', userController.createDeliveryMan);
router.get('/delivery-man/list', userController.getDeliveryMen);
router.put('/delivery-man/:id/status', userController.updateDeliveryManStatus);

// Admin Routes
router.post('/admin/create', userController.createAdmin);
router.get('/admin/list', userController.getAdmins);

// Authentication Routes
router.post('/login', userController.login);

module.exports = router;
