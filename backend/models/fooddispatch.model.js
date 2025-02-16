const mongoose = require('mongoose');

const dispatchConfigSchema = new mongoose.Schema({
    orderAssignmentTimeout: {
        type: Number,
        default: 30
    },
    maxOrdersPerDeliveryMan: {
        type: Number,
        default: 5
    },
    maxRadius: {
        type: Number,
        default: 5000
    },
    searchRadius: {
        type: Number,
        default: 1000
    },
    incrementalRadius: {
        type: Number,
        default: 500
    },
    maxIncrements: {
        type: Number,
        default: 3
    }
});

const dispatchZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    coordinates: [{
        latitude: Number,
        longitude: Number
    }],
    deliveryFee: {
        type: Number,
        required: true
    },
    minimumDeliveryTime: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
});

const dispatchLogSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    deliveryMan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryMan'
    },
    status: {
        type: String,
        enum: ['searching', 'assigned', 'picked_up', 'delivered', 'failed'],
        default: 'searching'
    },
    searchAttempts: [{
        radius: Number,
        deliveryMenFound: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    assignmentAttempts: [{
        deliveryMan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeliveryMan'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'timeout']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const DispatchConfig = mongoose.model('DispatchConfig', dispatchConfigSchema);
const DispatchZone = mongoose.model('DispatchZone', dispatchZoneSchema);
const DispatchLog = mongoose.model('DispatchLog', dispatchLogSchema);

module.exports = {
    DispatchConfig,
    DispatchZone,
    DispatchLog
};
