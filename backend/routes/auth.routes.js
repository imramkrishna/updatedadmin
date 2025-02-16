const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Admin registration validation
const adminValidation = [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('phone', 'Phone number is required').not().isEmpty()
];

// Admin login validation
const loginValidation = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
];

// Password change validation
const passwordValidation = [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

// Public routes
router.post('/register/admin', adminValidation, authController.registerAdmin); 
router.post('/login', loginValidation, authController.loginAdmin);

// Protected routes (require authentication)
router.get('/profile', auth, authController.getProfile);
router.put('/change-password', auth, passwordValidation, authController.changePassword);
router.get('/me', auth, authController.me);

module.exports = router;
