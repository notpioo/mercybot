const mongoose = require('mongoose');

// User fishing data schema
const fishingUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    // Current equipment
    currentRod: {
        type: String,
        default: 'wood'
    },
    currentBait: {
        type: String,
        default: 'worm'
    },
    // Stats
    totalFish: {
        type: Number,
        default: 0
    },
    totalExp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    // Last fishing time for cooldown
    lastFishTime: {
        type: Date,
        default: null
    },
    // Inventory
    inventory: {
        // Rods owned
        rods: [{
            rodId: String,
            quantity: {
                type: Number,
                default: 1
            },
            obtainedAt: {
                type: Date,
                default: Date.now
            }
        }],
        // Baits owned
        baits: [{
            baitId: String,
            quantity: {
                type: Number,
                default: 1
            },
            obtainedAt: {
                type: Date,
                default: Date.now
            }
        }],
        // Fish caught
        fish: [{
            fishId: String,
            quantity: {
                type: Number,
                default: 0
            },
            totalWeight: {
                type: Number,
                default: 0
            },
            bestWeight: {
                type: Number,
                default: 0
            },
            firstCaught: {
                type: Date,
                default: Date.now
            }
        }]
    },
    // Achievements/Statistics
    achievements: {
        firstFish: {
            type: Boolean,
            default: false
        },
        hundredFish: {
            type: Boolean,
            default: false
        },
        legendaryFish: {
            type: Boolean,
            default: false
        },
        masterAngler: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Initialize default equipment for new users
fishingUserSchema.pre('save', function(next) {
    if (this.isNew) {
        // Add default rod
        this.inventory.rods.push({
            rodId: 'wood',
            quantity: 1,
            obtainedAt: new Date()
        });
        
        // Add default bait
        this.inventory.baits.push({
            baitId: 'worm',
            quantity: 10, // Start with 10 worms
            obtainedAt: new Date()
        });
    }
    next();
});

// Methods
fishingUserSchema.methods.addFish = function(fishId, weight) {
    const existingFish = this.inventory.fish.find(f => f.fishId === fishId);
    
    if (existingFish) {
        existingFish.quantity += 1;
        existingFish.totalWeight += weight;
        if (weight > existingFish.bestWeight) {
            existingFish.bestWeight = weight;
        }
    } else {
        this.inventory.fish.push({
            fishId: fishId,
            quantity: 1,
            totalWeight: weight,
            bestWeight: weight,
            firstCaught: new Date()
        });
    }
    
    this.totalFish += 1;
};

fishingUserSchema.methods.addExp = function(exp) {
    this.totalExp += exp;
    
    // Calculate new level
    const fishingConfig = require('../config/fishingConfig');
    let newLevel = 1;
    for (let i = 0; i < fishingConfig.levelRequirements.length; i++) {
        if (this.totalExp >= fishingConfig.levelRequirements[i]) {
            newLevel = i + 1;
        } else {
            break;
        }
    }
    
    const oldLevel = this.level;
    this.level = newLevel;
    
    return newLevel > oldLevel; // Return true if leveled up
};

fishingUserSchema.methods.addItem = function(itemType, itemId, quantity = 1) {
    const inventoryArray = this.inventory[itemType + 's']; // rods, baits
    const existingItem = inventoryArray.find(item => item[itemType + 'Id'] === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const newItem = {
            [`${itemType}Id`]: itemId,
            quantity: quantity,
            obtainedAt: new Date()
        };
        inventoryArray.push(newItem);
    }
};

fishingUserSchema.methods.hasItem = function(itemType, itemId, quantity = 1) {
    const inventoryArray = this.inventory[itemType + 's'];
    const item = inventoryArray.find(item => item[itemType + 'Id'] === itemId);
    return item && item.quantity >= quantity;
};

fishingUserSchema.methods.removeItem = function(itemType, itemId, quantity = 1) {
    const inventoryArray = this.inventory[itemType + 's'];
    const item = inventoryArray.find(item => item[itemType + 'Id'] === itemId);
    
    if (item && item.quantity >= quantity) {
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            const index = inventoryArray.indexOf(item);
            inventoryArray.splice(index, 1);
        }
        return true;
    }
    return false;
};

const FishingUser = mongoose.model('FishingUser', fishingUserSchema);

// Initialize fishing system
async function initializeFishingSystem() {
    try {
        console.log('🎣 Initializing fishing system...');
        
        // Check if collection exists
        const count = await FishingUser.countDocuments();
        console.log(`📊 Existing fishing users count: ${count}`);
        
        console.log('✅ Fishing system initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing fishing system:', error);
    }
}

// Admin functions for user management
async function getAllFishingUsers() {
    try {
        const users = await FishingUser.find().sort({ totalFish: -1 }).lean();
        return users.map(user => ({
            _id: user._id,
            phoneNumber: user.userId.replace('@s.whatsapp.net', ''),
            reelCoins: user.reelCoins || 0,
            level: user.level || 1,
            totalIncome: user.totalEarnings || 0,
            catches: user.inventory?.fish?.reduce((acc, fish) => {
                acc[fish.fishId] = fish.quantity;
                return acc;
            }, {}) || {},
            equipment: {
                rod: user.currentRod || 'wood',
                bait: user.currentBait || 'worm'
            }
        }));
    } catch (error) {
        console.error('Error fetching all fishing users:', error);
        throw error;
    }
}

async function getFishingUser(userId) {
    try {
        const user = await FishingUser.findById(userId).lean();
        if (!user) return null;
        
        return {
            _id: user._id,
            phoneNumber: user.userId.replace('@s.whatsapp.net', ''),
            reelCoins: user.reelCoins || 0,
            level: user.level || 1,
            totalIncome: user.totalEarnings || 0,
            catches: user.inventory?.fish?.reduce((acc, fish) => {
                acc[fish.fishId] = fish.quantity;
                return acc;
            }, {}) || {},
            equipment: {
                rod: user.currentRod || 'wood',
                bait: user.currentBait || 'worm'
            }
        };
    } catch (error) {
        console.error('Error fetching fishing user:', error);
        throw error;
    }
}

async function updateFishingUser(userId, updateData) {
    try {
        const updateFields = {};
        
        if (updateData.reelCoins !== undefined) updateFields.reelCoins = updateData.reelCoins;
        if (updateData.level !== undefined) updateFields.level = updateData.level;
        if (updateData.totalIncome !== undefined) updateFields.totalEarnings = updateData.totalIncome;
        if (updateData.equipment?.rod) updateFields.currentRod = updateData.equipment.rod;
        if (updateData.equipment?.bait) updateFields.currentBait = updateData.equipment.bait;
        
        const user = await FishingUser.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, upsert: false }
        ).lean();
        
        if (!user) return null;
        
        return {
            _id: user._id,
            phoneNumber: user.userId.replace('@s.whatsapp.net', ''),
            reelCoins: user.reelCoins || 0,
            level: user.level || 1,
            totalIncome: user.totalEarnings || 0,
            equipment: {
                rod: user.currentRod || 'wood',
                bait: user.currentBait || 'worm'
            }
        };
    } catch (error) {
        console.error('Error updating fishing user:', error);
        throw error;
    }
}

async function deleteFishingUser(userId) {
    try {
        const user = await FishingUser.findByIdAndDelete(userId);
        return user;
    } catch (error) {
        console.error('Error deleting fishing user:', error);
        throw error;
    }
}

module.exports = {
    FishingUser,
    initializeFishingSystem,
    getAllFishingUsers,
    getFishingUser,
    updateFishingUser,
    deleteFishingUser
};