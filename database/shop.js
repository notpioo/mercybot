
const mongoose = require('mongoose');

// Shop Item Schema
const shopItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true,
        enum: ['border', 'premium', 'booster', 'cosmetic']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    priceType: {
        type: String,
        required: true,
        enum: ['balance', 'chips']
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    imageUrl: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    purchaseLimit: {
        type: String,
        enum: ['unlimited', 'once'],
        default: 'unlimited'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        default: 'system'
    }
});

// Purchase History Schema
const purchaseHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopItem',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    priceType: {
        type: String,
        required: true
    },
    purchasedAt: {
        type: Date,
        default: Date.now
    }
});

const ShopItem = mongoose.model('ShopItem', shopItemSchema);
const PurchaseHistory = mongoose.model('PurchaseHistory', purchaseHistorySchema);

// Initialize shop table
const initShopTable = async () => {
    try {
        console.log('🛒 Initializing shop system...');
        
        // Check if shop items already exist
        const existingItems = await ShopItem.countDocuments();
        if (existingItems > 0) {
            console.log('✅ Shop system already initialized');
            return;
        }

        // Create default shop items
        const defaultItems = [
            {
                name: 'Gold Frame Border',
                description: 'Elegant gold border frame for your profile',
                category: 'border',
                price: 5000,
                priceType: 'balance',
                stock: 50,
                imageUrl: '/borders/gold-frame.svg'
            },
            {
                name: 'Neon Glow Border',
                description: 'Futuristic neon glow effect border',
                category: 'border',
                price: 2000,
                priceType: 'chips',
                stock: 30,
                imageUrl: '/borders/neon-glow.svg'
            },
            {
                name: 'Diamond Luxury Border',
                description: 'Premium diamond-studded border',
                category: 'border',
                price: 10000,
                priceType: 'chips',
                stock: 10,
                imageUrl: '/borders/diamond-luxury.svg'
            }
        ];
        
        await ShopItem.insertMany(defaultItems);
        console.log('✅ Default shop items created successfully');
        
    } catch (error) {
        console.error('❌ Error initializing shop system:', error.message);
    }
};

// Get all shop items
const getAllShopItems = async () => {
    try {
        return await ShopItem.find({ isActive: true }).sort({ createdAt: -1 });
    } catch (error) {
        console.error('❌ Error fetching shop items:', error.message);
        return [];
    }
};

// Get shop item by ID
const getShopItemById = async (itemId) => {
    try {
        return await ShopItem.findById(itemId);
    } catch (error) {
        console.error('❌ Error fetching shop item:', error.message);
        return null;
    }
};

// Create new shop item
const createShopItem = async (itemData) => {
    try {
        const newItem = new ShopItem(itemData);
        await newItem.save();
        console.log(`✅ Shop item created: ${newItem.name}`);
        return newItem;
    } catch (error) {
        console.error('❌ Error creating shop item:', error.message);
        return null;
    }
};

// Update shop item
const updateShopItem = async (itemId, updateData) => {
    try {
        const updatedItem = await ShopItem.findByIdAndUpdate(
            itemId, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (updatedItem) {
            console.log(`✅ Shop item updated: ${updatedItem.name}`);
        }
        
        return updatedItem;
    } catch (error) {
        console.error('❌ Error updating shop item:', error.message);
        return null;
    }
};

// Delete shop item
const deleteShopItem = async (itemId) => {
    try {
        const deletedItem = await ShopItem.findByIdAndUpdate(
            itemId,
            { isActive: false },
            { new: true }
        );
        
        if (deletedItem) {
            console.log(`✅ Shop item deleted: ${deletedItem.name}`);
        }
        
        return deletedItem;
    } catch (error) {
        console.error('❌ Error deleting shop item:', error.message);
        return null;
    }
};

// Purchase item
const purchaseItem = async (userId, itemId) => {
    try {
        const item = await getShopItemById(itemId);
        if (!item) {
            return { success: false, message: 'Item tidak ditemukan' };
        }

        if (item.stock <= 0) {
            return { success: false, message: 'Item sudah habis' };
        }

        // Get user data
        const { getUser, updateUser } = require('../utils/userUtils');
        const user = await getUser(userId);
        
        if (!user) {
            return { success: false, message: 'User tidak ditemukan' };
        }

        // Check if item is one-time purchase and user already bought it
        if (item.purchaseLimit === 'once') {
            const existingPurchase = await PurchaseHistory.findOne({ userId, itemId });
            if (existingPurchase) {
                return { success: false, message: 'Item ini hanya bisa dibeli sekali per akun' };
            }
        }

        // Check if user has enough balance/chips
        const userAmount = item.priceType === 'balance' ? user.balance : user.chips;
        if (userAmount < item.price) {
            return { success: false, message: `${item.priceType === 'balance' ? 'Balance' : 'Chips'} tidak mencukupi` };
        }

        // Deduct user balance/chips
        const updateData = {};
        if (item.priceType === 'balance') {
            updateData.balance = user.balance - item.price;
        } else {
            updateData.chips = user.chips - item.price;
        }

        await updateUser(userId, updateData);

        // Reduce item stock
        await updateShopItem(itemId, { stock: item.stock - 1 });

        // Add item to user if it's a border
        if (item.category === 'border') {
            const { addBorderToUser } = require('./borders');
            // Create proper border ID mapping
            let borderId;
            if (item.name.toLowerCase().includes('gold')) {
                borderId = 'gold-frame';
            } else if (item.name.toLowerCase().includes('neon')) {
                borderId = 'neon-glow';
            } else if (item.name.toLowerCase().includes('diamond')) {
                borderId = 'diamond-luxury';
            } else {
                // Create ID from name
                borderId = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            }
            
            console.log(`🛒 Adding border to user ${userId}:`, {
                itemName: item.name,
                borderId: borderId,
                category: item.category
            });
            
            const borderResult = await addBorderToUser(userId, borderId);
            console.log(`🛒 Border assignment result for ${userId}:`, borderResult);
            
            if (!borderResult.success) {
                console.error(`❌ Failed to add border ${borderId} to user ${userId}:`, borderResult.message);
            } else {
                console.log(`✅ Successfully added border ${borderId} to user ${userId}`);
            }
        }

        // Record purchase history
        const purchase = new PurchaseHistory({
            userId,
            itemId,
            itemName: item.name,
            price: item.price,
            priceType: item.priceType
        });
        
        await purchase.save();

        console.log(`✅ Item purchased: ${item.name} by ${userId}`);
        
        return { 
            success: true, 
            message: 'Item berhasil dibeli!',
            item: item,
            purchase: purchase
        };
        
    } catch (error) {
        console.error('❌ Error purchasing item:', error.message);
        return { success: false, message: 'Terjadi kesalahan saat membeli item' };
    }
};

// Get user purchase history
const getUserPurchaseHistory = async (userId) => {
    try {
        return await PurchaseHistory.find({ userId }).sort({ purchasedAt: -1 });
    } catch (error) {
        console.error('❌ Error fetching purchase history:', error.message);
        return [];
    }
};

module.exports = {
    ShopItem,
    PurchaseHistory,
    initShopTable,
    getAllShopItems,
    getShopItemById,
    createShopItem,
    updateShopItem,
    deleteShopItem,
    purchaseItem,
    getUserPurchaseHistory
};
