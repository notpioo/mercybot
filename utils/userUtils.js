const User = require('../database/models/User');
const config = require('../config/config');

/**
 * Get user from database
 * @param {string} userId - WhatsApp user ID
 * @returns {Object|null} User object or null
 */
const getUser = async (userId) => {
    try {
        const user = await User.findByUserId(userId);
        return user;
    } catch (error) {
        console.error('❌ Error getting user:', error.message);
        return null;
    }
};

/**
 * Create new user if doesn't exist
 * @param {string} userId - WhatsApp user ID
 * @param {Object} additionalData - Additional user data
 * @param {Object} sock - WhatsApp socket for fetching profile data
 * @returns {Object|null} User object or null
 */
const createUser = async (userId, additionalData = {}, sock = null) => {
    try {
        // Check if user already exists
        let user = await User.findByUserId(userId);
        
        if (!user) {
            // Extract phone number from userId
            const phoneNumber = userId.split('@')[0];
            
            // Try to get WhatsApp name if socket is provided
            let whatsappName = `User${phoneNumber.slice(-4)}`;
            if (sock) {
                try {
                    const contactInfo = await sock.onWhatsApp(userId);
                    if (contactInfo && contactInfo[0] && contactInfo[0].notify) {
                        whatsappName = contactInfo[0].notify;
                    }
                } catch (error) {
                    console.log('Could not fetch WhatsApp name during user creation');
                }
            }
            
            // Set special permissions for owner
            const isOwner = phoneNumber === config.ownerNumber.split('@')[0];
            const userData = {
                phoneNumber,
                username: additionalData.username || whatsappName,
                status: isOwner ? 'owner' : config.defaultSettings.status,
                ...additionalData
            };
            
            user = await User.createNewUser(userId, userData);
            console.log(`👤 New user created: ${userId} (${user.status})`);
        }
        
        return user;
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        return null;
    }
};

/**
 * Update user data
 * @param {string} userId - WhatsApp user ID
 * @param {Object} updateData - Data to update
 * @returns {Object|null} Updated user or null
 */
const updateUser = async (userId, updateData) => {
    try {
        const user = await User.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (user) {
            console.log(`📝 User updated: ${userId}`);
        }
        
        return user;
    } catch (error) {
        console.error('❌ Error updating user:', error.message);
        return null;
    }
};

/**
 * Add limit to user
 * @param {string} userId - WhatsApp user ID
 * @param {number} amount - Amount to add
 * @returns {boolean} Success status
 */
const addUserLimit = async (userId, amount = 1) => {
    try {
        const user = await User.findByUserId(userId);
        if (!user) return false;
        
        user.addLimit(amount);
        await user.save();
        
        console.log(`➕ Added ${amount} limit(s) to user: ${userId}`);
        return true;
    } catch (error) {
        console.error('❌ Error adding user limit:', error.message);
        return false;
    }
};

/**
 * Deduct limit from user
 * @param {string} userId - WhatsApp user ID
 * @param {number} amount - Amount to deduct
 * @returns {boolean} Success status
 */
const deductUserLimit = async (userId, amount = 1) => {
    try {
        const user = await User.findByUserId(userId);
        if (!user) return false;
        
        const success = user.deductLimit(amount);
        if (success) {
            await user.save();
            console.log(`➖ Deducted ${amount} limit(s) from user: ${userId}`);
        }
        
        return success;
    } catch (error) {
        console.error('❌ Error deducting user limit:', error.message);
        return false;
    }
};

/**
 * Check if user is owner
 * @param {string} userId - WhatsApp user ID
 * @returns {boolean} Is owner status
 */
const isUserOwner = async (userId) => {
    try {
        const user = await User.findByUserId(userId);
        return user ? user.isOwner() : false;
    } catch (error) {
        console.error('❌ Error checking owner status:', error.message);
        return false;
    }
};

/**
 * Check if user is admin or owner
 * @param {string} userId - WhatsApp user ID
 * @returns {boolean} Is admin status
 */
const isUserAdmin = async (userId) => {
    try {
        const user = await User.findByUserId(userId);
        return user ? user.isAdmin() : false;
    } catch (error) {
        console.error('❌ Error checking admin status:', error.message);
        return false;
    }
};

/**
 * Get user statistics
 * @returns {Object} User statistics
 */
const getUserStats = async () => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({
            lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        const ownerCount = await User.countDocuments({ status: 'owner' });
        const adminCount = await User.countDocuments({ status: 'admin' });
        const basicCount = await User.countDocuments({ status: 'basic' });
        
        return {
            totalUsers,
            activeUsers,
            ownerCount,
            adminCount,
            basicCount
        };
    } catch (error) {
        console.error('❌ Error getting user stats:', error.message);
        return null;
    }
};

module.exports = {
    getUser,
    createUser,
    updateUser,
    addUserLimit,
    deductUserLimit,
    isUserOwner,
    isUserAdmin,
    getUserStats
};
