const Announcement = require('./models/Announcement');

// Initialize announcements collection with sample data
const initAnnouncementsTable = async () => {
    try {
        console.log('✅ Announcements collection initialized successfully');
        
        // Insert sample announcements if collection is empty
        const count = await Announcement.countDocuments({});
        
        if (count === 0) {
            await insertSampleAnnouncements();
        }
        
    } catch (error) {
        console.error('❌ Error initializing announcements collection:', error);
    }
};

// Insert sample announcements
const insertSampleAnnouncements = async () => {
    try {
        const sampleAnnouncements = [
            {
                title: 'Welcome to Seana Bot!',
                content: 'Bot WhatsApp canggih dengan berbagai fitur menarik seperti commands, sticker maker, dan banyak lagi. Nikmati pengalaman chatting yang lebih seru!',
                author: '+6285709557572',
                icon: '🎉'
            },
            {
                title: 'Sticker Feature Available',
                content: 'Fitur pembuatan sticker telah tersedia! Convert gambar menjadi sticker dengan mudah menggunakan command .s atau .sticker!',
                author: '+6285709557572',
                icon: '🖼️'
            },
            {
                title: 'Bot Commands Updated',
                content: 'Sistem command telah diperbarui dengan response time yang lebih cepat. Gunakan .menu untuk melihat semua command yang tersedia.',
                author: '+6285709557572',
                icon: '⚡'
            }
        ];
        
        await Announcement.insertMany(sampleAnnouncements);
        
        console.log('✅ Sample announcements inserted successfully');
    } catch (error) {
        console.error('❌ Error inserting sample announcements:', error);
    }
};

// Get recent announcements (limit for homepage)
const getRecentAnnouncements = async (limit = 3) => {
    try {
        return await Announcement.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('❌ Error fetching recent announcements:', error);
        return [];
    }
};

// Get all announcements (for news page)
const getAllAnnouncements = async () => {
    try {
        return await Announcement.find({ isActive: true })
            .sort({ createdAt: -1 })
            .lean();
    } catch (error) {
        console.error('❌ Error fetching all announcements:', error);
        return [];
    }
};

// Add new announcement
const addAnnouncement = async (title, content, author, icon = '📢', category = 'pengumuman') => {
    try {
        const announcement = new Announcement({
            title,
            content,
            author,
            icon,
            category
        });
        return await announcement.save();
    } catch (error) {
        console.error('❌ Error adding announcement:', error);
        throw error;
    }
};

// Update announcement
const updateAnnouncement = async (id, updateData) => {
    try {
        return await Announcement.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
        console.error('❌ Error updating announcement:', error);
        throw error;
    }
};

// Delete announcement
const deleteAnnouncement = async (id) => {
    try {
        await Announcement.findByIdAndUpdate(id, { isActive: false });
        return true;
    } catch (error) {
        console.error('❌ Error deleting announcement:', error);
        throw error;
    }
};

// Format date for display
const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false
    };
    return date.toLocaleDateString('id-ID', options);
};

module.exports = {
    initAnnouncementsTable,
    getRecentAnnouncements,
    getAllAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    formatDate
};