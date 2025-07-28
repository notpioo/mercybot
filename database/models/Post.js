
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    // User Information
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    author: {
        type: String,
        required: true
    },
    
    // Post Content
    type: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },
    
    content: {
        type: String,
        required: true
    },
    
    mediaUrl: {
        type: String,
        default: ''
    },
    
    // Engagement
    likes: [{
        userId: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    comments: [{
        userId: String,
        author: String,
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

// Methods
postSchema.methods.getLikesCount = function() {
    return this.likes.length;
};

postSchema.methods.getCommentsCount = function() {
    return this.comments.length;
};

postSchema.methods.isLikedBy = function(userId) {
    return this.likes.some(like => like.userId === userId);
};

postSchema.methods.addLike = function(userId) {
    if (!this.isLikedBy(userId)) {
        this.likes.push({ userId });
        return true;
    }
    return false;
};

postSchema.methods.removeLike = function(userId) {
    const initialLength = this.likes.length;
    this.likes = this.likes.filter(like => like.userId !== userId);
    return this.likes.length < initialLength;
};

postSchema.methods.addComment = function(userId, author, content) {
    this.comments.push({ userId, author, content });
};

// Static methods
postSchema.statics.getRecentPosts = function(limit = 20) {
    return this.find()
        .sort({ createdAt: -1 })
        .limit(limit);
};

postSchema.statics.getPostsByUser = function(userId, limit = 20) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

module.exports = mongoose.model('Post', postSchema);
