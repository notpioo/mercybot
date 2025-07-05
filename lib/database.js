const mongoose = require('mongoose');
const config = require('../config/config');

// User Schema
const userSchema = new mongoose.Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    username: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['owner', 'premium', 'basic'],
        default: 'basic'
    },
    isOwner: {
        type: Boolean,
        default: false
    },
    limit: {
        type: mongoose.Schema.Types.Mixed,
        default: 30
    },
    balance: {
        type: Number,
        default: 0
    },
    chips: {
        type: Number,
        default: 0
    },
    commandCount: {
        type: Number,
        default: 0
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    warnings: {
        type: Number,
        default: 0
    },
    banUntil: {
        type: Date,
        default: null
    },
    premiumUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Group Schema
const groupSchema = new mongoose.Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    desc: String,
    participants: [{
        jid: String,
        admin: {
            type: String,
            enum: ['admin', 'superadmin', 'member'],
            default: 'member'
        }
    }],
    settings: {
        antilink: {
            type: Boolean,
            default: false
        },
        welcome: {
            type: Boolean,
            default: false
        },
        mute: {
            type: Boolean,
            default: false
        },
        antiBadword: {
            type: Boolean,
            default: false
        },
        badWords: [{
            type: String,
            lowercase: true
        }]
    },
    messageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Command Usage Schema
const commandUsageSchema = new mongoose.Schema({
    command: String,
    user: String,
    group: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create models
const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const CommandUsage = mongoose.model('CommandUsage', commandUsageSchema);

async function connectDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        
        console.log('✅ MongoDB connected successfully!');
        console.log('📊 Database:', mongoose.connection.name);
        
        // Create owner user if doesn't exist
        await createOwnerUser();
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
}

async function createOwnerUser() {
    try {
        for (const ownerNumber of config.owners) {
            const cleanNumber = ownerNumber.replace('+', '');
            const ownerJid = cleanNumber + '@s.whatsapp.net';
            
            const existingOwner = await User.findOne({ jid: ownerJid });
            
            if (!existingOwner) {
                const owner = new User({
                    jid: ownerJid,
                    name: 'Owner',
                    isOwner: true,
                    status: 'owner',
                    limit: 'unlimited',
                    balance: config.userSystem.defaultBalance,
                    chips: config.userSystem.defaultChips
                });
                
                await owner.save();
                console.log(`👤 Owner user created: ${ownerNumber}`);
            } else {
                console.log(`👤 Owner user already exists: ${ownerNumber}`);
            }
        }
    } catch (error) {
        if (error.code === 11000) {
            console.log('👤 Owner user already exists in database');
        } else {
            console.error('❌ Failed to create owner user:', error);
        }
    }
}

async function getUser(jid) {
    try {
        let user = await User.findOne({ jid });
        
        if (!user) {
            const isOwnerUser = config.owners.some(owner => jid === owner.replace('+', '') + '@s.whatsapp.net');
            
            user = new User({
                jid,
                name: 'Unknown',
                isOwner: isOwnerUser,
                status: isOwnerUser ? 'owner' : config.userSystem.defaultStatus,
                limit: isOwnerUser ? 'unlimited' : config.userSystem.defaultLimit,
                balance: config.userSystem.defaultBalance,
                chips: config.userSystem.defaultChips
            });
            await user.save();
        }
        
        return user;
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error - try to find existing user
            try {
                const existingUser = await User.findOne({ jid });
                if (existingUser) {
                    return existingUser;
                }
            } catch (findError) {
                console.error('❌ Failed to find existing user:', findError);
            }
        }
        console.error('❌ Failed to get user:', error.message);
        return null;
    }
}

async function getGroup(jid) {
    try {
        let group = await Group.findOne({ jid });
        
        if (!group) {
            group = new Group({
                jid,
                name: 'Unknown Group'
            });
            await group.save();
        }
        
        return group;
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error - try to find existing group
            try {
                const existingGroup = await Group.findOne({ jid });
                if (existingGroup) {
                    return existingGroup;
                }
            } catch (findError) {
                console.error('❌ Failed to find existing group:', findError);
            }
        }
        console.error('❌ Failed to get group:', error.message);
        return null;
    }
}

async function logCommandUsage(command, userJid, groupJid = null) {
    try {
        const usage = new CommandUsage({
            command,
            user: userJid,
            group: groupJid
        });
        
        await usage.save();
        
        // Update user command count
        await User.updateOne(
            { jid: userJid },
            { 
                $inc: { commandCount: 1 },
                $set: { lastSeen: new Date() }
            }
        );
        
        // Update group message count if in group
        if (groupJid) {
            await Group.updateOne(
                { jid: groupJid },
                { $inc: { messageCount: 1 } }
            );
        }
        
    } catch (error) {
        console.error('❌ Failed to log command usage:', error);
    }
}

async function updateUserInfo(jid, name) {
    try {
        await User.updateOne(
            { jid },
            { 
                $set: { 
                    name,
                    lastSeen: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('❌ Failed to update user info:', error);
    }
}

async function updateGroupInfo(jid, name, desc, participants) {
    try {
        // Transform participants data to match our schema
        const transformedParticipants = participants.map(p => ({
            jid: p.id,
            admin: p.admin === 'superadmin' ? 'superadmin' : 
                   p.admin === 'admin' ? 'admin' : 'member'
        }));
        
        await Group.updateOne(
            { jid },
            {
                $set: {
                    name,
                    desc,
                    participants: transformedParticipants
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('❌ Failed to update group info:', error.message);
    }
}

module.exports = {
    connectDatabase,
    getUser,
    getGroup,
    logCommandUsage,
    updateUserInfo,
    updateGroupInfo,
    User,
    Group,
    CommandUsage
};
