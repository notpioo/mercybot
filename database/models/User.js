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
