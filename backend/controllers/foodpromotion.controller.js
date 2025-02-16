const Campaign = require('../models/foodcampaign.model');
const Coupon = require('../models/foodcoupon.model');
const FlashDeal = require('../models/foodflashDeal.model');
const Unit = require('../models/foodunit.model');
const Store = require('../models/foodstore.model');
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
            store,
            zone,
            sortField = 'startDate',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (status) query.status = status;
        if (type) query.type = type;
        if (store) query.store = store;
        if (zone) query.zone = zone;

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
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: ['store', 'products', 'zone']
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
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array() 
            });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        // Validate store if type is 'store'
        if (req.body.type === 'store') {
            if (!req.body.store) {
                return res.status(400).json({
                    success: false,
                    message: 'Store is required for store-type coupons'
                });
            }

            const store = await Store.findById(req.body.store);
            if (!store) {
                return res.status(400).json({
                    success: false,
                    message: 'Store not found'
                });
            }
        }

        const coupon = new Coupon({
            ...req.body,
            code: req.body.code.toUpperCase()
        });
        await coupon.save();

        // Populate store details in response
        await coupon.populate('store', 'name logo');

        res.status(201).json({
            success: true,
            data: coupon
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
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
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
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
            populate: {
                path: 'store',
                select: 'name logo'
            }
        });

        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        console.error('List coupons error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.updateCouponStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be either "active" or "inactive"'
            });
        }

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon status updated successfully',
            data: coupon
        });
    } catch (error) {
        console.error('Update coupon status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { code, userId, storeId, products, totalAmount } = req.body;

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gt: new Date() }
        }).populate('store products categories');

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired coupon'
            });
        }

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

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (totalAmount * coupon.discountValue) / 100;
            if (coupon.maximumDiscount) {
                discount = Math.min(discount, coupon.maximumDiscount);
            }
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            success: true,
            data: {
                coupon,
                discount
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Unit Management
exports.createUnit = async (req, res) => {
    try {
        const { name, symbol } = req.body;

        if (!name || !name.en || !name.ar) {
            return res.status(400).json({
                success: false,
                message: 'Both English and Arabic names are required'
            });
        }

        // Create a new unit
        const unit = new Unit({
            name,
            symbol: symbol || name.en.toLowerCase(),
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

// Flash Deal Management
exports.createFlashDeal = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const flashDealData = { ...req.body };
        if (req.file) {
            flashDealData.image = req.file.path;
        }

        const flashDeal = new FlashDeal(flashDealData);
        await flashDeal.save();

        res.status(201).json({
            success: true,
            data: flashDeal
        });
    } catch (error) {
        console.error('Create flash deal error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.listFlashDeals = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            zone,
            sortField = 'startDate',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (status) query.status = status;
        if (zone) query.zone = zone;

        // Update expired flash deals
        await FlashDeal.updateMany({
            endDate: { $lt: new Date() },
            status: { $ne: 'expired' }
        }, {
            status: 'expired'
        });

        const flashDeals = await FlashDeal.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: [
                {
                    path: 'products.product',
                    select: 'name thumbnail price stock'
                },
                'zone'
            ]
        });

        res.json({
            success: true,
            data: flashDeals
        });
    } catch (error) {
        console.error('List flash deals error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.updateFlashDealStock = async (req, res) => {
    try {
        const { flashDealId, productId, quantity } = req.body;

        const flashDeal = await FlashDeal.findById(flashDealId);
        if (!flashDeal) {
            return res.status(404).json({
                success: false,
                message: 'Flash deal not found'
            });
        }

        const productIndex = flashDeal.products.findIndex(
            p => p.product.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in flash deal'
            });
        }

        if (flashDeal.products[productIndex].stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Update stock and sold count
        flashDeal.products[productIndex].stock -= quantity;
        flashDeal.products[productIndex].soldCount += quantity;

        await flashDeal.save();

        res.json({
            success: true,
            data: flashDeal
        });
    } catch (error) {
        console.error('Update flash deal stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.getFlashDealById = async (req, res) => {
    try {
        const flashDeal = await FlashDeal.findById(req.params.id)
            .populate('products.product');

        if (!flashDeal) {
            return res.status(404).json({
                success: false,
                message: 'Flash deal not found'
            });
        }

        res.json({
            success: true,
            data: flashDeal
        });
    } catch (error) {
        console.error('Get flash deal error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.deleteFlashDeal = async (req, res) => {
    try {
        const result = await FlashDeal.deleteOne({ _id: req.params.id });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flash deal not found'
            });
        }

        res.json({
            success: true,
            message: 'Flash deal deleted successfully'
        });
    } catch (error) {
        console.error('Delete flash deal error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
