const Store = require('../models/foodstore.model');
const { validationResult } = require('express-validator');
const cloudinary = require("../utils/cloudinaryConfig.js");

// Get store statistics
exports.getStoreStatistics = async (req, res) => {
    try {
        const [
            totalStores,
            activeStores,
            pendingStores,
            newStores,
            totalTransactions,
            totalCommission,
            totalWithdrawals
        ] = await Promise.all([
            Store.countDocuments(),
            Store.countDocuments({ status: 'active' }),
            Store.countDocuments({ status: 'pending' }),
            Store.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),
            Store.aggregate([
                { $group: { _id: null, total: { $sum: '$metrics.totalOrders' } } }
            ]),
            Store.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ['$metrics.totalRevenue', { $divide: ['$commission', 100] }]
                            }
                        }
                    }
                }
            ]),
            Store.aggregate([
                { $group: { _id: null, total: { $sum: '$balance' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalStores,
                activeStores,
                pendingStores,
                newStores,
                totalTransactions: totalTransactions[0]?.total || 0,
                totalCommission: totalCommission[0]?.total || 0,
                totalWithdrawals: totalWithdrawals[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Get store statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// List stores
exports.listStores = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            zone,
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'owner.email': { $regex: search, $options: 'i' } },
                { 'owner.phone': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (zone) query.zone = zone;

        const stores = await Store.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: 'zone'
        });

        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('List stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get store details
exports.getStoreDetails = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('zone');
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Get store details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


//create stores

exports.createStore = async (req, res) => {
    // Define uploadedImages in outer scope for cleanup access
    let uploadedImages = {
        logo: null,
        coverImage: null
    };
    
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Parse and validate owner data
        let ownerData;
        try {
            ownerData = {
                firstName: String(req.body.owner.firstName || ''),
                lastName: String(req.body.owner.lastName || ''),
                email: String(req.body.owner.email || ''),
                phone: String(req.body.owner.phone || '')
            };

            // Validate required owner fields
            if (!ownerData.firstName || !ownerData.lastName || !ownerData.email || !ownerData.phone) {
                return res.status(400).json({
                    success: false,
                    message: "All owner fields (firstName, lastName, email, phone) are required"
                });
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid owner data format"
            });
        }

        // Check if required files exist
        if (!req.files || !req.files.logo || !req.files.coverImage) {
            return res.status(400).json({
                success: false,
                message: "Both logo and cover image are required"
            });
        }

        const {
            name,
            description,
            address,
            zone,
            vatNumber,
            taxPercentage,
            deliveryTime,
            minimumOrder,
            commission,
            operatingHours
        } = req.body;

        // Check if store with same name exists
        const existingStore = await Store.findOne({ name });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: "A store with this name already exists."
            });
        }

        // Upload images to Cloudinary
        try {
            // Upload logo
            const logoResult = await cloudinary.uploader.upload(req.files.logo[0].path, {
                folder: 'stores/logos',
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            });
            uploadedImages.logo = logoResult.secure_url;

            // Upload cover image
            const coverResult = await cloudinary.uploader.upload(req.files.coverImage[0].path, {
                folder: 'stores/covers',
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            });
            uploadedImages.coverImage = coverResult.secure_url;
        } catch (error) {
            // If any upload fails, delete the successfully uploaded image (if any)
            if (uploadedImages.logo) {
                await cloudinary.uploader.destroy(uploadedImages.logo);
            }
            if (uploadedImages.coverImage) {
                await cloudinary.uploader.destroy(uploadedImages.coverImage);
            }
            
            console.error("Cloudinary upload error:", error);
            return res.status(400).json({
                success: false,
                message: `Image upload failed: ${error.message}`
            });
        }

        // Create store with uploaded image URLs and validated owner data
        const store = new Store({
            name,
            description,
            logo: uploadedImages.logo,
            coverImage: uploadedImages.coverImage,
            owner: ownerData,  // Use validated owner data
            address,
            zone,
            vatNumber,
            taxPercentage,
            deliveryTime,
            minimumOrder,
            commission,
            operatingHours,
            status: "active"
        });

        await store.save();

        res.status(201).json({
            success: true,
            message: "Store created successfully",
            data: store
        });

    } catch (error) {
        console.error("Create store error:", error);
        // If store creation fails, clean up uploaded images
        if (uploadedImages.logo) {
            try {
                await cloudinary.uploader.destroy(uploadedImages.logo);
            } catch (cleanupError) {
                console.error("Error cleaning up logo:", cleanupError);
            }
        }
        if (uploadedImages.coverImage) {
            try {
                await cloudinary.uploader.destroy(uploadedImages.coverImage);
            } catch (cleanupError) {
                console.error("Error cleaning up cover image:", cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

// Update store
exports.updateStore = async (req, res) => {
    let uploadedImages = {
        logo: null,
        coverImage: null
    };
    
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, vatNumber } = req.body;

        // Check if store exists
        const existingStore = await Store.findById(req.params.id);
        if (!existingStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check for duplicate store (excluding current store)
        const duplicateStore = await Store.findOne({
            $or: [{ name }, { vatNumber }],
            _id: { $ne: req.params.id }
        });

        if (duplicateStore) {
            return res.status(400).json({
                success: false,
                message: 'Store with this name or VAT number already exists'
            });
        }

        // Prepare update data
        const updateData = { ...req.body };

        // Handle image uploads if files are present
        if (req.files) {
            try {
                // Handle logo upload
                if (req.files.logo) {
                    const logoResult = await cloudinary.uploader.upload(req.files.logo[0].path, {
                        folder: 'stores/logos',
                        resource_type: 'auto',
                        transformation: [
                            { quality: 'auto:good' },
                            { fetch_format: 'auto' }
                        ]
                    });
                    uploadedImages.logo = logoResult.secure_url;
                    updateData.logo = logoResult.secure_url;

                    // Delete old logo from Cloudinary if it exists
                    if (existingStore.logo) {
                        try {
                            const oldLogoPublicId = existingStore.logo.split('/').pop().split('.')[0];
                            await cloudinary.uploader.destroy(oldLogoPublicId);
                        } catch (error) {
                            console.error('Error deleting old logo:', error);
                        }
                    }
                }

                // Handle cover image upload
                if (req.files.coverImage) {
                    const coverResult = await cloudinary.uploader.upload(req.files.coverImage[0].path, {
                        folder: 'stores/covers',
                        resource_type: 'auto',
                        transformation: [
                            { quality: 'auto:good' },
                            { fetch_format: 'auto' }
                        ]
                    });
                    uploadedImages.coverImage = coverResult.secure_url;
                    updateData.coverImage = coverResult.secure_url;

                    // Delete old cover image from Cloudinary if it exists
                    if (existingStore.coverImage) {
                        try {
                            const oldCoverPublicId = existingStore.coverImage.split('/').pop().split('.')[0];
                            await cloudinary.uploader.destroy(oldCoverPublicId);
                        } catch (error) {
                            console.error('Error deleting old cover image:', error);
                        }
                    }
                }
            } catch (error) {
                // If any upload fails, clean up any successful uploads
                if (uploadedImages.logo) {
                    await cloudinary.uploader.destroy(uploadedImages.logo);
                }
                if (uploadedImages.coverImage) {
                    await cloudinary.uploader.destroy(uploadedImages.coverImage);
                }

                return res.status(400).json({
                    success: false,
                    message: `Image upload failed: ${error.message}`
                });
            }
        }

        // Handle owner data if present
        if (updateData.owner) {
            try {
                updateData.owner = {
                    firstName: String(updateData.owner.firstName || existingStore.owner.firstName),
                    lastName: String(updateData.owner.lastName || existingStore.owner.lastName),
                    email: String(updateData.owner.email || existingStore.owner.email),
                    phone: String(updateData.owner.phone || existingStore.owner.phone)
                };
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid owner data format"
                });
            }
        }

        // Update store
        const updatedStore = await Store.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedStore) {
            // This is unlikely to happen since we checked existence earlier
            // But if it does, clean up any uploaded images
            if (uploadedImages.logo) {
                await cloudinary.uploader.destroy(uploadedImages.logo);
            }
            if (uploadedImages.coverImage) {
                await cloudinary.uploader.destroy(uploadedImages.coverImage);
            }

            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.json({
            success: true,
            message: 'Store updated successfully',
            data: updatedStore
        });

    } catch (error) {
        console.error('Update store error:', error);
        // Clean up any uploaded images if the update fails
        if (uploadedImages.logo) {
            try {
                await cloudinary.uploader.destroy(uploadedImages.logo);
            } catch (cleanupError) {
                console.error('Error cleaning up logo:', cleanupError);
            }
        }
        if (uploadedImages.coverImage) {
            try {
                await cloudinary.uploader.destroy(uploadedImages.coverImage);
            } catch (cleanupError) {
                console.error('Error cleaning up cover image:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
// Toggle store status
exports.toggleStoreStatus = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        store.status = store.status === 'active' ? 'pending' : 'active';
        await store.save();

        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Toggle store status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// List store joining requests
exports.listJoiningRequests = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            sortField = 'createdAt',
            sortOrder = 'desc',
            status = 'pending'  // Default to pending
        } = req.query;

        // Build the query object with status filter
        const query = { status: status };  // Use the status from query params

        // Add search conditions if search parameter is provided
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'owner.email': { $regex: search, $options: 'i' } },
                { 'owner.phone': { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch paginated results
        const requests = await Store.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: 'zone'
        });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('List joining requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Handle joining request
exports.handleJoiningRequest = async (req, res) => {
    try {
        const { action } = req.body;
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        if (store.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Store is not in pending status'
            });
        }

        store.status = action === 'approve' ? 'active' : 'denied';
        await store.save();

        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Handle joining request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// List denied stores
exports.listDeniedStores = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { status: 'denied' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'owner.email': { $regex: search, $options: 'i' } },
                { 'owner.phone': { $regex: search, $options: 'i' } }
            ];
        }

        const stores = await Store.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: 'zone'
        });

        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('List denied stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// List recommended stores
exports.listRecommendedStores = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            sortField = 'metrics.totalOrders',
            sortOrder = 'desc'
        } = req.query;

        const query = { status: 'active' };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const stores = await Store.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            select: 'name _id logo metrics.totalOrders rating.average totalProducts status isRecommended'
        });

        const formattedStores = stores.docs.map(store => ({
            id: store._id,
            name: store.name,
            logo: store.logo,
            ratings: store.rating?.average || 0,
            totalProducts: store.totalProducts || 0,
            totalOrders: store.metrics?.totalOrders || 0,
            status: store.status,
            isRecommended: store.isRecommended
        }));

        res.json({
            success: true,
            data: {
                stores: formattedStores,
                totalPages: stores.totalPages,
                currentPage: stores.page,
                totalStores: stores.totalDocs
            }
        });
    } catch (error) {
        console.error('List recommended stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Toggle recommended status
exports.toggleRecommendedStatus = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        store.isRecommended = !store.isRecommended;
        await store.save();

        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Toggle recommended status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.deleteStore = async (req, res) => {
    try {
        const { storeId } = req.params;

        // Check if the store exists
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Delete the store
        await Store.findByIdAndDelete(storeId);

        return res.status(200).json({ success: true, message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Error deleting store:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.toggleFeatured = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Toggle the featured field
        store.featured = !store.featured;
        await store.save();

        res.json({
            success: true,
            message: `Store featured status updated to ${store.featured}`,
            data: store
        });

    } catch (error) {
        console.error('Error toggling featured status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }

    
};
