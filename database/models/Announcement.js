const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 255
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        maxlength: 100
    },
    icon: {
        type: String,
        default: '📢',
        maxlength: 50
    },
    category: {
        type: String,
        default: 'pengumuman',
        enum: ['pengumuman', 'event', 'update', 'maintenance']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Index for better query performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);