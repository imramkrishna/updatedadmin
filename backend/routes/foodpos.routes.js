const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const posController = require('../controllers/foodpos.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get stores list
router.get('/stores', posController.getStores);

// Get products by store
router.get('/products/:storeId', posController.getProducts);

// Get or create customer
router.post('/customer', [
    check('phone', 'Phone number is required').not().isEmpty(),
    check('firstName', 'First name is required when creating new customer').if(check('email').exists()).not().isEmpty(),
    check('lastName', 'Last name is required when creating new customer').if(check('email').exists()).not().isEmpty(),
    check('email', 'Please include a valid email').if(check('email').exists()).isEmail()
], posController.getOrCreateCustomer);

// Calculate order total
router.post('/calculate-total', [
    check('items', 'Items are required').isArray(),
    check('items.*.productId', 'Product ID is required for each item').not().isEmpty(),
    check('items.*.quantity', 'Quantity must be a positive number').isInt({ min: 1 }),
    check('storeId', 'Store ID is required').not().isEmpty()
], posController.calculateTotal);

// Create order
router.post('/order', [
    check('customerId', 'Customer ID is required').not().isEmpty(),
    check('storeId', 'Store ID is required').not().isEmpty(),
    check('items', 'Items are required').isArray(),
    check('items.*.productId', 'Product ID is required for each item').not().isEmpty(),
    check('items.*.quantity', 'Quantity must be a positive number').isInt({ min: 1 }),
    check('paymentMethod', 'Payment method is required').isIn(['cash', 'card', 'wallet'])
], posController.createOrder);

module.exports = router;
