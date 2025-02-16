const {PaymentMethod, NotificationTemplate, Language, Business} = require('../models/foodsetting.model');

// Business Settings
// exports.getBusinessSettings = async (req, res) => {
//     try {
//         const { category } = req.query;
//         let query = {};

//         if (category) {
//             query.category = category;
//         }

//         const settings = await BusinessSetting.find(query);
//         res.json(settings);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

exports.getBusinessSettings = async (req, res) => {
    try {
        const settings = await Business.findOne();

        if (!settings) {
            return res.status(200).json({
                message: "No business settings found. Please add settings first.",
                defaultSettings: {
                    companyName: "",
                    email: "",
                    phone: "",
                    country: "",
                    address: "",
                    currencySymbol: "USD ($)"
                }
            });
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.createOrUpdateBusiness = async (req, res) => {
    try {
        const { companyName, email, phone, country, address, latitude, longitude, logo, timeZone, timeFormat, currencySymbol, currencyPosition, decimalPoints, commissionRate, deliveryCharge, orderConfirm, taxIncluded, foodPreference, adminNotification, orderNotification, freeDelivery, guestCheckout, countryPicker, additionalChargeName, additionalChargeAmount, paymentMethod, minShippingCharge, perKmShippingCharge, subscription, commission } = req.body;

        let business = await Business.findOne(); // Get the existing settings

        if (business) {
            // Update existing business settings
            business = await Business.findOneAndUpdate({}, {
                companyName, email, phone, country, address, latitude, longitude, logo, timeZone, timeFormat, currencySymbol, currencyPosition, decimalPoints, commissionRate, deliveryCharge, orderConfirm, taxIncluded, foodPreference, adminNotification, orderNotification, freeDelivery, guestCheckout, countryPicker, additionalChargeName, additionalChargeAmount, paymentMethod, minShippingCharge, perKmShippingCharge, subscription, commission
            }, { new: true });
        } else {
            // Create new business settings
            business = new Business({
                companyName, email, phone, country, address, latitude, longitude, logo, timeZone, timeFormat, currencySymbol, currencyPosition, decimalPoints, commissionRate, deliveryCharge, orderConfirm, taxIncluded, foodPreference, adminNotification, orderNotification, freeDelivery, guestCheckout, countryPicker, additionalChargeName, additionalChargeAmount, paymentMethod, minShippingCharge, perKmShippingCharge, subscription, commission
            });

            await business.save();
        }

        res.status(200).json({ success: true, message: "Business settings updated successfully", business });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

exports.updateBusinessSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, type } = req.body;

        const setting = await BusinessSetting.findOneAndUpdate(
            { key },
            { value, type, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        res.json(setting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Payment Methods
exports.getPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find().sort({ name: 1 });
        res.json(paymentMethods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentMethod = await PaymentMethod.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!paymentMethod) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        res.json(paymentMethod);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Notification Templates
exports.getNotificationTemplates = async (req, res) => {
    try {
        const templates = await NotificationTemplate.find().sort({ type: 1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateNotificationTemplate = async (req, res) => {
    try {
        const { type } = req.params;
        const template = await NotificationTemplate.findOneAndUpdate(
            { type },
            req.body,
            { new: true, upsert: true }
        );

        res.json(template);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Languages
exports.getLanguages = async (req, res) => {
    try {
        const languages = await Language.find().sort({ name: 1 });
        res.json(languages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createLanguage = async (req, res) => {
    try {
        const language = new Language(req.body);
        await language.save();
        res.status(201).json(language);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateLanguage = async (req, res) => {
    try {
        const { code } = req.params;
        const language = await Language.findOneAndUpdate(
            { code },
            req.body,
            { new: true }
        );

        if (!language) {
            return res.status(404).json({ message: 'Language not found' });
        }

        res.json(language);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Bulk Settings Update
exports.updateMultipleSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        const updatePromises = settings.map(setting => 
            BusinessSetting.findOneAndUpdate(
                { key: setting.key },
                { 
                    value: setting.value,
                    type: setting.type,
                    updatedAt: new Date()
                },
                { new: true, upsert: true }
            )
        );

        const updatedSettings = await Promise.all(updatePromises);
        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
