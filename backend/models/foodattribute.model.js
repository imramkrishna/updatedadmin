const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const attributeSchema = new mongoose.Schema({
    name: {
        type: Map,
        of: String,
        required: true // Stores name in multiple languages
    },
    values: [{
        lang: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Add pagination plugin
attributeSchema.plugin(mongoosePaginate);

// Create indexes
attributeSchema.index({ 'name.en': 'text', 'name.ar': 'text' });
attributeSchema.index({ status: 1 });

module.exports = mongoose.model('Attribute', attributeSchema);
