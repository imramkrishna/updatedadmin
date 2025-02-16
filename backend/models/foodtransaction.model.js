const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['order_payment', 'store_earning', 'delivery_fee', 'admin_commission', 'withdrawal'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: String,
    reference: String,
    note: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const withdrawalRequestSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
    deliveryMan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryMan'
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    note: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['sales', 'earnings', 'orders', 'customers', 'stores', 'products'],
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
    data: mongoose.Schema.Types.Mixed,
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
const Report = mongoose.model('Report', reportSchema);

module.exports = {
    Transaction,
    WithdrawalRequest,
    Report
};
