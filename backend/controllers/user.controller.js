const { User, DeliveryMan, Admin } = require('../models/user.model');
const jwt = require('jsonwebtoken');

// User Management
exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = {};

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') }
            ];
        }

        const users = await User.find(query).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delivery Man Management
exports.createDeliveryMan = async (req, res) => {
    try {
        const { userData, deliveryManData } = req.body;

        const user = new User({
            ...userData,
            role: 'delivery_man'
        });
        await user.save();

        const deliveryMan = new DeliveryMan({
            user: user._id,
            ...deliveryManData
        });
        await deliveryMan.save();

        res.status(201).json({
            user,
            deliveryMan
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getDeliveryMen = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        const deliveryMen = await DeliveryMan.find(query)
            .populate({
                path: 'user',
                match: search ? {
                    $or: [
                        { name: new RegExp(search, 'i') },
                        { email: new RegExp(search, 'i') },
                        { phone: new RegExp(search, 'i') }
                    ]
                } : {}
            })
            .sort({ createdAt: -1 });

        // Filter out delivery men whose user data didn't match the search
        const filteredDeliveryMen = deliveryMen.filter(dm => dm.user);
        
        res.json(filteredDeliveryMen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDeliveryManStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const deliveryMan = await DeliveryMan.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('user');

        if (!deliveryMan) {
            return res.status(404).json({ message: 'Delivery man not found' });
        }

        res.json(deliveryMan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin Management
exports.createAdmin = async (req, res) => {
    try {
        const { userData, adminData } = req.body;

        const user = new User({
            ...userData,
            role: 'admin'
        });
        await user.save();

        const admin = new Admin({
            user: user._id,
            ...adminData
        });
        await admin.save();

        res.status(201).json({
            user,
            admin
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find()
            .populate('user')
            .sort({ 'user.createdAt': -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Authentication
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        if (user.role === 'admin') {
            const admin = await Admin.findOne({ user: user._id });
            if (admin) {
                admin.lastLogin = new Date();
                await admin.save();
            }
        }

        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
