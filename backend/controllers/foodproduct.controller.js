const Product = require('../models/foodproduct.model');
const Category = require('../models/foodcategory.model');
const SubCategory = require('../models/foodsubcategory.model');
const Unit = require('../models/foodunit.model');
const Attribute = require('../models/foodattribute.model');
const ProductRequest = require('../models/foodproductRequest.model');
const Review = require('../models/foodreview.model');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cloudinary = require("../utils/cloudinaryConfig.js");


// Category Management
exports.createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { name, priority } = req.body;

        // Convert name to Map before saving
        if (typeof name === "object" && name !== null) {
            name = new Map(Object.entries(name));
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid name format. Expected an object with language keys."
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ "name.en": name.get("en") });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "This category already exists.",
            });
        }

        // Ensure an image file is provided
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image is required.",
            });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "categories", // Cloudinary folder name
            use_filename: true,
            unique_filename: false,
        });

        if (!result.secure_url) {
            return res.status(500).json({
                success: false,
                message: "Failed to upload image.",
            });
        }

        // Delete the temporary uploaded file
        fs.unlinkSync(req.file.path);

        // Create category with Cloudinary image URL
        const category = new Category({
            name,
            image: result.secure_url, // Store Cloudinary URL
            priority,
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


exports.listCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.ar': { $regex: search, $options: 'i' } }
            ];
        }

        const categories = await Category.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { priority: -1, 'name.en': 1 }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('List categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// SubCategory Management
exports.createSubCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, category, priority } = req.body;

        // Check if subcategory already exists under the same category
        const existingSubCategory = await SubCategory.findOne({ "name.en": name.en, category });

        if (existingSubCategory) {
            return res.status(400).json({
                success: false,
                message: "This subcategory already exists in the selected category."
            });
        }

        const subCategory = new SubCategory({
            name,
            category,
            priority
        });

        await subCategory.save();

        res.status(201).json({
            success: true,
            message: "Subcategory created successfully",
            data: subCategory
        });
    } catch (error) {
        console.error("Create subcategory error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


exports.listSubCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category, status } = req.query;

        const query = {};
        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.ar': { $regex: search, $options: 'i' } }
            ];
        }

        const subCategories = await SubCategory.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: 'category',
            sort: { priority: -1, 'name.en': 1 }
        });

        res.json({
            success: true,
            data: subCategories
        });
    } catch (error) {
        console.error('List subcategories error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Unit Management
exports.createUnit = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, symbol } = req.body;

        // Check if the unit already exists
        const existingUnit = await Unit.findOne({ name });

        if (existingUnit) {
            return res.status(400).json({
                success: false,
                message: "This unit already exists."
            });
        }

        const unit = new Unit({
            name,
            symbol
        });

        await unit.save();

        res.status(201).json({
            success: true,
            message: "Unit created successfully",
            data: unit
        });
    } catch (error) {
        console.error("Create unit error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


exports.listUnits = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.ar': { $regex: search, $options: 'i' } },
                { symbol: { $regex: search, $options: 'i' } }
            ];
        }

        const units = await Unit.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { 'name.en': 1 }
        });

        res.json({
            success: true,
            data: units
        });
    } catch (error) {
        console.error('List units error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Attribute Management


exports.createAttribute = async (req, res) => {
    try {
      let { name, values } = req.body;
  
      // Convert values if they are strings
      if (Array.isArray(values) && values.every(val => typeof val === "string")) {
        values = values.map(val => ({ lang: "en", value: val })); // Change "en" based on context
      }
  
      const attribute = new Attribute({ name, values });
      await attribute.save();
  
      res.status(201).json({ success: true, message: "Attribute created", attribute });
    } catch (error) {
      console.error("Create attribute error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  };
  

exports.listAttributes = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.ar': { $regex: search, $options: 'i' } }
            ];
        }

        const attributes = await Attribute.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { 'name.en': 1 }
        });

        res.json({
            success: true,
            data: attributes
        });
    } catch (error) {
        console.error('List attributes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Product Management

exports.createProduct = async (req, res) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        let productData = { ...req.body };

        // Convert `name` and `description` to Map format
        if (productData.name && typeof productData.name === "object") {
            productData.name = new Map(Object.entries(productData.name));
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid name format. Expected an object with language keys."
            });
        }

        if (productData.description && typeof productData.description === "object") {
            productData.description = new Map(Object.entries(productData.description));
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid description format. Expected an object with language keys."
            });
        }

        // Ensure attributes are in correct format
        if (!Array.isArray(productData.attributes)) {
            productData.attributes = [];
        }

        // Check if product already exists in the store
        const existingProduct = await Product.findOne({ 
            "name.en": productData.name.get("en"), 
            store: productData.store 
        });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "This product already exists in this store."
            });
        }

        // Ensure images and thumbnail are provided
        if (!req.files?.images || !req.files?.thumbnail) {
            return res.status(400).json({
                success: false,
                message: "Product images and thumbnail are required."
            });
        }

        // Upload images to Cloudinary
        const uploadToCloudinary = async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "products",
                use_filename: true,
                unique_filename: false
            });
            return result.secure_url;
        };

        // Upload all images and thumbnail
        const imageUrls = await Promise.all(req.files.images.map(file => uploadToCloudinary(file)));
        const thumbnailUrl = await uploadToCloudinary(req.files.thumbnail[0]);

        // Clean up local uploaded files
        req.files.images.forEach(file => fs.unlinkSync(file.path));
        fs.unlinkSync(req.files.thumbnail[0].path);

        // Assign Cloudinary URLs to product data
        productData.images = imageUrls;
        productData.thumbnail = thumbnailUrl;

        // Save product to database
        const product = new Product(productData);
        await product.save();

        // Update category and subcategory product counts
        await Category.findByIdAndUpdate(product.category, { $inc: { productCount: 1 } });
        if (product.subCategory) {
            await SubCategory.findByIdAndUpdate(product.subCategory, { $inc: { productCount: 1 } });
        }

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });

    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



exports.listProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            category,
            subCategory,
            store,
            status,
            minPrice,
            maxPrice,
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (search) {
            query.$or = [
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.ar': { $regex: search, $options: 'i' } },
                { 'description.en': { $regex: search, $options: 'i' } },
                { 'description.ar': { $regex: search, $options: 'i' } }
            ];
        }

        if (category) query.category = category;
        if (subCategory) query.subCategory = subCategory;
        if (store) query.store = store;
        if (status) query.status = status;
        
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }

        const products = await Product.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: ['category', 'subCategory', 'unit', 'store']
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('List products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

//toggle


// Product Request Management
exports.getProductRequests = async (req, res) => {
    try {
        const requests = await Product.find({ status: 'pending' })
            .populate('store', 'name')
            .populate('category', 'name')
            .populate('createdBy', 'name');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
},


// handle product requests
exports.updateProductRequestStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                status,
                rejectionReason: status === 'rejected' ? rejectionReason : undefined
            },
            { new: true }
        );
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// Review Management
exports.listReviews = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            product,
            store,
            rating,
            status,
            sortField = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (product) query.product = product;
        if (store) query.store = store;
        if (rating) query.rating = parseInt(rating);
        if (status) query.status = status;

        const reviews = await Review.paginate(query, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
            populate: [
                { path: 'product', select: 'name thumbnail' },
                { path: 'customer', select: 'firstName lastName' },
                { path: 'store', select: 'name' }
            ]
        });

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('List reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Import/Export Products
exports.importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a CSV file'
            });
        }

        const results = [];
        const errors = [];

        // Process CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', async (data) => {
                try {
                    // Transform CSV data to product data
                    const productData = {
                        name: {
                            en: data.name_en,
                            ar: data.name_ar
                        },
                        description: {
                            en: data.description_en,
                            ar: data.description_ar
                        },
                        store: data.store_id,
                        category: data.category_id,
                        subCategory: data.subcategory_id,
                        unit: data.unit_id,
                        price: parseFloat(data.price),
                        stock: parseInt(data.stock),
                        // Add other fields as needed
                    };

                    const product = new Product(productData);
                    await product.save();
                    results.push(product);
                } catch (error) {
                    errors.push({
                        row: data,
                        error: error.message
                    });
                }
            })
            .on('end', () => {
                // Delete temporary file
                fs.unlink(req.file.path);

                res.json({
                    success: true,
                    data: {
                        imported: results.length,
                        errors: errors
                    }
                });
            });
    } catch (error) {
        console.error('Import products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.exportProducts = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;

        const products = await Product.find()
            .populate('store', 'name')
            .populate('category', 'name')
            .populate('subCategory', 'name')
            .populate('unit', 'name symbol');

        if (format === 'csv') {
            const csvWriter = createCsvWriter({
                path: 'products_export.csv',
                header: [
                    { id: 'name_en', title: 'Name (English)' },
                    { id: 'name_ar', title: 'Name (Arabic)' },
                    { id: 'store', title: 'Store' },
                    { id: 'category', title: 'Category' },
                    { id: 'subCategory', title: 'Sub Category' },
                    { id: 'unit', title: 'Unit' },
                    { id: 'price', title: 'Price' },
                    { id: 'stock', title: 'Stock' },
                    { id: 'status', title: 'Status' }
                ]
            });

            const records = products.map(product => ({
                name_en: product.name.get('en'),
                name_ar: product.name.get('ar'),
                store: product.store.name,
                category: product.category.name.get('en'),
                subCategory: product.subCategory?.name.get('en') || '',
                unit: product.unit.symbol,
                price: product.price,
                stock: product.stock,
                status: product.status
            }));

            await csvWriter.writeRecords(records);

            res.download('products_export.csv', () => {
                fs.unlink('products_export.csv');
            });
        } else {
            res.json({
                success: true,
                data: products
            });
        }
    } catch (error) {
        console.error('Export products error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
