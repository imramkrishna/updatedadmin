const { Banner, Advertisement } = require('../models/bannerandad.model');
const { validationResult } = require('express-validator');

// Banner Controllers
exports.createBanner = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: errors.array() 
            });
        }

        console.log('Creating banner with body:', req.body);
        console.log('File received:', req.file);

        const bannerData = { ...req.body };
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required'
            });
        }

        bannerData.image = req.file.path;

        const banner = new Banner(bannerData);
        await banner.save();

        console.log('Banner created successfully:', banner);

        res.status(201).json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.listBanners = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            zone,
            type,
            status
        } = req.query;

        const query = {};

        // Add filters if provided
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (zone) {
            query.zone = zone; // Zone is now a string, so direct comparison
        }
        if (type) {
            query.type = type;
        }
        if (status) {
            query.status = status;
        }

        const banners = await Banner.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: {
                path: 'store',
                select: 'name logo' // Only populate necessary store fields
            }
        });

        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('List banners error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const bannerData = { ...req.body };
        if (req.file) {
            bannerData.image = req.file.path;
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            bannerData,
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
        const banner = await Banner.findByIdAndDelete(req.params.id);

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

// Advertisement Controllers
exports.createAdvertisement = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const adData = { ...req.body };
        
        // Parse JSON strings into objects
        try {
            adData.title = JSON.parse(adData.title);
            adData.description = JSON.parse(adData.description);
            adData.targetAudience = JSON.parse(adData.targetAudience);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data in request',
                error: error.message
            });
        }

        if (req.file) {
            adData.media = req.file.path;
        }

        const advertisement = new Advertisement(adData);
        await advertisement.save();

        res.status(201).json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        console.error('Create advertisement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.listAdvertisements = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            store,
            status,
            type,
            sortField = 'startDate',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        if (store) query.store = store;
        if (status) query.status = status;
        if (type) query.type = type;

        // Update expired advertisements
        await Advertisement.updateMany({
            endDate: { $lt: new Date() },
            status: { $ne: 'expired' }
        }, {
            status: 'expired'
        });

        const advertisements = await Advertisement.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: ['store', 'targetAudience.zones']
        });

        res.json({
            success: true,
            data: advertisements
        });
    } catch (error) {
        console.error('List advertisements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.updateAdvertisement = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const adData = { ...req.body };
        if (req.file) {
            adData.media = req.file.path;
        }

        const advertisement = await Advertisement.findByIdAndUpdate(
            req.params.id,
            adData,
            { new: true }
        );

        if (!advertisement) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found'
            });
        }

        res.json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        console.error('Update advertisement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.deleteAdvertisement = async (req, res) => {
    try {
        const advertisement = await Advertisement.findByIdAndDelete(req.params.id);

        if (!advertisement) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found'
            });
        }

        res.json({
            success: true,
            message: 'Advertisement deleted successfully'
        });
    } catch (error) {
        console.error('Delete advertisement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Analytics
exports.trackImpression = async (req, res) => {
    try {
        const advertisement = await Advertisement.findByIdAndUpdate(
            req.params.id,
            { $inc: { impressions: 1 } },
            { new: true }
        );

        if (!advertisement) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found'
            });
        }

        res.json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        console.error('Track impression error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.trackClick = async (req, res) => {
    try {
        const advertisement = await Advertisement.findByIdAndUpdate(
            req.params.id,
            { $inc: { clicks: 1 } },
            { new: true }
        );

        if (!advertisement) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found'
            });
        }

        res.json({
            success: true,
            data: advertisement
        });
    } catch (error) {
        console.error('Track click error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}; 