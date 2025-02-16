const Product = require('../models/foodproduct.model');
const Customer = require('../models/customer.model');
const Order = require('../models/foodorder.model');
const Store = require('../models/foodstore.model');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Get stores list
exports.getStores = async (req, res) => {
    try {
        const stores = await Store.find({ status: 'active' })
            .select('name logo address')
            .sort('name');

        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get products by store
exports.getProducts = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { category, search, page = 1, limit = 20 } = req.query;

        const query = { store: storeId, status: 'active' };
        if (category) query.category = category;
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await Product.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            select: 'name thumbnail price stock discount unit',
            populate: 'unit',
            sort: { 'name.en': 1 }
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get or create customer
exports.getOrCreateCustomer = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone } = req.body;
        let customer = await Customer.findOne({ phone });

        if (!customer && req.body.firstName) {
            // Create new customer if not found
            customer = new Customer({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: phone
            });
            await customer.save();
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Get/Create customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};



//.............

// Add this helper function ABOVE the controller methods
const calculateOrderTotal = async (items, storeId) => {
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        return { success: false, message: 'Store not found' };
      }
  
      let subtotal = 0;
      const calculatedItems = [];
  
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return { success: false, message: `Product ${item.productId} not found` };
        }
  
        if (product.stock < item.quantity) {
          return { success: false, message: `Insufficient stock for ${product.name.en}` };
        }
  
        // Calculate price with discount
        let price = product.price;
        if (product.discount.value > 0) {
          price = product.discount.type === 'percentage' 
            ? price * (1 - product.discount.value / 100)
            : price - product.discount.value;
        }
  
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
  
        calculatedItems.push({
          product: product._id,
          quantity: item.quantity,
          price: price,
          total: itemTotal
        });
      }
  
      const tax = subtotal * (store.taxPercentage / 100);
      const total = subtotal + tax;
  
      return {
        success: true,
        data: {
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number(total.toFixed(2)),
          items: calculatedItems
        }
      };
  
    } catch (error) {
      console.error('Calculation error:', error);
      return { success: false, message: 'Error calculating total' };
    }
  };
// Calculate order total
exports.calculateTotal = async (req, res) => {
    const { items, storeId } = req.body;
    const result = await calculateOrderTotal(items, storeId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  };
  
  // Create order controller

// Create order
exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            customerId,
            storeId,
            items,
            paymentMethod,
            deliveryAddress
        } = req.body;

        // Check for duplicate order (same customer, same store, same items, and pending status)
        const existingOrder = await Order.findOne({
            customer: customerId,
            store: storeId,
            items: { $all: items },  // Check if all items are the same
            orderStatus: 'pending'    // Optional: Only prevent duplicate for pending orders
        });

        if (existingOrder) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending order with the same items in this store."
            });
        }

        // Generate unique order ID
        const orderCount = await Order.countDocuments();
        const orderId = `ORD${Date.now()}${orderCount + 1}`;

        // Calculate totals using the helper function (calculation logic)
        const calculationResult = await calculateOrderTotal(items, storeId);
        if (!calculationResult.success) {
            return res.status(400).json(calculationResult);
        }

        const { subtotal, tax, total, items: calculatedItems } = calculationResult.data;

        // Create and save the order
        const order = new Order({
            orderId,
            customer: customerId,
            store: storeId,
            items: calculatedItems,
            subtotal,
            tax,
            deliveryFee: 0,  // For POS orders
            total,
            paymentMethod,
            paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
            orderStatus: 'pending',  // Keep as pending until confirmed
            deliveryAddress
        });

        await order.save();

        // Update product stock (bulk update for efficiency)
        const productUpdates = items.map(item => ({
            updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { stock: -item.quantity } }
            }
        }));

        if (productUpdates.length > 0) {
            await Product.bulkWrite(productUpdates);
        }

        // Update customer and store metrics
        await Promise.all([
            Customer.findByIdAndUpdate(customerId, {
                $inc: { totalOrders: 1 },
                $set: { lastOrderDate: new Date() }
            }),
            Store.findByIdAndUpdate(storeId, {
                $inc: {
                    'metrics.totalOrders': 1,
                    'metrics.totalRevenue': total
                }
            })
        ]);

        // Return the newly created order
        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });

    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
