const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const flashDealSchema = new mongoose.Schema({
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
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
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
        stock: {
            type: Number,
            required: true,
            min: 0
        },
        soldCount: {
            type: Number,
            default: 0
        },
        maxPurchaseQty: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    zone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone'
    }
}, {
    timestamps: true
});

// Add pagination plugin
flashDealSchema.plugin(mongoosePaginate);

// Create indexes
flashDealSchema.index({ startDate: 1, endDate: 1 });
flashDealSchema.index({ status: 1 });
flashDealSchema.index({ zone: 1 });
flashDealSchema.index({ 'title.en': 'text', 'title.ar': 'text' });
flashDealSchema.index({ 'products.product': 1 });

module.exports = mongoose.model('FlashDeal', flashDealSchema);
