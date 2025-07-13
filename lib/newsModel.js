const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String,
        required: true
    }
});

// Update the updatedAt field on save
newsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const News = mongoose.model('News', newsSchema);

// News management functions
async function createNews(newsData) {
    try {
        const news = new News(newsData);
        await news.save();
        return { success: true, news };
    } catch (error) {
        console.error('Error creating news:', error);
        return { success: false, error: error.message };
    }
}

async function getAllNews(includeInactive = false) {
    try {
        const filter = includeInactive ? {} : { status: 'active' };
        const news = await News.find(filter).sort({ createdAt: -1 });
        return { success: true, news };
    } catch (error) {
        console.error('Error fetching news:', error);
        return { success: false, error: error.message };
    }
}

async function getActiveNews() {
    try {
        const news = await News.find({ status: 'active' }).sort({ createdAt: -1 });
        return { success: true, news };
    } catch (error) {
        console.error('Error fetching active news:', error);
        return { success: false, error: error.message };
    }
}

async function getNewsById(newsId) {
    try {
        const news = await News.findById(newsId);
        if (!news) {
            return { success: false, error: 'News not found' };
        }
        return { success: true, news };
    } catch (error) {
        console.error('Error fetching news by ID:', error);
        return { success: false, error: error.message };
    }
}

async function updateNews(newsId, updateData) {
    try {
        const news = await News.findByIdAndUpdate(
            newsId,
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        );
        if (!news) {
            return { success: false, error: 'News not found' };
        }
        return { success: true, news };
    } catch (error) {
        console.error('Error updating news:', error);
        return { success: false, error: error.message };
    }
}

async function deleteNews(newsId) {
    try {
        const news = await News.findByIdAndDelete(newsId);
        if (!news) {
            return { success: false, error: 'News not found' };
        }
        return { success: true, message: 'News deleted successfully' };
    } catch (error) {
        console.error('Error deleting news:', error);
        return { success: false, error: error.message };
    }
}

async function toggleNewsStatus(newsId) {
    try {
        const news = await News.findById(newsId);
        if (!news) {
            return { success: false, error: 'News not found' };
        }
        
        news.status = news.status === 'active' ? 'inactive' : 'active';
        news.updatedAt = Date.now();
        await news.save();
        
        return { success: true, news };
    } catch (error) {
        console.error('Error toggling news status:', error);
        return { success: false, error: error.message };
    }
}

async function deleteAllNews() {
    try {
        const result = await News.deleteMany({});
        return { 
            success: true, 
            message: `${result.deletedCount} news items deleted successfully`,
            deletedCount: result.deletedCount
        };
    } catch (error) {
        console.error('Error deleting all news:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    News,
    createNews,
    getAllNews,
    getActiveNews,
    getNewsById,
    updateNews,
    deleteNews,
    deleteAllNews,
    toggleNewsStatus
};