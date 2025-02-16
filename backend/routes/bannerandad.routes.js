const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bannerAndAdController = require('../controllers/bannerandad.controller');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const { validateZoneId, validateZoneIds } = require('../middleware/zoneValidation');

// Wrapper middleware for auth
const authWrapper = (roles) => {
    return async (req, res, next) => {
        try {
            // Add header function if it doesn't exist
            req.header = function(name) {
                return this.headers[name.toLowerCase()];
            };

            // Get the token from the Authorization header
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            // Add user role check here
            if (!roles.includes('admin')) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // If all checks pass, proceed
            next();
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    };
};

// Banner Routes
router.post(
    '/banners',
    authWrapper(['admin']),
    upload.single('image'),
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('link').optional().isString(),
        body('store').notEmpty().withMessage('Store is required')
            .isMongoId().withMessage('Invalid store ID'),
        body('zone').notEmpty().withMessage('Zone is required'),
        body('type').optional().isIn(['main', 'popup']).withMessage('Invalid banner type')
    ],
    bannerAndAdController.createBanner
);

router.get('/banners', authWrapper(['admin']), bannerAndAdController.listBanners);

router.put(
    '/banners/:id',
    authWrapper(['admin']),
    upload.single('image'),
    [
        body('title').optional().notEmpty().withMessage('Title cannot be empty'),
        body('link').optional().notEmpty().withMessage('Link cannot be empty'),
        body('store').optional().isMongoId().withMessage('Invalid store ID'),
        validateZoneId('zone')
    ],
    bannerAndAdController.updateBanner
);

router.delete(
    '/banners/:id',
    authWrapper(['admin']),
    bannerAndAdController.deleteBanner
);

// Advertisement Routes
router.post(
    '/advertisements',
    authWrapper(['admin']),
    upload.single('media'),
    [
        body('title')
            .custom((value) => {
                try {
                    const parsed = JSON.parse(value);
                    return typeof parsed === 'object' && parsed !== null;
                } catch (e) {
                    return false;
                }
            })
            .withMessage('Title must be a valid JSON object with language keys'),
        body('description')
            .custom((value) => {
                try {
                    const parsed = JSON.parse(value);
                    return typeof parsed === 'object' && parsed !== null;
                } catch (e) {
                    return false;
                }
            })
            .withMessage('Description must be a valid JSON object with language keys'),
        body('store').isMongoId().withMessage('Invalid store ID'),
        body('type').isIn(['popup', 'banner', 'video']).withMessage('Invalid advertisement type'),
        body('priority').isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
        body('startDate').isISO8601().withMessage('Invalid start date'),
        body('endDate').isISO8601().withMessage('Invalid end date'),
        body('targetAudience')
            .custom((value) => {
                try {
                    const parsed = JSON.parse(value);
                    return typeof parsed === 'object' && 
                           parsed !== null && 
                           typeof parsed.ageRange === 'object' &&
                           Array.isArray(parsed.zones);
                } catch (e) {
                    return false;
                }
            })
            .withMessage('Target audience must be a valid JSON object with required fields')
    ],
    bannerAndAdController.createAdvertisement
);

router.get('/advertisements', authWrapper(['admin']), bannerAndAdController.listAdvertisements);

router.put(
    '/advertisements/:id',
    authWrapper(['admin']),
    upload.single('media'),
    [
        body('title').optional().isObject().withMessage('Title must be an object with language keys'),
        body('description').optional().isObject().withMessage('Description must be an object with language keys'),
        body('store').optional().isMongoId().withMessage('Invalid store ID'),
        body('type').optional().isIn(['popup', 'banner', 'video']).withMessage('Invalid advertisement type'),
        body('priority').optional().isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
        body('startDate').optional().isISO8601().withMessage('Invalid start date'),
        body('endDate').optional().isISO8601().withMessage('Invalid end date'),
        body('targetAudience').optional().isObject().withMessage('Target audience must be an object'),
        validateZoneIds('targetAudience.zones')
    ],
    bannerAndAdController.updateAdvertisement
);

router.delete(
    '/advertisements/:id',
    authWrapper(['admin']),
    bannerAndAdController.deleteAdvertisement
);

// Analytics Routes
router.post(
    '/advertisements/:id/impression',
    bannerAndAdController.trackImpression
);

router.post(
    '/advertisements/:id/click',
    bannerAndAdController.trackClick
);

module.exports = router; 