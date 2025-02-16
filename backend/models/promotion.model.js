const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const bannerSchema = new Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store' },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone' }
}, { timestamps: true });

const campaignSchema = new Schema({
    title: {
        en: { type: String, required: true },
        ar: { type: String } // removed required: true
    },
    description: {
        en: { type: String, required: true },
        ar: { type: String } // removed required: true
    },
    image: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: { type: String, enum: ['general', 'store', 'product'], required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumPurchase: { type: Number, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' }
}, { timestamps: true });

// Add pagination plugin to campaign schema
campaignSchema.plugin(mongoosePaginate);

// Add indexes for commonly queried fields
campaignSchema.index({ 'title.en': 'text', 'title.ar': 'text' });
campaignSchema.index({ type: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ startDate: -1 });
campaignSchema.index({ endDate: -1 });

const cashbackSchema = new Schema({
    title: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    cashbackType: { type: String, enum: ['percentage', 'fixed'], required: true },
    amount: { type: Number, required: true },
    minimumPurchase: { type: Number, required: true },
    maximumDiscount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: Boolean, default: true }
}, { timestamps: true });

const couponSchema = new Schema({
    code: { type: String, required: true, unique: true },
    title: {
        en: { type: String, required: true },
        ar: { type: String } // removed required: true
    },
    description: {
        en: { type: String, required: true },
        ar: { type: String } // removed required: true
    },
    type: { 
        type: String, 
        enum: ['general', 'store', 'product', 'category', 'first_order'], 
        required: true 
    },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minimumPurchase: { type: Number, required: true },
    maximumDiscount: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: {
        perUser: { type: Number },
        total: { type: Number }
    },
    usageCount: { type: Number, default: 0 },
    userUsage: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 }
    }],
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    store: { type: Schema.Types.ObjectId, ref: 'Store' },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
}, { timestamps: true });

// Add pagination plugin to coupon schema
couponSchema.plugin(mongoosePaginate);

// Add indexes for commonly queried fields
couponSchema.index({ code: 1 });
couponSchema.index({ 'title.en': 'text', 'title.ar': 'text' });
couponSchema.index({ type: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ startDate: -1 });
couponSchema.index({ endDate: -1 });
couponSchema.index({ store: 1 });

const notificationSchema = new Schema({
    recipient: {
        type: { type: String, required: true },
        id: { type: Schema.Types.ObjectId, required: true }
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['info', 'warning', 'error', 'order', 'store', 'product', 'promotion', 'system'], required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Add pagination plugin to notification schema
notificationSchema.plugin(mongoosePaginate);

// Add indexes for commonly queried fields
notificationSchema.index({ 'recipient.type': 1, 'recipient.id': 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Banner = mongoose.model('Banner', bannerSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Cashback = mongoose.model('Cashback', cashbackSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    Banner,
    Campaign,
    Cashback,
    Coupon,
    Notification
};