const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
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
        enum: ['general', 'store', 'product', 'category', 'first_order'],
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
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
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
        perUser: {
            type: Number
        },
        total: {
            type: Number
        }
    },
    usageCount: {
        type: Number,
        default: 0
    },
    userUsage: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        count: {
            type: Number,
            default: 1
        }
    }],
    zone: {
        type: String,
        ref: 'Zone'
    }
}, {
    timestamps: true
});

// Add pagination plugin
couponSchema.plugin(mongoosePaginate);

// Create indexes
couponSchema.index({ code: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ store: 1 });
couponSchema.index({ zone: 1 });
couponSchema.index({ 'title.en': 'text', 'title.ar': 'text' });

module.exports = mongoose.model('Coupon', couponSchema);
