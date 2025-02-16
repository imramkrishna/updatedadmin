const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const storeController = require('../controllers/foodstore.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(auth);

// Store validation rules
const storeValidation = [
    check('name', 'Store name is required').not().isEmpty(),
    check('owner.firstName', 'Owner first name is required').not().isEmpty(),
    check('owner.lastName', 'Owner last name is required').not().isEmpty(),
    check('owner.email', 'Valid owner email is required').isEmail(),
    check('owner.phone', 'Owner phone number is required').not().isEmpty(),
    check('address.street', 'Street address is required').not().isEmpty(),
    check('address.city', 'City is required').not().isEmpty(),
    check('address.state', 'State is required').not().isEmpty(),
    check('address.zipCode', 'ZIP code is required').not().isEmpty(),
    check('address.coordinates.lat', 'Latitude is required').isFloat(),
    check('address.coordinates.lng', 'Longitude is required').isFloat(),
    check('zone', 'Zone is required').trim().notEmpty().withMessage('Zone is required'),
    check('commission', 'Commission percentage is required').isFloat({ min: 0, max: 100 }),
    check('taxPercentage', 'Tax percentage must be a number').optional().isFloat({ min: 0 }),
    check('minimumOrder', 'Minimum order amount must be a number').optional().isFloat({ min: 0 }),
    check('deliveryTime.min', 'Minimum delivery time is required').isInt({ min: 0 }),
    check('deliveryTime.max', 'Maximum delivery time is required').isInt({ min: 0 })
];

// Get store statistics
router.get('/statistics', storeController.getStoreStatistics);

// List stores
router.get('/', storeController.listStores);

// Get store details
router.get('/:id', storeController.getStoreDetails);

//delete store
router.delete('/:storeId', storeController.deleteStore);


// Create store
router.post('/',
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    storeValidation,
    storeController.createStore
);

// Update store
router.put('/:id',
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    storeValidation,
    storeController.updateStore
);

// Toggle store status
router.patch('/:id/toggle-status', storeController.toggleStoreStatus);

// List store joining requests
router.get('/requests/joining', storeController.listJoiningRequests);

// Handle joining request
router.patch('/requests/:id',
    check('action', 'Action must be either approve or deny').isIn(['approve', 'deny']),
    storeController.handleJoiningRequest
);

// List denied stores
router.get('/list/denied', storeController.listDeniedStores);

// List recommended stores
router.get('/list/recommended', storeController.listRecommendedStores);

// Toggle recommended status
router.patch('/:id/toggle-recommended', storeController.toggleRecommendedStatus);

//toggl featured stores
router.patch('/:id/toggle-featured', storeController.toggleFeatured);


module.exports = router;
