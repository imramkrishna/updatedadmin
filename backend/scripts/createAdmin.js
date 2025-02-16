require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/admin.model');

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://PrajwalPP:Prajwal12345@foodcluster.r9yvi.mongodb.net/?retryWrites=true&w=majority&appName=foodCluster', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@admin.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = new Admin({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@admin.com',
            password: '12345678',
            phone: '1234567890',
            isActive: true
        });

        await admin.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser(); 