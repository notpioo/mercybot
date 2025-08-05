const Friend = require('./models/Friend');
const { getUser } = require('../utils/userUtils');
const connectDB = require('./connection');

// Initialize friends system
const initFriendsTable = async () => {
    try {
        await connectDB();
        console.log('👥 Friends system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize friends system:', error);
        throw error;
    }
};

// Send friend request
const sendFriendRequest = async (requesterUserId, recipientUserId) => {
    try {
        // Get user details
        const requester = await getUser(requesterUserId);
        const recipient = await getUser(recipientUserId);

        if (!requester || !recipient) {
            throw new Error('User not found');
        }

        if (requesterUserId === recipientUserId) {
            throw new Error('Cannot send friend request to yourself');
        }

        const friendRequest = await Friend.sendFriendRequest(
            requesterUserId,
            requester.username,
            recipientUserId,
            recipient.username
        );

        console.log(`👥 Friend request sent from ${requester.username} to ${recipient.username}`);
        return friendRequest;
    } catch (error) {
        console.error('❌ Error sending friend request:', error);
        throw error;
    }
};

// Accept friend request
const acceptFriendRequest = async (requestId, recipientUserId) => {
    try {
        const acceptedRequest = await Friend.acceptFriendRequest(requestId, recipientUserId);
        console.log(`✅ Friend request accepted: ${acceptedRequest._id}`);
        return acceptedRequest;
    } catch (error) {
        console.error('❌ Error accepting friend request:', error);
        throw error;
    }
};

// Decline friend request
const declineFriendRequest = async (requestId, recipientUserId) => {
    try {
        const declinedRequest = await Friend.declineFriendRequest(requestId, recipientUserId);
        console.log(`❌ Friend request declined: ${declinedRequest._id}`);
        return declinedRequest;
    } catch (error) {
        console.error('❌ Error declining friend request:', error);
        throw error;
    }
};

// Get user's friends list
const getUserFriends = async (userId) => {
    try {
        const friends = await Friend.getFriends(userId);
        return friends.map(friend => {
            // Return the friend's info (not the current user)
            if (friend.requesterUserId === userId) {
                return {
                    userId: friend.recipientUserId,
                    username: friend.recipientUsername,
                    friendshipId: friend._id,
                    friendsSince: friend.respondedAt
                };
            } else {
                return {
                    userId: friend.requesterUserId,
                    username: friend.requesterUsername,
                    friendshipId: friend._id,
                    friendsSince: friend.respondedAt
                };
            }
        });
    } catch (error) {
        console.error('❌ Error getting user friends:', error);
        return [];
    }
};

// Get pending friend requests (received)
const getPendingRequests = async (userId) => {
    try {
        const requests = await Friend.getPendingRequests(userId);
        return requests;
    } catch (error) {
        console.error('❌ Error getting pending requests:', error);
        return [];
    }
};

// Get sent friend requests
const getSentRequests = async (userId) => {
    try {
        const requests = await Friend.getSentRequests(userId);
        return requests;
    } catch (error) {
        console.error('❌ Error getting sent requests:', error);
        return [];
    }
};

// Get friendship status between two users
const getFriendshipStatus = async (userId1, userId2) => {
    try {
        const friendship = await Friend.getFriendshipStatus(userId1, userId2);
        return friendship;
    } catch (error) {
        console.error('❌ Error getting friendship status:', error);
        return null;
    }
};

// Search users by username (for friend search)
const searchUsersByUsername = async (searchQuery, currentUserId, limit = 10) => {
    try {
        const User = require('./models/User');
        
        // Search users by username (case insensitive)
        const users = await User.find({
            username: { $regex: searchQuery, $options: 'i' },
            userId: { $ne: currentUserId } // Exclude current user
        }).limit(limit).select('userId username profilePhoto');

        // Get friendship status for each user
        const usersWithFriendshipStatus = await Promise.all(
            users.map(async (user) => {
                const friendshipStatus = await getFriendshipStatus(currentUserId, user.userId);
                return {
                    userId: user.userId,
                    username: user.username,
                    profilePhoto: user.profilePhoto,
                    friendshipStatus: friendshipStatus ? friendshipStatus.status : null,
                    friendshipId: friendshipStatus ? friendshipStatus._id : null
                };
            })
        );

        return usersWithFriendshipStatus;
    } catch (error) {
        console.error('❌ Error searching users:', error);
        return [];
    }
};

// Remove friend
const removeFriend = async (friendshipId, userId) => {
    try {
        const friendship = await Friend.findOne({
            _id: friendshipId,
            $or: [
                { requesterUserId: userId },
                { recipientUserId: userId }
            ],
            status: 'accepted'
        });

        if (!friendship) {
            throw new Error('Friendship not found');
        }

        await Friend.findByIdAndDelete(friendshipId);
        console.log(`👥 Friendship removed: ${friendshipId}`);
        return true;
    } catch (error) {
        console.error('❌ Error removing friend:', error);
        throw error;
    }
};

module.exports = {
    initFriendsTable,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getUserFriends,
    getPendingRequests,
    getSentRequests,
    getFriendshipStatus,
    searchUsersByUsername,
    removeFriend
};