const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/foodorder.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get orders list with filtering
router.get('/', orderController.getOrders);

// Get order details
router.get('/:id', orderController.getOrderDetails);

// Update order status
router.put('/:id/status', [
    check('status', 'Status is required').isIn([
        'pending',
        'accepted',
        'processing',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded'
    ]),
    check('reason', 'Reason is required for cancel or refund')
        .if(check('status').isIn(['cancelled', 'refunded']))
        .not()
        .isEmpty()
], orderController.updateOrderStatus);

// Export orders
router.get('/export', orderController.exportOrders);

module.exports = router;
