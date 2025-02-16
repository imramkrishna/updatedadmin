const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const campaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: Map,
        of: String // Stores description in multiple languages
    },
    image: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },
    type: {
        type: String,
        enum: ['general', 'store', 'product'],
        default: 'general'
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minimumPurchase: {
        type: Number,
        default: 0
    },
    maximumDiscount: {
        type: Number
    },
    usageLimit: {
        type: Number
    },
    usageCount: {
        type: Number,
        default: 0
    },
    zone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone'
    }
}, {
    timestamps: true
});

// Add pagination plugin
campaignSchema.plugin(mongoosePaginate);

// Create indexes
campaignSchema.index({ startDate: 1, endDate: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ store: 1 });
campaignSchema.index({ zone: 1 });
campaignSchema.index({ 'title.en': 'text', 'title.ar': 'text' });

module.exports = mongoose.model('Campaign', campaignSchema);
