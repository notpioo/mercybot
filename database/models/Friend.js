const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    requesterUserId: {
        type: String,
        required: true,
        index: true
    },
    requesterUsername: {
        type: String,
        required: true
    },
    recipientUserId: {
        type: String,
        required: true,
        index: true
    },
    recipientUsername: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'blocked'],
        default: 'pending',
        index: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
friendSchema.index({ requesterUserId: 1, recipientUserId: 1 }, { unique: true });
friendSchema.index({ recipientUserId: 1, status: 1 });
friendSchema.index({ requesterUserId: 1, status: 1 });

// Static methods
friendSchema.statics.sendFriendRequest = async function(requesterUserId, requesterUsername, recipientUserId, recipientUsername) {
    // Check if friendship already exists
    const existingRequest = await this.findOne({
        $or: [
            { requesterUserId, recipientUserId },
            { requesterUserId: recipientUserId, recipientUserId: requesterUserId }
        ]
    });

    if (existingRequest) {
        if (existingRequest.status === 'accepted') {
            throw new Error('Already friends');
        } else if (existingRequest.status === 'pending') {
            throw new Error('Friend request already sent');
        } else if (existingRequest.status === 'blocked') {
            throw new Error('Cannot send friend request');
        }
    }

    // Create new friend request
    const friendRequest = new this({
        requesterUserId,
        requesterUsername,
        recipientUserId,
        recipientUsername,
        status: 'pending'
    });

    return await friendRequest.save();
};

friendSchema.statics.acceptFriendRequest = async function(requestId, recipientUserId) {
    const request = await this.findOne({
        _id: requestId,
        recipientUserId,
        status: 'pending'
    });

    if (!request) {
        throw new Error('Friend request not found');
    }

    request.status = 'accepted';
    request.respondedAt = new Date();
    return await request.save();
};

friendSchema.statics.declineFriendRequest = async function(requestId, recipientUserId) {
    const request = await this.findOne({
        _id: requestId,
        recipientUserId,
        status: 'pending'
    });

    if (!request) {
        throw new Error('Friend request not found');
    }

    request.status = 'declined';
    request.respondedAt = new Date();
    return await request.save();
};

friendSchema.statics.getFriends = async function(userId) {
    return await this.find({
        $or: [
            { requesterUserId: userId, status: 'accepted' },
            { recipientUserId: userId, status: 'accepted' }
        ]
    }).sort({ respondedAt: -1 });
};

friendSchema.statics.getPendingRequests = async function(userId) {
    return await this.find({
        recipientUserId: userId,
        status: 'pending'
    }).sort({ requestedAt: -1 });
};

friendSchema.statics.getSentRequests = async function(userId) {
    return await this.find({
        requesterUserId: userId,
        status: 'pending'
    }).sort({ requestedAt: -1 });
};

friendSchema.statics.getFriendshipStatus = async function(userId1, userId2) {
    return await this.findOne({
        $or: [
            { requesterUserId: userId1, recipientUserId: userId2 },
            { requesterUserId: userId2, recipientUserId: userId1 }
        ]
    });
};

module.exports = mongoose.model('Friend', friendSchema);