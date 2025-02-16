const Order = require('../models/foodorder.model');
const Product = require('../models/foodproduct.model');
const Store = require('../models/foodstore.model');
const Customer = require('../models/customer.model');

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
    try {
        const timeFilter = req.query.timeRange || 'all'; // all, year, month, week
        let dateFilter = {};

        if (timeFilter !== 'all') {
            const now = new Date();
            const startDate = new Date();

            switch (timeFilter) {
                case 'year':
                    startDate.setFullYear(now.getFullYear(), 0, 1);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth(), 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - now.getDay());
                    break;
            }

            dateFilter = { createdAt: { $gte: startDate } };
        }

        // Get total counts
        const totalProducts = await Product.countDocuments({ ...dateFilter });
        const totalOrders = await Order.countDocuments({ ...dateFilter });
        const totalStores = await Store.countDocuments({ ...dateFilter });
        const totalCustomers = await Customer.countDocuments({ ...dateFilter });

        // Get order status counts
        const orderStatusCounts = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get sales data
        const salesData = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: 'delivered' } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    totalSales: { $sum: '$total' },
                    adminCommission: { $sum: { $multiply: ['$total', 0.1] } }, // Assuming 10% commission
                    deliveryCommission: { $sum: { $multiply: ['$deliveryFee', 0.8] } } // Assuming 80% of delivery fee
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Get top performing stores
        const topStores = await Store.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'store',
                    as: 'orders'
                }
            },
            {
                $project: {
                    name: 1,
                    logo: 1,
                    totalOrders: { $size: '$orders' },
                    totalRevenue: {
                        $sum: '$orders.total'
                    }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);

        // Get top selling products
        const topProducts = await Product.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'items.product',
                    as: 'orders'
                }
            },
            {
                $project: {
                    name: 1,
                    images: 1,
                    totalSold: {
                        $sum: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: {
                                    $sum: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$$order.items',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item.product', '$_id'] }
                                                }
                                            },
                                            as: 'item',
                                            in: '$$item.quantity'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Get user statistics
        const userStats = await Customer.aggregate([
            {
                $facet: {
                    totalOrders: [
                        { $group: { _id: null, total: { $sum: '$totalOrders' } } }
                    ],
                    activeUsers: [
                        { $match: { status: 'active' } },
                        { $count: 'count' }
                    ],
                    newUsers: [
                        { $match: { ...dateFilter } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                counts: {
                    products: totalProducts,
                    orders: totalOrders,
                    stores: totalStores,
                    customers: totalCustomers
                },
                orderStatusCounts: orderStatusCounts.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                salesData,
                topStores,
                topProducts,
                userStats: userStats[0]
            }
        });
    } catch (error) {
        console.error('Dashboard statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user list
exports.getUserList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const searchQuery = search ? {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const users = await Customer.paginate(searchQuery, {
            page,
            limit,
            sort: { createdAt: -1 },
            select: 'firstName lastName email phone profileImage totalOrders lastOrderDate'
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get user list error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user type statistics
exports.getUserTypeStatistics = async (req, res) => {
    try {
        // Get counts for different user types
        const customerCount = await Customer.countDocuments();
        const storeCount = await Store.countDocuments();
        
        // Calculate total users
        const totalUsers = customerCount + storeCount;

        res.json({
            success: true,
            data: {
                total: totalUsers,
                breakdown: {
                    customers: customerCount,
                    stores: storeCount
                }
            }
        });
    } catch (error) {
        console.error('User statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
