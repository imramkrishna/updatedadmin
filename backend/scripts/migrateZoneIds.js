const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Store = require('../models/foodstore.model');
const Campaign = require('../models/foodcampaign.model');
const FlashDeal = require('../models/foodflashDeal.model');
const Coupon = require('../models/foodcoupon.model');
const { Banner, Advertisement } = require('../models/bannerandad.model');
const Order = require('../models/foodorder.model');

async function migrateZoneIds() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Migrate Store zone IDs
        const stores = await Store.find({});
        for (const store of stores) {
            if (store.zone && store.zone instanceof mongoose.Types.ObjectId) {
                store.zone = store.zone.toString();
                await store.save();
            }
        }
        console.log('Migrated Store zone IDs');

        // Migrate Campaign zone IDs
        const campaigns = await Campaign.find({});
        for (const campaign of campaigns) {
            if (campaign.zone && campaign.zone instanceof mongoose.Types.ObjectId) {
                campaign.zone = campaign.zone.toString();
                await campaign.save();
            }
        }
        console.log('Migrated Campaign zone IDs');

        // Migrate FlashDeal zone IDs
        const flashDeals = await FlashDeal.find({});
        for (const flashDeal of flashDeals) {
            if (flashDeal.zone && flashDeal.zone instanceof mongoose.Types.ObjectId) {
                flashDeal.zone = flashDeal.zone.toString();
                await flashDeal.save();
            }
        }
        console.log('Migrated FlashDeal zone IDs');

        // Migrate Coupon zone IDs
        const coupons = await Coupon.find({});
        for (const coupon of coupons) {
            if (coupon.zone && coupon.zone instanceof mongoose.Types.ObjectId) {
                coupon.zone = coupon.zone.toString();
                await coupon.save();
            }
        }
        console.log('Migrated Coupon zone IDs');

        // Migrate Banner zone IDs
        const banners = await Banner.find({});
        for (const banner of banners) {
            if (banner.zone && banner.zone instanceof mongoose.Types.ObjectId) {
                banner.zone = banner.zone.toString();
                await banner.save();
            }
        }
        console.log('Migrated Banner zone IDs');

        // Migrate Advertisement zone IDs
        const advertisements = await Advertisement.find({});
        for (const ad of advertisements) {
            if (ad.targetAudience && ad.targetAudience.zones) {
                ad.targetAudience.zones = ad.targetAudience.zones.map(zone => 
                    zone instanceof mongoose.Types.ObjectId ? zone.toString() : zone
                );
                await ad.save();
            }
        }
        console.log('Migrated Advertisement zone IDs');

        // Migrate Order zone IDs
        const orders = await Order.find({});
        for (const order of orders) {
            if (order.zone && order.zone instanceof mongoose.Types.ObjectId) {
                order.zone = order.zone.toString();
                await order.save();
            }
        }
        console.log('Migrated Order zone IDs');

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration
migrateZoneIds(); 