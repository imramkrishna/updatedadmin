const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    zone: {
        type: String,
        required: true
    },
    target: {
        type: String,
        enum: ['customer', 'deliveryman', 'store'],
        required: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Add pagination plugin
notificationSchema.plugin(mongoosePaginate);

// Update indexes to match new schema
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ zone: 1 });
notificationSchema.index({ target: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
