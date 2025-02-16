const mongoose = require('mongoose');

const cashbackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    cashbackType: {
        type: String,
        enum: ['percentage', 'amount'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    minimumPurchase: {
        type: Number,
        required: true,
        min: 0
    },
    maximumDiscount: {
        type: Number,
        required: true,
        min: 0
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
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add index for efficient queries
cashbackSchema.index({ startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.model('Cashback', cashbackSchema);
