const Order = require('../models/foodorder.model');
const Store = require('../models/foodstore.model');
const Customer = require('../models/customer.model');
const { validationResult } = require('express-validator');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises;
const path = require('path');

// Get orders list with filtering
exports.getOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            store,
            zone,
            search,
            startDate,
            endDate,
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (status) {
            if (Array.isArray(status)) {
                query.orderStatus = { $in: status };
            } else {
                query.orderStatus = status;
            }
        }

        if (store) query.store = store;
        
        if (zone) {
            const storeIds = await Store.find({ zone }).distinct('_id');
            query.store = { $in: storeIds };
        }

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDateTime;
            }
        }

        // Execute query with pagination
        const orders = await Order.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: [
                { path: 'customer', select: 'firstName lastName phone' },
                { path: 'store', select: 'name phone address' },
                { 
                    path: 'items.product',
                    select: 'name thumbnail price'
                }
            ]
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get order details
//get order details
exports.getOrderDetails = async (req, res) => {
    try {
        // Use findOne() and match with 'orderId' instead of '_id'
        const order = await Order.findOne({ orderId: req.params.id })
            .populate('customer', 'firstName lastName phone email')
            .populate('store', 'name address phone email')
            .populate('items.product', 'name thumbnail price description')
            .populate('deliveryPerson', 'firstName lastName phone vehicle')
            .populate('zone', 'name deliveryFee');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, reason } = req.body;

        // Find order by orderId instead of _id
        const order = await Order.findOne({ orderId: req.params.id })
            .populate('customer', 'firstName lastName email phone')
            .populate('store', 'name email phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            pending: ['accepted', 'cancelled'],
            accepted: ['processing', 'cancelled'],
            processing: ['out_for_delivery', 'cancelled'],
            out_for_delivery: ['delivered', 'cancelled'],
            delivered: ['refunded'],
            cancelled: [],
            refunded: []
        };

        if (!validTransitions[order.orderStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${order.orderStatus} to ${status}`
            });
        }

        // Validate reason for cancellation or refund
        if ((status === 'cancelled' || status === 'refunded') && !reason) {
            return res.status(400).json({
                success: false,
                message: `Reason is required for ${status} status`
            });
        }

        // Update order
        order.orderStatus = status;
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status,
            reason,
            updatedBy: req.user._id
        });

        if (status === 'cancelled') {
            order.cancelReason = reason;
            order.cancelledAt = new Date();
            order.cancelledBy = req.user._id;
        }

        if (status === 'refunded') {
            order.refundReason = reason;
            order.refundedAt = new Date();
            order.refundedBy = req.user._id;
        }

        await order.save();

        // Update related data
        if (status === 'delivered') {
            await Promise.all([
                Customer.findByIdAndUpdate(order.customer._id, {
                    $inc: { 
                        totalOrders: 1,
                        totalSpent: order.total
                    },
                    $set: { lastOrderDate: new Date() }
                }),
                Store.findByIdAndUpdate(order.store._id, {
                    $inc: {
                        'metrics.totalOrders': 1,
                        'metrics.totalRevenue': order.total,
                        [`metrics.${order.paymentMethod}Orders`]: 1
                    }
                })
            ]);
        }

        // Send notifications (To be implemented)
        // TODO: Implement notification sending based on status change

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
// Export orders
exports.exportOrders = async (req, res) => {
    try {
        const { format = 'csv', ...filterParams } = req.query;

        // Get filtered orders
        const orders = await Order.find(filterParams)
            .populate('customer', 'firstName lastName phone email')
            .populate('store', 'name')
            .populate('items.product', 'name price')
            .populate('zone', 'name')
            .select('-__v');

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for export'
            });
        }

        // Format data for export
        const formattedOrders = orders.map(order => ({
            'Order ID': order.orderId,
            'Customer Name': `${order.customer.firstName} ${order.customer.lastName}`,
            'Customer Phone': order.customer.phone,
            'Customer Email': order.customer.email,
            'Store': order.store.name,
            'Zone': order.zone?.name || 'N/A',
            'Items': order.items.map(item => 
                `${item.product.name} (${item.quantity}x)`
            ).join('; '),
            'Subtotal': order.subtotal.toFixed(2),
            'Delivery Fee': order.deliveryFee.toFixed(2),
            'Discount': order.discount?.amount.toFixed(2) || '0.00',
            'Total': order.total.toFixed(2),
            'Payment Method': order.paymentMethod,
            'Order Status': order.orderStatus,
            'Payment Status': order.paymentStatus,
            'Created At': order.createdAt.toLocaleString(),
            'Updated At': order.updatedAt.toLocaleString()
        }));

        if (format === 'csv') {
            const csvWriter = createCsvWriter({
                path: 'orders_export.csv',
                header: Object.keys(formattedOrders[0]).map(key => ({
                    id: key,
                    title: key
                }))
            });

            await csvWriter.writeRecords(formattedOrders);

            res.download('orders_export.csv', 'orders_export.csv', async (err) => {
                if (err) {
                    console.error('Download error:', err);
                }
                // Delete the file after sending
                try {
                    await fs.unlink('orders_export.csv');
                } catch (unlinkError) {
                    console.error('Error deleting export file:', unlinkError);
                }
            });
        } else {
            // Default to JSON
            res.json({
                success: true,
                data: formattedOrders
            });
        }
    } catch (error) {
        console.error('Export orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
