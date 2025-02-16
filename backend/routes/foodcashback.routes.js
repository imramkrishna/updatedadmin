const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const cashbackController = require('../controllers/foodcashback.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create cashback offer
router.post('/food/cashback',
    [
        check('title.en', 'English title is required').not().isEmpty(),
        check('title.ar', 'Arabic title is required').not().isEmpty(),
        check('cashbackType', 'Invalid cashback type').isIn(['percentage', 'amount']),
        check('amount', 'Amount must be a positive number').isFloat({ min: 0 }),
        check('minimumPurchase', 'Minimum purchase must be a positive number').isFloat({ min: 0 }),
        check('maximumDiscount', 'Maximum discount must be a positive number').isFloat({ min: 0 }),
        check('startDate', 'Start date is required').isISO8601(),
        check('endDate', 'End date is required').isISO8601(),
    ],
    cashbackController.createCashback
);

// Get all cashback offers
router.get('/food/cashbacks', cashbackController.getCashbacks);

// Update cashback status
router.patch('/:id/status/food',
    [
        check('status', 'Status must be a boolean').isBoolean()
    ],
    cashbackController.updateCashbackStatus
);

// Update cashback offer
router.put('/:id/food',
    [
        check('title.en', 'English title is required').optional().not().isEmpty(),
        check('title.ar', 'Arabic title is required').optional().not().isEmpty(),
        check('cashbackType', 'Invalid cashback type').optional().isIn(['percentage', 'amount']),
        check('amount', 'Amount must be a positive number').optional().isFloat({ min: 0 }),
        check('minimumPurchase', 'Minimum purchase must be a positive number').optional().isFloat({ min: 0 }),
        check('maximumDiscount', 'Maximum discount must be a positive number').optional().isFloat({ min: 0 }),
        check('startDate', 'Invalid start date').optional().isISO8601(),
        check('endDate', 'Invalid end date').optional().isISO8601(),
    ],
    cashbackController.updateCashback
);

module.exports = router;
