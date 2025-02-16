const mongoose = require('mongoose');

const businessSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: mongoose.Schema.Types.Mixed,
    type: {
        type: String,
        enum: ['text', 'number', 'boolean', 'json', 'image'],
        default: 'text'
    },
    category: {
        type: String,
        enum: ['business', 'payment', 'notification', 'system'],
        default: 'business'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const paymentMethodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: String,
    config: {
        type: Map,
        of: String
    },
    status: {
        type: Boolean,
        default: true
    }
});


const businessSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    logo: { type: String },
    timeZone: { type: String, required: true },
    timeFormat: { type: String, required: true },
    currencySymbol: { type: String, required: true },
    currencyPosition: { type: String, enum: ["Left", "Right"], required: true },
    decimalPoints: { type: Number, default: 2 },
    commissionRate: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    orderConfirm: { type: String, enum: ["Store", "Deliveryman"], required: true },
    taxIncluded: { type: Boolean, default: false },
    foodPreference: { type: Boolean, default: false },
    adminNotification: { type: Boolean, default: false },
    orderNotification: { type: String, enum: ["Realtime", "Manual"], required: true },
    freeDelivery: { type: Boolean, default: false },
    guestCheckout: { type: Boolean, default: false },
    countryPicker: { type: Boolean, default: false },
    additionalChargeName: { type: String, default: "" },
    additionalChargeAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["COD", "Digital Payment", "Both"], required: true },
    minShippingCharge: { type: Number, required: true },
    perKmShippingCharge: { type: Number, required: true },
    subscription: { type: Boolean, default: false },
    commission: { type: Boolean, default: false },
}, { timestamps: true });


const notificationTemplateSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    variables: [{
        type: String
    }]
});

const languageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    direction: {
        type: String,
        enum: ['ltr', 'rtl'],
        default: 'ltr'
    },
    status: {
        type: Boolean,
        default: true
    }
});

const BusinessSetting = mongoose.model('BusinessSetting', businessSettingSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);
const Language = mongoose.model('Language', languageSchema);
const Business = mongoose.model('Business', businessSchema);

module.exports = {
    BusinessSetting,
    PaymentMethod,
    NotificationTemplate,
    Language,
    Business
};
