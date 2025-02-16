const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productRequestSchema = new mongoose.Schema({
    name: {
        type: Map,
        of: String,
        required: true
    },
    description: {
        type: Map,
        of: String
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    },
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: true
    },
    // images: [{
    //     type: String,
    //     required: true
    // }],
    // thumbnail: {
    //     type: String,
    //     required: true
    // },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage'
        },
        value: {
            type: Number,
            default: 0
        }
    },
    attributes: [{
        name: String,
        value: String
    }],
    tags: [String],
    nutritionInfo: {
        calories: Number,
        protein: Number,
        carbohydrates: Number,
        fat: Number,
        fiber: Number
    },
    allergens: [String],
    isOrganic: {
        type: Boolean,
        default: false
    },
    isHalal: {
        type: Boolean,
        default: false
    },
    maxPurchaseQuantity: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    denyReason: String
}, {
    timestamps: true
});

// Add pagination plugin
productRequestSchema.plugin(mongoosePaginate);

// Create indexes
productRequestSchema.index({ store: 1 });
productRequestSchema.index({ category: 1 });
productRequestSchema.index({ subCategory: 1 });
productRequestSchema.index({ status: 1 });
productRequestSchema.index({ 'name.en': 'text', 'name.ar': 'text', 'description.en': 'text', 'description.ar': 'text' });

module.exports = mongoose.model('ProductRequest', productRequestSchema);
