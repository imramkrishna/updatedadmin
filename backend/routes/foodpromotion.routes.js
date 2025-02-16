const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const promotionController = require('../controllers/foodpromotion.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateZoneId } = require('../middleware/zoneValidation');

// All routes require authentication
router.use(auth);

// Campaign routes
router.post('/campaigns',
    upload.single('image'),
    [
        check('title', 'Title is required').not().isEmpty(),
        check('startDate', 'Start date is required').isISO8601(),
        check('endDate', 'End date is required').isISO8601(),
        check('type', 'Invalid campaign type').isIn(['general', 'store', 'product']),
        check('discountType', 'Invalid discount type').isIn(['percentage', 'fixed']),
        check('discountValue', 'Discount value must be a positive number').isFloat({ min: 0 }),
        check('minimumPurchase', 'Minimum purchase must be a non-negative number').optional().isFloat({ min: 0 }),
        check('maximumDiscount', 'Maximum discount must be a positive number').optional().isFloat({ min: 0 }),
        check('usageLimit', 'Usage limit must be a positive integer').optional().isInt({ min: 1 })
    ],
    promotionController.createCampaign
);

router.get('/campaigns', promotionController.listCampaigns);

// Coupon routes
router.post('/coupons', [
    check('code', 'Coupon code is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('startDate', 'Start date is required').isISO8601(),
    check('endDate', 'End date is required').isISO8601(),
    check('type', 'Invalid coupon type').isIn(['general', 'store', 'product', 'category', 'first_order']),
    check('discountType', 'Invalid discount type').isIn(['percentage', 'fixed']),
    check('discountValue', 'Discount value must be a positive number').isFloat({ min: 0 }),
    check('minimumPurchase', 'Minimum purchase must be a non-negative number').optional().isFloat({ min: 0 }),
    check('maximumDiscount', 'Maximum discount must be a positive number').optional().isFloat({ min: 0 }),
    check('usageLimit.perUser', 'Per user limit must be a positive integer').optional().isInt({ min: 1 }),
    check('usageLimit.total', 'Total usage limit must be a positive integer').optional().isInt({ min: 1 }),
    check('zone', 'Zone is required').not().isEmpty()
], promotionController.createCoupon);

router.get('/coupons', promotionController.listCoupons);

// Update coupon status route
router.patch('/coupons/:id/status', promotionController.updateCouponStatus);

router.post('/coupons/validate', [
    check('code', 'Coupon code is required').not().isEmpty(),
    check('userId', 'User ID is required').not().isEmpty(),
    check('storeId', 'Store ID is required').not().isEmpty(),
    check('products', 'Products array is required').isArray(),
    check('totalAmount', 'Total amount must be a positive number').isFloat({ min: 0 })
], promotionController.validateCoupon);

// Delete coupon route
router.delete('/coupons/:id', promotionController.deleteCoupon);

// Flash Deal routes
router.post('/flash-deals',
    upload.single('image'),
    [
        check('title', 'Title is required').not().isEmpty(),
        check('startDate', 'Start date is required').isISO8601(),
        check('endDate', 'End date is required').isISO8601(),
        check('products', 'Products array is required').isArray(),
        check('products.*.product', 'Product ID is required').not().isEmpty(),
        check('products.*.discountType', 'Invalid discount type').isIn(['percentage', 'fixed']),
        check('products.*.discountValue', 'Discount value must be a positive number').isFloat({ min: 0 }),
        check('products.*.stock', 'Stock must be a non-negative integer').isInt({ min: 0 }),
        check('products.*.maxPurchaseQty', 'Maximum purchase quantity must be a positive integer').isInt({ min: 1 }),
        validateZoneId('zone')
    ],
    promotionController.createFlashDeal
);

router.get('/flash-deals', promotionController.listFlashDeals);

router.get('/flash-deals/:id', promotionController.getFlashDealById);
router.delete('/flash-deals/:id', promotionController.deleteFlashDeal);

router.post('/flash-deals/update-stock', [
    check('flashDealId', 'Flash deal ID is required').not().isEmpty(),
    check('productId', 'Product ID is required').not().isEmpty(),
    check('quantity', 'Quantity must be a positive integer').isInt({ min: 1 })
], promotionController.updateFlashDealStock);

// Unit routes
router.post('/units',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('symbol', 'Symbol is optional').optional()
    ],
    promotionController.createUnit
);
router.get('/units', promotionController.getUnits);

module.exports = router;
