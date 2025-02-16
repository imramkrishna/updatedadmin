const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/foodtransaction.controller');

// Transaction Routes
router.get('/list', transactionController.getTransactions);
router.post('/create', transactionController.createTransaction);

// Withdrawal Routes
router.get('/withdraw/list', transactionController.getWithdrawalRequests);
router.put('/withdraw/:id/status', transactionController.updateWithdrawalStatus);

// Report Routes
router.post('/report/generate', transactionController.generateReport);
router.get('/report/list', transactionController.getReports);

module.exports = router;
