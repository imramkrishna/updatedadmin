const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

// Banner Schema
const bannerSchema = new Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store' },
    zone: { type: String, ref: 'Zone' }
}, { timestamps: true });

// Advertisement Schema
const advertisementSchema = new Schema({
    title: {
        type: Map,
        of: String,
        required: true
    },
    description: {
        type: Map,
        of: String,
        required: true
    },
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    type: {
        type: String,
        enum: ['popup', 'banner', 'video'],
        required: true
    },
    media: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: true,
        min: 1
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'expired', 'rejected'],
        default: 'pending'
    },
    impressions: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    targetAudience: {
        ageRange: {
            min: Number,
            max: Number
        },
        gender: {
            type: String,
            enum: ['all', 'male', 'female']
        },
        zones: [{
            type: String,
            ref: 'Zone'
        }]
    }
}, { timestamps: true });

// Add pagination plugin
bannerSchema.plugin(mongoosePaginate);
advertisementSchema.plugin(mongoosePaginate);

// Add indexes
bannerSchema.index({ store: 1, zone: 1 });
advertisementSchema.index({ store: 1, status: 1 });
advertisementSchema.index({ startDate: 1, endDate: 1 });

const Banner = mongoose.model('Banner', bannerSchema);
const Advertisement = mongoose.model('Advertisement', advertisementSchema);

module.exports = {
    Banner,
    Advertisement
}; 