const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/foodproduct.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(auth);

// Category routes
router.post('/categories',
    upload.single('image'),
    [
        check('name.en', 'English name is required').not().isEmpty(),
        check('name.ar', 'Arabic name is required').not().isEmpty(),
        check('priority').optional().isInt({ min: 0 })
    ],
    productController.createCategory
);

router.get('/categories', productController.listCategories);

// SubCategory routes
router.post('/subcategories', [
    check('name.en', 'English name is required').not().isEmpty(),
    check('name.ar', 'Arabic name is required').not().isEmpty(),
    check('category', 'Category ID is required').not().isEmpty(),
    check('priority').optional().isInt({ min: 0 })
], productController.createSubCategory);

router.get('/subcategories', productController.listSubCategories);

// Unit routes
router.post('/units', [
    check('name.en', 'English name is required').not().isEmpty(),
    check('name.ar', 'Arabic name is required').not().isEmpty(),
    check('symbol', 'Symbol is required').not().isEmpty()
], productController.createUnit);

router.get('/units', productController.listUnits);

// Attribute routes
router.post('/attributes', [
    check('name.en', 'English name is required').not().isEmpty(),
    check('name.ar', 'Arabic name is required').not().isEmpty(),
    check('values', 'Values array is required').isArray()
], productController.createAttribute);

router.get('/attributes', productController.listAttributes);

// Product routes
router.post('/',
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    [
        check('name.en', 'English name is required').not().isEmpty(),
        check('name.ar', 'Arabic name is required').not().isEmpty(),
        check('store', 'Store ID is required').not().isEmpty(),
        check('category', 'Category ID is required').not().isEmpty(),
        check('unit', 'Unit ID is required').not().isEmpty(),
        check('price', 'Price must be a positive number').isFloat({ min: 0 }),
        check('stock', 'Stock must be a non-negative integer').isInt({ min: 0 })
    ],
    productController.createProduct
);

router.get('/', productController.listProducts);

// Product request routes
// New Product Request Routes
router.get('/request',productController.getProductRequests);
router.put('/request/:id/status',productController.updateProductRequestStatus);


// Review routes
router.get('/reviews', productController.listReviews);

// Import/Export routes
router.post('/import',
    upload.single('file'),
    productController.importProducts
);

router.get('/export', productController.exportProducts);

module.exports = router;
