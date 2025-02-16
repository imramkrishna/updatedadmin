const { Transaction, WithdrawalRequest, Report } = require('../models/foodtransaction.model');

// Transaction Management
exports.getTransactions = async (req, res) => {
    try {
        const { type, status, startDate, endDate, search } = req.query;
        let query = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (search) {
            query.$or = [
                { reference: new RegExp(search, 'i') },
                { note: new RegExp(search, 'i') }
            ];
        }

        const transactions = await Transaction.find(query)
            .populate('order')
            .populate('store')
            .populate('user')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Withdrawal Management
exports.getWithdrawalRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        const requests = await WithdrawalRequest.find(query)
            .populate('store')
            .populate('deliveryMan')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateWithdrawalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const withdrawal = await WithdrawalRequest.findByIdAndUpdate(
            id,
            { status, note },
            { new: true }
        ).populate('store deliveryMan');

        if (!withdrawal) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        // If approved, create a transaction
        if (status === 'approved') {
            const transaction = new Transaction({
                type: 'withdrawal',
                amount: withdrawal.amount,
                status: 'completed',
                store: withdrawal.store,
                deliveryMan: withdrawal.deliveryMan,
                reference: `WD-${withdrawal._id}`,
                note: note || 'Withdrawal request approved'
            });
            await transaction.save();
        }

        res.json(withdrawal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Report Generation
exports.generateReport = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.body;
        let data;

        switch (type) {
            case 'sales':
                data = await Transaction.aggregate([
                    {
                        $match: {
                            type: 'order_payment',
                            createdAt: {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                            },
                            totalSales: { $sum: '$amount' },
                            orderCount: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
                break;

            case 'earnings':
                data = await Transaction.aggregate([
                    {
                        $match: {
                            type: { $in: ['admin_commission', 'delivery_fee'] },
                            createdAt: {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                                type: '$type'
                            },
                            total: { $sum: '$amount' }
                        }
                    },
                    { $sort: { '_id.date': 1, '_id.type': 1 } }
                ]);
                break;

            default:
                return res.status(400).json({ message: 'Invalid report type' });
        }

        const report = new Report({
            type,
            startDate,
            endDate,
            data
        });
        await report.save();

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getReports = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        let query = {};

        if (type) query.type = type;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const reports = await Report.find(query)
            .populate('generatedBy')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
