const mongoose = require('mongoose');
const config = require('../../config/config');

const userSchema = new mongoose.Schema({
    // WhatsApp User ID
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // User Information
    username: {
        type: String,
        default: 'User'
    },
    
    phoneNumber: {
        type: String,
        default: ''
    },
    
    profilePhoto: {
        type: String,
        default: null
    },
    
    // User Status and Permissions
    status: {
        type: String,
        enum: ['owner', 'premium', 'basic'],
        default: config.defaultSettings.status
    },
    
    // User Resources
    limit: {
        type: Number,
        default: config.defaultSettings.limit,
        min: 0
    },
    
    totalLimit: {
        type: Number,
        default: config.defaultSettings.limit
    },
    
    balance: {
        type: Number,
        default: config.defaultSettings.balance,
        min: 0
    },
    
    chips: {
        type: Number,
        default: config.defaultSettings.chips,
        min: 0
    },
    
    // Activity Tracking
    lastActive: {
        type: Date,
        default: Date.now
    },
    
    commandsUsed: {
        type: Number,
        default: 0
    },
    
    // Level System
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    
    totalXp: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Profile customization
    profilePicture: {
        type: String,
        default: null
    },
    
    // Timestamps
    memberSince: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance (userId already has unique index from schema definition)
userSchema.index({ status: 1 });
userSchema.index({ lastActive: -1 });

// Methods
userSchema.methods.deductLimit = function(amount = 1) {
    // Owner and premium users have unlimited limits
    if (this.status === 'owner' || this.status === 'premium') {
        return true;
    }
    
    if (this.limit >= amount) {
        this.limit -= amount;
        return true;
    }
    return false;
};

userSchema.methods.hasUnlimitedLimits = function() {
    return this.status === 'owner' || this.status === 'premium';
};

userSchema.methods.addLimit = function(amount = 1) {
    this.limit += amount;
    if (this.limit > this.totalLimit) {
        this.limit = this.totalLimit;
    }
};

userSchema.methods.updateActivity = function() {
    this.lastActive = new Date();
    this.commandsUsed += 1;
};

userSchema.methods.isOwner = function() {
    return this.status === 'owner';
};

userSchema.methods.isAdmin = function() {
    return this.status === 'admin' || this.status === 'owner';
};

userSchema.methods.getFormattedMemberSince = function() {
    return this.memberSince.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Level System Methods
userSchema.methods.addXp = function(amount) {
    this.xp += amount;
    this.totalXp += amount;
    
    // Check for level up
    const xpRequired = config.levelSystem.xpPerLevel(this.level);
    if (this.xp >= xpRequired) {
        this.levelUp();
    }
};

userSchema.methods.levelUp = function() {
    const xpRequired = config.levelSystem.xpPerLevel(this.level);
    this.xp -= xpRequired;
    this.level += 1;
    
    // Check if enough XP for multiple level ups
    const nextXpRequired = config.levelSystem.xpPerLevel(this.level);
    if (this.xp >= nextXpRequired) {
        this.levelUp(); // Recursive level up
    }
};

userSchema.methods.getCurrentRank = function() {
    const ranks = config.levelSystem.ranks;
    for (const rank of ranks) {
        if (this.level >= rank.minLevel && this.level <= rank.maxLevel) {
            return rank;
        }
    }
    return ranks[ranks.length - 1]; // Return highest rank if level exceeds all
};

userSchema.methods.getXpProgress = function() {
    const currentLevelXp = config.levelSystem.xpPerLevel(this.level);
    const progressPercentage = Math.floor((this.xp / currentLevelXp) * 100);
    return {
        current: this.xp,
        required: currentLevelXp,
        percentage: Math.min(progressPercentage, 100)
    };
};

userSchema.methods.getNextRank = function() {
    const currentRank = this.getCurrentRank();
    const ranks = config.levelSystem.ranks;
    const currentRankIndex = ranks.findIndex(rank => rank.name === currentRank.name);
    
    if (currentRankIndex < ranks.length - 1) {
        return ranks[currentRankIndex + 1];
    }
    return null; // Already at highest rank
};

// Static methods
userSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId });
};

userSchema.statics.createNewUser = async function(userId, additionalData = {}) {
    const userData = {
        userId,
        ...additionalData
    };
    
    const user = new this(userData);
    return await user.save();
};

module.exports = mongoose.model('User', userSchema);
