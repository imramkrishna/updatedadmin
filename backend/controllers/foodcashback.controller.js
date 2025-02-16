const { validationResult } = require('express-validator');
const Cashback = require('../models/foodcashback.model');
const Customer = require('../models/customer.model');

// Create a new cashback offer
exports.createCashback = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            customerId,
            cashbackType,
            amount,
            minimumPurchase,
            maximumDiscount,
            startDate,
            endDate
        } = req.body;

        // Check if customer exists
        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
        }

        const cashback = new Cashback({
            title,
            customerId,
            cashbackType,
            amount,
            minimumPurchase,
            maximumDiscount,
            startDate,
            endDate,
            status: true
        });

        await cashback.save();
        res.status(201).json(cashback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all cashback offers
exports.getCashbacks = async (req, res) => {
    try {
        const cashbacks = await Cashback.find()
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 });
        res.json(cashbacks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update cashback offer status
exports.updateCashbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const cashback = await Cashback.findById(id);
        if (!cashback) {
            return res.status(404).json({ message: 'Cashback offer not found' });
        }

        cashback.status = status;
        await cashback.save();

        res.json(cashback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update cashback offer
exports.updateCashback = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const cashback = await Cashback.findById(id);
        if (!cashback) {
            return res.status(404).json({ message: 'Cashback offer not found' });
        }

        // Check if customer exists if customerId is being updated
        if (updates.customerId) {
            const customer = await Customer.findById(updates.customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
        }

        Object.keys(updates).forEach(key => {
            cashback[key] = updates[key];
        });

        await cashback.save();
        res.json(cashback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
