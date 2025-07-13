const mongoose = require('mongoose');

// Level Reward Schema
const levelRewardSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true,
        unique: true
    },
    tier: {
        type: String,
        required: true,
        enum: ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend', 'mythic', 'honor', 'immortal']
    },
    rewards: {
        balance: {
            type: Number,
            default: 0
        },
        chips: {
            type: Number,
            default: 0
        },
        premium: {
            type: Number,
            default: 0 // days
        },
        special: {
            type: String,
            default: null // special reward description
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Tier Milestone Reward Schema
const tierMilestoneSchema = new mongoose.Schema({
    tier: {
        type: String,
        required: true,
        unique: true,
        enum: ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend', 'mythic', 'honor', 'immortal']
    },
    rewards: {
        balance: {
            type: Number,
            default: 0
        },
        chips: {
            type: Number,
            default: 0
        },
        premium: {
            type: Number,
            default: 0 // days
        },
        special: {
            type: String,
            default: null
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// User Level Reward Claims Schema
const userLevelClaimSchema = new mongoose.Schema({
    userJid: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    tier: {
        type: String,
        required: true
    },
    rewardType: {
        type: String,
        enum: ['level', 'tier'],
        required: true
    },
    rewardsClaimed: {
        balance: Number,
        chips: Number,
        premium: Number,
        special: String
    },
    claimedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries
userLevelClaimSchema.index({ userJid: 1, level: 1, rewardType: 1 }, { unique: true });

const LevelReward = mongoose.model('LevelReward', levelRewardSchema);
const TierMilestone = mongoose.model('TierMilestone', tierMilestoneSchema);
const UserLevelClaim = mongoose.model('UserLevelClaim', userLevelClaimSchema);

// Initialize default rewards
async function initializeDefaultLevelRewards() {
    try {
        const count = await LevelReward.countDocuments();
        if (count === 0) {
            console.log('🎁 Initializing default level rewards...');
            
            // Create default level rewards
            const defaultRewards = [];
            for (let level = 1; level <= 200; level++) {
                const tier = getTierForLevel(level);
                const reward = {
                    level,
                    tier,
                    rewards: generateLevelReward(level, tier),
                    isActive: true
                };
                defaultRewards.push(reward);
            }
            
            await LevelReward.insertMany(defaultRewards);
            console.log('✅ Default level rewards initialized');
        }
        
        // Initialize tier milestones
        const tierCount = await TierMilestone.countDocuments();
        if (tierCount === 0) {
            console.log('🏆 Initializing tier milestone rewards...');
            
            const tierRewards = [
                { tier: 'warrior', rewards: { balance: 500, chips: 50, premium: 0, special: null } },
                { tier: 'elite', rewards: { balance: 1000, chips: 100, premium: 1, special: 'Elite Badge' } },
                { tier: 'master', rewards: { balance: 2000, chips: 200, premium: 2, special: 'Master Title' } },
                { tier: 'grandmaster', rewards: { balance: 3000, chips: 300, premium: 3, special: 'Grandmaster Crown' } },
                { tier: 'epic', rewards: { balance: 5000, chips: 500, premium: 5, special: 'Epic Aura' } },
                { tier: 'legend', rewards: { balance: 7500, chips: 750, premium: 7, special: 'Legend Status' } },
                { tier: 'mythic', rewards: { balance: 10000, chips: 1000, premium: 10, special: 'Mythic Power' } },
                { tier: 'honor', rewards: { balance: 15000, chips: 1500, premium: 15, special: 'Honor Medal' } },
                { tier: 'immortal', rewards: { balance: 25000, chips: 2500, premium: 30, special: 'Immortal Essence' } }
            ];
            
            await TierMilestone.insertMany(tierRewards);
            console.log('✅ Tier milestone rewards initialized');
        }
        
    } catch (error) {
        console.error('Error initializing level rewards:', error);
    }
}

// Generate level reward based on level and tier
function generateLevelReward(level, tier) {
    const baseReward = {
        balance: level * 10,
        chips: level * 2,
        premium: 0,
        special: null
    };
    
    // Add tier bonus
    const tierMultiplier = getTierMultiplier(tier);
    baseReward.balance *= tierMultiplier;
    baseReward.chips *= tierMultiplier;
    
    // Special rewards for milestone levels
    if (level % 10 === 0) {
        baseReward.premium = Math.floor(level / 10);
        baseReward.special = `Level ${level} Milestone`;
    }
    
    return baseReward;
}

// Get tier multiplier for rewards
function getTierMultiplier(tier) {
    const multipliers = {
        warrior: 1,
        elite: 1.2,
        master: 1.5,
        grandmaster: 2,
        epic: 2.5,
        legend: 3,
        mythic: 4,
        honor: 5,
        immortal: 7
    };
    return multipliers[tier] || 1;
}

// Get tier for level
function getTierForLevel(level) {
    if (level >= 151) return 'immortal';
    if (level >= 126) return 'honor';
    if (level >= 101) return 'mythic';
    if (level >= 76) return 'legend';
    if (level >= 56) return 'epic';
    if (level >= 41) return 'grandmaster';
    if (level >= 26) return 'master';
    if (level >= 11) return 'elite';
    return 'warrior';
}

// Get available rewards for user
async function getAvailableRewards(userJid, currentLevel, currentTier) {
    try {
        // Get claimed rewards
        const claimedRewards = await UserLevelClaim.find({ userJid });
        const claimedLevels = claimedRewards.filter(r => r.rewardType === 'level').map(r => r.level);
        const claimedTiers = claimedRewards.filter(r => r.rewardType === 'tier').map(r => r.tier);
        
        // Get available level rewards
        const availableLevelRewards = await LevelReward.find({
            level: { $lte: currentLevel },
            level: { $nin: claimedLevels },
            isActive: true
        }).sort({ level: 1 });
        
        // Get available tier rewards
        const availableTierRewards = await TierMilestone.find({
            tier: { $nin: claimedTiers },
            isActive: true
        });
        
        // Filter tier rewards based on user's progression
        const tierOrder = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend', 'mythic', 'honor', 'immortal'];
        const currentTierIndex = tierOrder.indexOf(currentTier);
        const availableTiers = availableTierRewards.filter(reward => {
            const rewardTierIndex = tierOrder.indexOf(reward.tier);
            return rewardTierIndex <= currentTierIndex;
        });
        
        return {
            levelRewards: availableLevelRewards,
            tierRewards: availableTiers,
            totalAvailable: availableLevelRewards.length + availableTiers.length
        };
        
    } catch (error) {
        console.error('Error getting available rewards:', error);
        return { levelRewards: [], tierRewards: [], totalAvailable: 0 };
    }
}

// Claim reward
async function claimReward(userJid, rewardType, levelOrTier) {
    try {
        const { User } = require('./database');
        
        // Check if already claimed
        const existingClaim = await UserLevelClaim.findOne({
            userJid,
            [rewardType === 'level' ? 'level' : 'tier']: levelOrTier,
            rewardType
        });
        
        if (existingClaim) {
            return { success: false, message: 'Reward already claimed' };
        }
        
        // Get reward data
        let rewardData;
        if (rewardType === 'level') {
            rewardData = await LevelReward.findOne({ level: levelOrTier, isActive: true });
        } else {
            rewardData = await TierMilestone.findOne({ tier: levelOrTier, isActive: true });
        }
        
        if (!rewardData) {
            return { success: false, message: 'Reward not found' };
        }
        
        // Get user
        const user = await User.findOne({ jid: userJid });
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Additional validation for tier rewards
        if (rewardType === 'tier') {
            const tierOrder = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend', 'mythic', 'honor', 'immortal'];
            const currentTierIndex = tierOrder.indexOf(user.levelTier);
            const rewardTierIndex = tierOrder.indexOf(levelOrTier);
            
            if (rewardTierIndex > currentTierIndex) {
                return { success: false, message: `You haven't reached ${levelOrTier} tier yet! Current tier: ${user.levelTier}` };
            }
        }
        
        // Additional validation for level rewards
        if (rewardType === 'level') {
            if (levelOrTier > user.level) {
                return { success: false, message: `You haven't reached level ${levelOrTier} yet! Current level: ${user.level}` };
            }
        }
        
        // Apply rewards
        const rewards = rewardData.rewards;
        user.balance += rewards.balance || 0;
        user.chips += rewards.chips || 0;
        
        // Apply premium if any
        if (rewards.premium > 0) {
            const premiumDays = rewards.premium;
            const now = new Date();
            const existingPremium = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
            user.premiumUntil = new Date(existingPremium.getTime() + (premiumDays * 24 * 60 * 60 * 1000));
            user.status = 'premium';
        }
        
        await user.save();
        
        // Record claim
        await UserLevelClaim.create({
            userJid,
            level: rewardType === 'level' ? levelOrTier : user.level,
            tier: rewardType === 'tier' ? levelOrTier : user.levelTier,
            rewardType,
            rewardsClaimed: rewards
        });
        
        return {
            success: true,
            rewards,
            message: `${rewardType === 'level' ? 'Level' : 'Tier'} reward claimed successfully!`
        };
        
    } catch (error) {
        console.error('Error claiming reward:', error);
        return { success: false, message: 'Error claiming reward' };
    }
}

module.exports = {
    LevelReward,
    TierMilestone,
    UserLevelClaim,
    initializeDefaultLevelRewards,
    getAvailableRewards,
    claimReward
};