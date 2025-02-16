const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/foodnotification.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(auth);

// Create notification
router.post('/notifications',
    upload.single('image'),
    [
        check('title').notEmpty().withMessage('Title is required'),
        check('description').notEmpty().withMessage('Description is required'),
        check('zone').notEmpty().withMessage('Zone is required'),
        check('target')
            .notEmpty().withMessage('Target is required')
            .isIn(['customer', 'deliveryman', 'store']).withMessage('Invalid target')
    ],
    notificationController.createNotification
);

// Get notifications list
router.get('/notifications', notificationController.listNotifications);

// Toggle notification status
router.patch('/notifications/:id/toggle-status', notificationController.toggleStatus);

// Update notification
router.patch('/notifications/:id', upload.single('image'), [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('zone', 'Zone is required').not().isEmpty(),
    check('target', 'Target audience is required').isIn(['customer', 'deliveryman', 'store'])
], notificationController.updateNotification);

// Delete notification
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
