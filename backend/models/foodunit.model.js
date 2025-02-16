const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const unitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true // e.g., kg, pcs, ltr
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
unitSchema.plugin(mongoosePaginate);

// Create indexes
unitSchema.index({ 'name.en': 'text', 'name.ar': 'text' });
unitSchema.index({ symbol: 1 });
unitSchema.index({ status: 1 });

module.exports = mongoose.model('Unit', unitSchema);
