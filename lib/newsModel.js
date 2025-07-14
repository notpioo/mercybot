
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
    category: {
        type: String,
        required: true,
        enum: ['hot', 'announcement', 'event', 'update'],
        default: 'announcement'
    },
    priority: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
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

newsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const News = mongoose.model('News', newsSchema);

module.exports = { News };
