const { DispatchConfig, DispatchZone, DispatchLog } = require('../models/fooddispatch.model');
const { DeliveryMan } = require('../models/user.model');
const { Order } = require('../models/foodorder.model');

// Dispatch Configuration
exports.getDispatchConfig = async (req, res) => {
    try {
        let config = await DispatchConfig.findOne();
        if (!config) {
            config = await DispatchConfig.create({});
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDispatchConfig = async (req, res) => {
    try {
        const config = await DispatchConfig.findOneAndUpdate(
            {},
            req.body,
            { new: true, upsert: true }
        );
        res.json(config);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//dispatch section
exports.createDispatchZone = async (req, res) => {
    try {
        const existingZone = await DispatchZone.findOne({ name: req.body.name });

        if (existingZone) {
            return res.status(400).json({ message: 'Dispatch Zone with this name already exists. Please create another one.' });
        }

        // Create a new Dispatch Zone if it doesn't already exist
        const zone = new DispatchZone(req.body);
        await zone.save();
        
        // Send back the created zone as a response
        res.status(201).json(zone);
    } catch (error) {
        // If there's an error, send the error message
        res.status(400).json({ message: error.message });
    }
};

exports.getDispatchZones = async (req, res) => {
    try {
        const zones = await DispatchZone.find().sort({ name: 1 });
        res.json(zones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDispatchZone = async (req, res) => {
    try {
        const { id } = req.params;
        const zone = await DispatchZone.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }

        res.json(zone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Order Dispatch
exports.findNearbyDeliveryMen = async (coordinates, radius) => {
    try {
        const deliveryMen = await DeliveryMan.find({
            status: 'active',
            'currentLocation': {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [coordinates.longitude, coordinates.latitude]
                    },
                    $maxDistance: radius
                }
            }
        }).populate('user');
        return deliveryMen;
    } catch (error) {
        console.error('Error finding nearby delivery men:', error);
        return [];
    }
};

exports.assignOrder = async (req, res) => {
    try {
        const { orderId, deliveryManId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const deliveryMan = await DeliveryMan.findById(deliveryManId);
        if (!deliveryMan) {
            return res.status(404).json({ message: 'Delivery man not found' });
        }

        // Update order
        order.deliveryMan = deliveryManId;
        order.status = 'assigned';
        await order.save();

        // Create dispatch log
        const dispatchLog = await DispatchLog.findOneAndUpdate(
            { order: orderId },
            {
                deliveryMan: deliveryManId,
                status: 'assigned',
                $push: {
                    assignmentAttempts: {
                        deliveryMan: deliveryManId,
                        status: 'accepted'
                    }
                }
            },
            { new: true, upsert: true }
        );

        res.json({ order, dispatchLog });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Dispatch Logs
exports.getDispatchLogs = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const logs = await DispatchLog.find(query)
            .populate('order')
            .populate('deliveryMan')
            .populate({
                path: 'assignmentAttempts.deliveryMan',
                model: 'DeliveryMan'
            })
            .sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Auto-assignment System
exports.startAutoAssignment = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const config = await DispatchConfig.findOne();
        let currentRadius = config.searchRadius;
        let attempts = 0;

        const dispatchLog = new DispatchLog({
            order: orderId,
            status: 'searching'
        });

        while (attempts < config.maxIncrements) {
            const deliveryMen = await exports.findNearbyDeliveryMen(
                order.deliveryAddress,
                currentRadius
            );

            dispatchLog.searchAttempts.push({
                radius: currentRadius,
                deliveryMenFound: deliveryMen.length
            });

            if (deliveryMen.length > 0) {
                // Implement your assignment logic here
                // For example, assign to the nearest delivery man
                const assignedDeliveryMan = deliveryMen[0];
                
                order.deliveryMan = assignedDeliveryMan._id;
                order.status = 'assigned';
                await order.save();

                dispatchLog.deliveryMan = assignedDeliveryMan._id;
                dispatchLog.status = 'assigned';
                dispatchLog.assignmentAttempts.push({
                    deliveryMan: assignedDeliveryMan._id,
                    status: 'accepted'
                });
                await dispatchLog.save();

                return { success: true, order, dispatchLog };
            }

            currentRadius += config.incrementalRadius;
            attempts++;
        }

        dispatchLog.status = 'failed';
        await dispatchLog.save();

        return { success: false, dispatchLog };
    } catch (error) {
        console.error('Auto-assignment error:', error);
        return { success: false, error: error.message };
    }
};
