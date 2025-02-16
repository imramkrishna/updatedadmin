const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const Zone = require('./foodzone.model.js');  // Adjust path if needed


const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    logo: {
        type: String,
        required: true,


    },
    coverImage: {
        type: String,
        required: true,

        
    },
    owner: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    zone: {
        type: String,
        required: true,
        trim: true
    },

    featured:{
        type:Boolean,
        default:true
    },
    
    vatNumber: String,
    taxPercentage: {
        type: Number,
        default: 0
    },
    deliveryTime: {
        min: Number,
        max: Number
    },
    minimumOrder: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    balance: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'denied'],
        default: 'pending'
    },
    isRecommended: {
        type: Boolean,
        default: false
    },
    metrics: {
        totalOrders: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        totalProducts: {
            type: Number,
            default: 0
        }
    },
    operatingHours: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        open: String,
        close: String,
        isClosed: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// Add pagination plugin
storeSchema.plugin(mongoosePaginate);

// Create indexes for frequently queried fields
storeSchema.index({ name: 'text' });
storeSchema.index({ status: 1 });
storeSchema.index({ zone: 1 });
storeSchema.index({ isRecommended: 1 });
storeSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Store', storeSchema);
