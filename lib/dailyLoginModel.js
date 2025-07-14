
const mongoose = require('mongoose');

// Daily Login Config Schema (untuk owner mengatur rewards)
const dailyLoginConfigSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true,
        min: 1,
        max: 7,
        unique: true
    },
    rewardType: {
        type: String,
        enum: ['balance', 'chips', 'premium'],
        required: true
    },
    rewardAmount: {
        type: Number,
        required: true
    },
    premiumDuration: {
        type: Number, // dalam hari
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// User Daily Login Schema
const userDailyLoginSchema = new mongoose.Schema({
    userJid: {
        type: String,
        required: true,
        unique: true
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    lastLoginDate: {
        type: String, // format YYYY-MM-DD (Jakarta time)
        default: null
    },
    currentDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 7
    },
    totalLogins: {
        type: Number,
        default: 0
    },
    canClaim: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const DailyLoginConfig = mongoose.model('DailyLoginConfig', dailyLoginConfigSchema);
const UserDailyLogin = mongoose.model('UserDailyLogin', userDailyLoginSchema);

// Initialize default daily login rewards
async function initializeDefaultRewards() {
    try {
        const existingRewards = await DailyLoginConfig.countDocuments();
        
        if (existingRewards === 0) {
            const defaultRewards = [
                { day: 1, rewardType: 'balance', rewardAmount: 500 },
                { day: 2, rewardType: 'chips', rewardAmount: 100 },
                { day: 3, rewardType: 'balance', rewardAmount: 750 },
                { day: 4, rewardType: 'chips', rewardAmount: 200 },
                { day: 5, rewardType: 'balance', rewardAmount: 1000 },
                { day: 6, rewardType: 'chips', rewardAmount: 300 },
                { day: 7, rewardType: 'premium', rewardAmount: 1, premiumDuration: 1 }
            ];
            
            await DailyLoginConfig.insertMany(defaultRewards);
            console.log('✅ Default daily login rewards initialized');
        }
    } catch (error) {
        console.error('❌ Failed to initialize daily login rewards:', error);
    }
}

// Get Jakarta time in YYYY-MM-DD format
function getJakartaDate() {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    return jakartaTime.toISOString().split('T')[0];
}

// Check if user can claim daily login
async function canUserClaim(userJid) {
    try {
        const userLogin = await UserDailyLogin.findOne({ userJid });
        const today = getJakartaDate();
        
        if (!userLogin) {
            return { canClaim: true, isNewUser: true };
        }
        
        // Check if user already claimed today
        if (userLogin.lastLoginDate === today) {
            return { canClaim: false, reason: 'already_claimed_today' };
        }
        
        // Check if streak should reset
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (userLogin.lastLoginDate < yesterdayStr) {
            // Streak broken, reset
            return { canClaim: true, streakReset: true };
        }
        
        return { canClaim: true, streakReset: false };
    } catch (error) {
        console.error('❌ Error checking claim status:', error);
        return { canClaim: false, reason: 'error' };
    }
}

// Process daily login claim
async function processDailyLoginClaim(userJid) {
    try {
        const { User } = require('./database');
        const claimStatus = await canUserClaim(userJid);
        
        if (!claimStatus.canClaim) {
            return { success: false, reason: claimStatus.reason };
        }
        
        const today = getJakartaDate();
        let userLogin = await UserDailyLogin.findOne({ userJid });
        
        // Save current day for reward calculation BEFORE updating
        let currentClaimDay;
        
        if (!userLogin || claimStatus.isNewUser || claimStatus.streakReset) {
            // Create new or reset - mereka claim Day 1
            currentClaimDay = 1;
            
            if (userLogin && claimStatus.streakReset) {
                userLogin.currentStreak = 1;
                userLogin.currentDay = 1; // Start from day 1
                userLogin.lastLoginDate = today;
                userLogin.totalLogins += 1;
                userLogin.canClaim = false;
                await userLogin.save();
            } else {
                userLogin = new UserDailyLogin({
                    userJid,
                    currentStreak: 1,
                    currentDay: 1, // Start from day 1
                    lastLoginDate: today,
                    totalLogins: 1,
                    canClaim: false
                });
                await userLogin.save();
            }
        } else {
            // Continue streak - mereka claim day saat ini, lalu increment untuk next time
            currentClaimDay = userLogin.currentDay;
            
            userLogin.currentStreak += 1;
            userLogin.currentDay = userLogin.currentDay >= 7 ? 1 : userLogin.currentDay + 1;
            userLogin.lastLoginDate = today;
            userLogin.totalLogins += 1;
            userLogin.canClaim = false;
            await userLogin.save();
        }
        
        // Get reward for the day they are claiming (currentClaimDay)
        const reward = await DailyLoginConfig.findOne({ 
            day: currentClaimDay,
            isActive: true 
        });
        
        if (!reward) {
            return { success: false, reason: 'no_reward_configured' };
        }
        
        // Apply reward to user
        const user = await User.findOne({ jid: userJid });
        if (!user) {
            return { success: false, reason: 'user_not_found' };
        }
        
        let rewardMessage = '';
        
        if (reward.rewardType === 'balance') {
            user.balance += reward.rewardAmount;
            rewardMessage = `💰 ${reward.rewardAmount} Balance`;
        } else if (reward.rewardType === 'chips') {
            user.chips += reward.rewardAmount;
            rewardMessage = `🎰 ${reward.rewardAmount} Chips`;
        } else if (reward.rewardType === 'premium') {
            const premiumDays = reward.premiumDuration || 1;
            const premiumUntil = new Date();
            premiumUntil.setDate(premiumUntil.getDate() + premiumDays);
            
            if (user.status !== 'premium' || !user.premiumUntil || new Date() > user.premiumUntil) {
                user.status = 'premium';
                user.premiumUntil = premiumUntil;
                user.limit = 'unlimited';
            } else {
                // Extend existing premium
                user.premiumUntil.setDate(user.premiumUntil.getDate() + premiumDays);
            }
            
            rewardMessage = `⭐ Premium ${premiumDays} hari`;
        }
        
        await user.save();
        
        return {
            success: true,
            streak: userLogin.currentStreak,
            day: currentClaimDay, // Show the day they just claimed
            nextDay: userLogin.currentDay, // Show the next day they will claim
            reward: rewardMessage,
            totalLogins: userLogin.totalLogins
        };
        
    } catch (error) {
        console.error('❌ Error processing daily login claim:', error);
        return { success: false, reason: 'error' };
    }
}

// Get user daily login status
async function getUserDailyLoginStatus(userJid) {
    try {
        const userLogin = await UserDailyLogin.findOne({ userJid });
        const claimStatus = await canUserClaim(userJid);
        const rewards = await DailyLoginConfig.find({ isActive: true }).sort({ day: 1 });
        
        if (!userLogin) {
            return {
                canClaim: true,
                currentStreak: 0,
                currentDay: 1,
                nextReward: rewards[0],
                rewards: rewards
            };
        }
        
        // For display, show next day's reward if they can claim, or current day if they cannot
        let displayDay = userLogin.currentDay;
        if (!claimStatus.canClaim && claimStatus.reason === 'already_claimed_today') {
            displayDay = userLogin.currentDay >= 7 ? 1 : userLogin.currentDay + 1;
        }
        const nextReward = rewards.find(r => r.day === displayDay);
        
        return {
            canClaim: claimStatus.canClaim,
            currentStreak: userLogin.currentStreak,
            currentDay: userLogin.currentDay,
            totalLogins: userLogin.totalLogins,
            lastLoginDate: userLogin.lastLoginDate,
            nextReward: nextReward,
            rewards: rewards,
            reason: claimStatus.reason
        };
        
    } catch (error) {
        console.error('❌ Error getting daily login status:', error);
        return null;
    }
}

// Reset user daily login (for admin use)
async function resetUserDailyLogin(userJid) {
    try {
        const userLogin = await UserDailyLogin.findOne({ userJid });
        
        if (!userLogin) {
            return { success: false, reason: 'user_not_found' };
        }
        
        // Reset user daily login data
        userLogin.currentStreak = 0;
        userLogin.currentDay = 1;
        userLogin.lastLoginDate = null;
        userLogin.canClaim = true;
        await userLogin.save();
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error resetting user daily login:', error);
        return { success: false, reason: 'error' };
    }
}

module.exports = {
    DailyLoginConfig,
    UserDailyLogin,
    initializeDefaultRewards,
    canUserClaim,
    processDailyLoginClaim,
    getUserDailyLoginStatus,
    resetUserDailyLogin,
    getJakartaDate
};
