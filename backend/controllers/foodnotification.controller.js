const Notification = require('../models/foodnotification.model');
const { validationResult } = require('express-validator');
const cloudinary = require("../utils/cloudinaryConfig.js");


// Create notification

exports.createNotification = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        let imageUrl = null;

        // Handle image upload to Cloudinary
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'notifications', // Optional: organize images in a folder
                    resource_type: 'auto',
                    transformation: { // Optional: optimize image
                        quality: 'auto',
                        fetch_format: 'auto'
                    }
                });
                imageUrl = result.secure_url;
            } catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading image to Cloudinary',
                    error: uploadError.message
                });
            }
        }

        // Create notification with uploaded image URL
        const notificationData = {
            title: req.body.title,
            description: req.body.description,
            zone: req.body.zone,
            target: req.body.target.toLowerCase(),
            status: 'active',
            image: imageUrl // Add the Cloudinary URL
        };

        // Validate required image field
        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image is required for notifications'
            });
        }

        const notification = new Notification(notificationData);
        await notification.save();

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Toggle notification status
exports.toggleStatus = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.status = notification.status === 'active' ? 'inactive' : 'active';
        await notification.save();

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Toggle notification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// List notifications
exports.listNotifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            target,
            zone,
            status,
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (target) query.target = target.toLowerCase();
        if (zone) query.zone = zone;
        if (status) query.status = status;

        const notifications = await Notification.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        });

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('List notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const { recipientType, recipientId } = req.body;

        const query = {
            isRead: false
        };

        if (recipientType && recipientId) {
            query['recipient.type'] = recipientType;
            query['recipient.id'] = recipientId;
        }

        await Notification.updateMany(query, {
            isRead: true,
            readAt: new Date()
        });

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.deleteOne();

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const { recipientType, recipientId } = req.query;

        const query = {
            isRead: false
        };

        if (recipientType && recipientId) {
            query['recipient.type'] = recipientType;
            query['recipient.id'] = recipientId;
        }

        const count = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update notification
exports.updateNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        let imageUrl = notification.image; // Keep existing image by default

        // Handle new image upload to Cloudinary if provided
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'notifications',
                    resource_type: 'auto',
                    transformation: {
                        quality: 'auto',
                        fetch_format: 'auto'
                    }
                });
                imageUrl = result.secure_url;
            } catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading image to Cloudinary',
                    error: uploadError.message
                });
            }
        }

        // Update notification fields
        notification.title = req.body.title;
        notification.description = req.body.description;
        notification.zone = req.body.zone;
        notification.target = req.body.target.toLowerCase();
        notification.image = imageUrl;

        await notification.save();

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
