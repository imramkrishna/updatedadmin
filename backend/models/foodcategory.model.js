const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const categorySchema = new mongoose.Schema({
    name: {
        type: Map,
        of: String,
        required: true // Stores name in multiple languages
    },
    image: {
        type: String,
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
categorySchema.plugin(mongoosePaginate);

// Create indexes
categorySchema.index({ 'name.en': 'text', 'name.ar': 'text' });
categorySchema.index({ status: 1 });
categorySchema.index({ priority: -1 });

module.exports = mongoose.model('Category', categorySchema);
