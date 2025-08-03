const mongoose = require('mongoose');

// Border Schema
const borderSchema = new mongoose.Schema({
    borderId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        required: true
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    isActive: {
        type: Boolean,
        default: true
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

// User Border Schema - tracks which borders users own and which they have equipped
const userBorderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    ownedBorders: [{
        borderId: String,
        obtainedAt: {
            type: Date,
            default: Date.now
        }
    }],
    equippedBorder: {
        type: String,
        default: null // null means no border equipped
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Border = mongoose.model('Border', borderSchema);
const UserBorder = mongoose.model('UserBorder', userBorderSchema);

// Initialize borders table with default borders
const initBordersTable = async () => {
    try {
        console.log('🎨 Initializing borders system...');
        
        // Check if borders already exist
        const existingBorders = await Border.countDocuments();
        if (existingBorders > 0) {
            console.log('✅ Borders system already initialized');
            return;
        }

        // Create default borders
        const defaultBorders = [
            {
                borderId: 'default',
                name: 'Default',
                description: 'Simple clean border',
                imageUrl: '/borders/default.svg',
                rarity: 'common'
            },
            {
                borderId: 'gold-frame',
                name: 'Gold Frame',
                description: 'Elegant gold border frame',
                imageUrl: '/borders/gold-frame.svg',
                rarity: 'rare'
            },
            {
                borderId: 'neon-glow',
                name: 'Neon Glow',
                description: 'Futuristic neon glow effect',
                imageUrl: '/borders/neon-glow.svg',
                rarity: 'epic'
            },
            {
                borderId: 'diamond-luxury',
                name: 'Diamond Luxury',
                description: 'Premium diamond-studded border',
                imageUrl: '/borders/diamond-luxury.svg',
                rarity: 'legendary'
            }
        ];

        await Border.insertMany(defaultBorders);
        console.log('✅ Default borders created successfully');
        
    } catch (error) {
        console.error('❌ Error initializing borders system:', error.message);
    }
};

// Get all active borders
const getAllBorders = async () => {
    try {
        return await Border.find({ isActive: true }).sort({ createdAt: -1 });
    } catch (error) {
        console.error('❌ Error fetching borders:', error.message);
        return [];
    }
};

// Get border by ID
const getBorderById = async (borderId) => {
    try {
        return await Border.findOne({ borderId, isActive: true });
    } catch (error) {
        console.error('❌ Error fetching border:', error.message);
        return null;
    }
};

// Create new border
const createBorder = async (borderData) => {
    try {
        const border = new Border(borderData);
        await border.save();
        console.log(`✅ Border created: ${border.name}`);
        return border;
    } catch (error) {
        console.error('❌ Error creating border:', error.message);
        return null;
    }
};

// Update border
const updateBorder = async (borderId, updateData) => {
    try {
        const border = await Border.findOneAndUpdate(
            { borderId },
            { ...updateData, updatedAt: new Date() },
            { new: true }
        );
        console.log(`✅ Border updated: ${borderId}`);
        return border;
    } catch (error) {
        console.error('❌ Error updating border:', error.message);
        return null;
    }
};

// Delete border (soft delete)
const deleteBorder = async (borderId) => {
    try {
        const border = await Border.findOneAndUpdate(
            { borderId },
            { isActive: false },
            { new: true }
        );
        console.log(`✅ Border deleted: ${borderId}`);
        return border;
    } catch (error) {
        console.error('❌ Error deleting border:', error.message);
        return null;
    }
};

// Get user's borders
const getUserBorders = async (userId) => {
    try {
        let userBorders = await UserBorder.findOne({ userId });
        if (!userBorders) {
            // Create default user borders entry with default border
            userBorders = new UserBorder({
                userId,
                ownedBorders: [{ borderId: 'default' }],
                equippedBorder: null
            });
            await userBorders.save();
        }
        
        // Return the full user border document for API
        return userBorders;
    } catch (error) {
        console.error('❌ Error fetching user borders:', error.message);
        return { ownedBorders: [], equippedBorder: null };
    }
};

// Add border to user
const addBorderToUser = async (userId, borderId) => {
    try {
        // Get or create user border document
        let userBorderDoc = await UserBorder.findOne({ userId });
        
        if (!userBorderDoc) {
            userBorderDoc = new UserBorder({
                userId,
                ownedBorders: [{ borderId: 'default' }],
                equippedBorder: null
            });
        }
        
        // Check if user already owns this border
        const alreadyOwns = userBorderDoc.ownedBorders.some(b => b.borderId === borderId);
        if (alreadyOwns) {
            console.log(`⚠️ User ${userId} already owns border ${borderId}`);
            return { success: false, message: 'User already owns this border' };
        }

        // Add the border
        userBorderDoc.ownedBorders.push({ borderId });
        userBorderDoc.updatedAt = new Date();
        await userBorderDoc.save();
        
        console.log(`✅ Border ${borderId} added to user ${userId}. Total owned: ${userBorderDoc.ownedBorders.length}`);
        return { success: true, message: 'Border added successfully' };
    } catch (error) {
        console.error('❌ Error adding border to user:', error.message);
        return { success: false, message: 'Failed to add border: ' + error.message };
    }
};

// Equip border for user
const equipBorder = async (userId, borderId) => {
    try {
        const userBorders = await getUserBorders(userId);
        
        // Check if user owns this border
        const ownsBorder = userBorders.ownedBorders.some(b => b.borderId === borderId);
        if (!ownsBorder && borderId !== null) {
            return { success: false, message: 'User does not own this border' };
        }

        userBorders.equippedBorder = borderId;
        userBorders.updatedAt = new Date();
        await userBorders.save();
        
        console.log(`✅ Border ${borderId} equipped for user ${userId}`);
        return { success: true, message: 'Border equipped successfully' };
    } catch (error) {
        console.error('❌ Error equipping border:', error.message);
        return { success: false, message: 'Failed to equip border' };
    }
};

// Get user's equipped border
const getUserEquippedBorder = async (userId) => {
    try {
        const userBorders = await getUserBorders(userId);
        if (!userBorders.equippedBorder) {
            return null;
        }
        return await getBorderById(userBorders.equippedBorder);
    } catch (error) {
        console.error('❌ Error fetching equipped border:', error.message);
        return null;
    }
};

module.exports = {
    Border,
    UserBorder,
    initBordersTable,
    getAllBorders,
    getBorderById,
    createBorder,
    updateBorder,
    deleteBorder,
    getUserBorders,
    addBorderToUser,
    equipBorder,
    getUserEquippedBorder
};