
const Post = require('./models/Post');
const connectDB = require('./connection');

// Initialize posts collection
const initPostsTable = async () => {
    try {
        await connectDB();
        console.log('✅ Posts system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize posts system:', error);
        throw error;
    }
};

// Get recent posts for social feed
const getRecentPosts = async (limit = 20) => {
    try {
        const posts = await Post.getRecentPosts(limit);
        return posts;
    } catch (error) {
        console.error('❌ Error fetching recent posts:', error);
        return [];
    }
};

// Get posts by specific user
const getPostsByUser = async (userId, limit = 20) => {
    try {
        const posts = await Post.getPostsByUser(userId, limit);
        return posts;
    } catch (error) {
        console.error('❌ Error fetching user posts:', error);
        return [];
    }
};

// Create new post
const createPost = async (userId, author, type, content, mediaUrl = '') => {
    try {
        const newPost = new Post({
            userId,
            author,
            type,
            content,
            mediaUrl
        });
        
        await newPost.save();
        console.log('✅ Post created successfully');
        return newPost;
    } catch (error) {
        console.error('❌ Error creating post:', error);
        throw error;
    }
};

// Update post
const updatePost = async (postId, updates) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            postId, 
            updates, 
            { new: true }
        );
        
        if (!updatedPost) {
            console.log('⚠️ Post not found for update');
            return null;
        }
        
        console.log('✅ Post updated successfully');
        return updatedPost;
    } catch (error) {
        console.error('❌ Error updating post:', error);
        throw error;
    }
};

// Delete post
const deletePost = async (postId) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(postId);
        
        if (!deletedPost) {
            console.log('⚠️ Post not found for deletion');
            return false;
        }
        
        console.log('✅ Post deleted successfully');
        return true;
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        throw error;
    }
};

// Like post
const likePost = async (postId, userId) => {
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, message: 'Post not found' };
        }
        
        const liked = post.addLike(userId);
        if (liked) {
            await post.save();
            return { success: true, message: 'Post liked', likesCount: post.getLikesCount() };
        } else {
            return { success: false, message: 'Already liked' };
        }
    } catch (error) {
        console.error('❌ Error liking post:', error);
        throw error;
    }
};

// Unlike post
const unlikePost = async (postId, userId) => {
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, message: 'Post not found' };
        }
        
        const unliked = post.removeLike(userId);
        if (unliked) {
            await post.save();
            return { success: true, message: 'Post unliked', likesCount: post.getLikesCount() };
        } else {
            return { success: false, message: 'Not liked yet' };
        }
    } catch (error) {
        console.error('❌ Error unliking post:', error);
        throw error;
    }
};

// Add comment to post
const addComment = async (postId, userId, author, content) => {
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, message: 'Post not found' };
        }
        
        post.addComment(userId, author, content);
        await post.save();
        
        return { 
            success: true, 
            message: 'Comment added', 
            commentsCount: post.getCommentsCount() 
        };
    } catch (error) {
        console.error('❌ Error adding comment:', error);
        throw error;
    }
};

module.exports = {
    initPostsTable,
    getRecentPosts,
    getPostsByUser,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment
};
