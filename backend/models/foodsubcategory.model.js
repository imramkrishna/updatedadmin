const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const subCategorySchema = new mongoose.Schema({
    name: {
        type: Map,
        of: String,
        required: true // Stores name in multiple languages
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    priority: {
        type: Number,
        default: 0
    },
    productCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Add pagination plugin
subCategorySchema.plugin(mongoosePaginate);

// Create indexes
subCategorySchema.index({ category: 1 });
subCategorySchema.index({ 'name.en': 'text', 'name.ar': 'text' });
subCategorySchema.index({ status: 1 });
subCategorySchema.index({ priority: -1 });

module.exports = mongoose.model('SubCategory', subCategorySchema);
