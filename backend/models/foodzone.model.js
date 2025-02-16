const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    coordinates: [{
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    deliveryFee: {
        type: Number,
        required: true,
        min: 0
    },
    minimumDeliveryTime: {
        type: Number,
        required: true,
        min: 0
    },
    maximumDeliveryTime: {
        type: Number,
        required: true,
        min: 0
    },
    storeCount: {
        type: Number,
        default: 0
    },
    customerCount: {
        type: Number,
        default: 0
    },
    orderCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Add pagination plugin
zoneSchema.plugin(mongoosePaginate);

// Create indexes
zoneSchema.index({ name: 1 });
zoneSchema.index({ status: 1 });
zoneSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
