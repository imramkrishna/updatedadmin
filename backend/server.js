require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const fooddashboardRoutes = require('./routes/fooddashboard.routes');
const foodposRoutes = require('./routes/foodpos.routes');
const foodorderRoutes = require('./routes/foodorder.routes');
const foodstoreRoutes = require('./routes/foodstore.routes');
const foodproductRoutes = require('./routes/foodproduct.routes');
const foodpromotionRoutes = require('./routes/foodpromotion.routes');
const foodnotificationRoutes = require('./routes/foodnotification.routes');
const foodcashbackRoutes = require('./routes/foodcashback.routes');
const fooddispatchRoutes = require('./routes/fooddispatch.routes');
const foodSettingRoutes = require('./routes/foodsetting.routes');
const foodTransactionRoutes = require('./routes/foodtransaction.routes.js');
const bannerAndAdRoutes = require('./routes/bannerandad.routes');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'x-auth-token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://PrajwalPP:Prajwal12345@foodcluster.r9yvi.mongodb.net/?retryWrites=true&w=majority&appName=foodCluster', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// FoodRoutes
app.use('/api/auth', authRoutes);
app.use('/api/fooddashboard', fooddashboardRoutes);
app.use('/api/foodpos', foodposRoutes);
app.use('/api/foodorders', foodorderRoutes);
app.use('/api/foodstores', foodstoreRoutes);
app.use('/api/foodproducts', foodproductRoutes);
app.use('/api/foodpromotions', foodpromotionRoutes);
app.use('/api/foodnotifications', foodnotificationRoutes);
app.use('/api/foodcashbacks', foodcashbackRoutes);
app.use('/api/fooddispatch', fooddispatchRoutes);
app.use('/api/foodsettings', foodSettingRoutes);
app.use('/api/foodtransaction', foodTransactionRoutes);
app.use('/api/bannerandad', bannerAndAdRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
