const { Banner, Campaign, Cashback, Coupon, Notification } = require('../models/promotion.model');
const Unit = require('../models/unit.model');
const Advertisement = require('../models/advertisement.model');
const { validationResult } = require('express-validator');

// Campaign Management
exports.createCampaign = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const campaignData = { ...req.body };
        if (req.file) {
            campaignData.image = req.file.path;
        }

        const campaign = new Campaign(campaignData);
        await campaign.save();

        res.status(201).json({
            success: true,
            data: campaign
        });
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.listCampaigns = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            type,
            sortField = 'startDate',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (type) query.type = type;

        // Update expired campaigns
        await Campaign.updateMany({
            endDate: { $lt: new Date() },
            status: { $ne: 'expired' }
        }, {
            status: 'expired'
        });

        const campaigns = await Campaign.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        });

        res.json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        console.error('List campaigns error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Coupon Management
exports.createCoupon = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const coupon = new Coupon(req.body);
        await coupon.save();

        res.status(201).json({
            success: true,
            data: coupon
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.listCoupons = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            type,
            store,
            sortField = 'startDate',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { 'title.en': { $regex: search, $options: 'i' } },
                { 'title.ar': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (type) query.type = type;
        if (store) query.store = store;

        // Update expired coupons
        await Coupon.updateMany({
            endDate: { $lt: new Date() },
            status: { $ne: 'expired' }
        }, {
            status: 'expired'
        });

        const coupons = await Coupon.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: ['store', 'products', 'categories']
        });

        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        console.error('List coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { code, userId, storeId, products, totalAmount } = req.body;

        // First find the coupon without any date restrictions to debug
        const coupon = await Coupon.findOne({
            code: code.toUpperCase()
        });

        // Log coupon details for debugging
        console.log('Coupon search result:', {
            searchedCode: code.toUpperCase(),
            found: !!coupon,
            couponDetails: coupon,
            currentDate: new Date(),
            dateCheck: coupon ? {
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                isActive: coupon.status === 'active',
                isStarted: coupon.startDate <= new Date(),
                isExpired: coupon.endDate < new Date()
            } : null
        });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check status
        if (coupon.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Coupon is ${coupon.status}`
            });
        }

        // Check dates
        const now = new Date();
        if (now < coupon.startDate) {
            return res.status(400).json({
                success: false,
                message: 'Coupon period has not started yet'
            });
        }

        if (now > coupon.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has expired'
            });
        }

        // Rest of validation logic
        // Check store restriction
        if (coupon.type === 'store' && coupon.store.toString() !== storeId) {
            return res.status(400).json({
                success: false,
                message: 'Coupon not valid for this store'
            });
        }

        // Check product restriction
        if (coupon.type === 'product') {
            const validProducts = products.filter(p =>
                coupon.products.some(cp => cp._id.toString() === p.productId)
            );
            if (validProducts.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon not valid for any product in cart'
                });
            }
        }

        // Check category restriction
        if (coupon.type === 'category') {
            // This would require additional product details including category
            // Implementation depends on how products are structured in the request
        }

        // Check minimum purchase
        if (coupon.minimumPurchase > totalAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase amount of ${coupon.minimumPurchase} required`
            });
        }

        // Check usage limit per user
        if (coupon.usageLimit?.perUser) {
            const userUsage = coupon.userUsage.find(u => u.user.toString() === userId);
            if (userUsage && userUsage.count >= coupon.usageLimit.perUser) {
                return res.status(400).json({
                    success: false,
                    message: 'You have reached the maximum usage limit for this coupon'
                });
            }
        }

        // Check total usage limit
        if (coupon.usageLimit?.total && coupon.usageCount >= coupon.usageLimit.total) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit has been reached'
            });
        }

        res.json({
            success: true,
            data: {
                coupon,
                discount: calculateDiscount(coupon, totalAmount)
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            details: error.message
        });
    }
};

// Helper function to calculate discount
function calculateDiscount(coupon, totalAmount) {
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (totalAmount * coupon.discountValue) / 100;
        if (coupon.maximumDiscount) {
            discount = Math.min(discount, coupon.maximumDiscount);
        }
    } else {
        discount = coupon.discountValue;
    }
    return discount;
}

// Unit Management
exports.createUnit = async (req, res) => {
    try {
        const { name, symbol } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        // Create a new unit
        const unit = new Unit({
            name,
            symbol: symbol || name.toLowerCase(),
            status: 'active'
        });

        await unit.save();

        return res.status(201).json({
            success: true,
            message: 'Unit created successfully',
            data: unit
        });
    } catch (error) {
        console.error('Error creating unit:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating unit'
        });
    }
};

exports.getUnits = async (req, res) => {
    try {
        const units = await Unit.find({ status: 'active' });
        return res.json({
            success: true,
            data: units
        });
    } catch (error) {
        console.error('Error fetching units:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching units'
        });
    }
};
// Banner Management
exports.createBanner = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const banner = new Banner(req.body);
        await banner.save();

        res.status(201).json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.listBanners = async (req, res) => {
    try {
        const banners = await Banner.find()
            .populate('store zone');
        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('List banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.toggleBannerVisibility = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const banner = await Banner.findById(bannerId);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }
        banner.isVisible = !banner.isVisible;
        await banner.save();
        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Toggle banner visibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const banner = await Banner.findByIdAndDelete(bannerId);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }
        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Advertisement Management
exports.createAdvertisement = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const adData = { ...req.body };
        if (req.file) {
            adData.image = req.file.path;
        }

        const advertisement = new Advertisement(adData);
        await advertisement.save();

        res.status(201).json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.listAdvertisements = async (req, res) => {
    try {
        const advertisements = await Advertisement.find()
            .populate('store');
        res.json({
            success: true,
            data: advertisements
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.listAdvertisementRequests = async (req, res) => {
    try {
        const requests = await Advertisement.find({ status: 'pending' })
            .populate('store');
        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAdvertisement = async (req, res) => {
    try {
        const adId = req.params.id;
        const updates = req.body;
        if (req.file) {
            updates.image = req.file.path;
        }

        const advertisement = await Advertisement.findByIdAndUpdate(
            adId,
            updates,
            { new: true }
        );

        if (!advertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        res.json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAdvertisement = async (req, res) => {
    try {
        const result = await Advertisement.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }
        res.json({
            success: true,
            message: 'Advertisement deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cashback Methods
exports.createCashback = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const cashback = new Cashback(req.body);
        await cashback.save();

        res.status(201).json({
            success: true,
            data: cashback
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create cashback',
            error: error.message
        });
    }
};

exports.getCashbacks = async (req, res) => {
    try {
        const cashbacks = await Cashback.find().sort('-createdAt');
        res.json({
            success: true,
            data: cashbacks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cashbacks'
        });
    }
};

exports.updateCashbackStatus = async (req, res) => {
    try {
        const cashback = await Cashback.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!cashback) {
            return res.status(404).json({
                success: false,
                message: 'Cashback not found'
            });
        }
        res.json({
            success: true,
            data: cashback
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update cashback status'
        });
    }
};

exports.updateCashback = async (req, res) => {
    try {
        const cashback = await Cashback.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!cashback) {
            return res.status(404).json({
                success: false,
                message: 'Cashback not found'
            });
        }
        res.json({
            success: true,
            data: cashback
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update cashback'
        });
    }
};

// Notification Methods
exports.createNotification = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const notificationData = {
            ...req.body,
            sender: req.user?._id // Make sender optional
        };

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
            message: 'Failed to create notification'
        });
    }
};

exports.listNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, recipient, type } = req.query;
        
        const query = {};
        if (recipient) query['recipient.id'] = recipient;
        if (type) query.type = type;

        const notifications = await Notification.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: 'sender'
        });

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const { recipientType, recipientId } = req.body;
        const query = {};
        
        if (recipientType) query['recipient.type'] = recipientType;
        if (recipientId) query['recipient.id'] = recipientId;

        await Notification.updateMany(query, { read: true });

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read'
        });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const { recipientType, recipientId } = req.query;
        const query = { read: false };
        
        if (recipientType) query['recipient.type'] = recipientType;
        if (recipientId) query['recipient.id'] = recipientId;

        const count = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
};
