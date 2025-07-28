const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize announcements table
const initAnnouncementsTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) NOT NULL,
                icon VARCHAR(50) DEFAULT '📢',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            );
        `;
        
        await pool.query(query);
        console.log('✅ Announcements table initialized successfully');
        
        // Insert sample announcements if table is empty
        const countResult = await pool.query('SELECT COUNT(*) FROM announcements');
        const count = parseInt(countResult.rows[0].count);
        
        if (count === 0) {
            await insertSampleAnnouncements();
        }
        
    } catch (error) {
        console.error('❌ Error initializing announcements table:', error);
    }
};

// Insert sample announcements
const insertSampleAnnouncements = async () => {
    try {
        const sampleAnnouncements = [
            {
                title: 'Level System Update',
                content: 'Sistem level telah diperbarui dengan 9 tier baru: Warrior, Elite, Master, Grandmaster, Epic, Legend, Mythic, Honor, dan Immortal. Dapatkan EXP dan naik level!',
                author: '+6285709557572',
                icon: '⚡'
            },
            {
                title: 'Game Mines Tersedia!',
                content: 'Game Mines casino kini telah tersedia! Mainkan permainan seru ini dan menangkan chips. Akses melalui menu Games di dashboard.',
                author: '+6285709557572',
                icon: '🎮'
            },
            {
                title: 'Selamat Datang di NoMercy Bot!',
                content: 'Bot WhatsApp canggih dengan berbagai fitur menarik seperti games, level system, dan banyak lagi. Nikmati pengalaman chatting yang lebih seru!',
                author: '+6285709557572',
                icon: '🎉'
            },
            {
                title: 'Update Sistem Sticker',
                content: 'Fitur pembuatan sticker telah diperbarui dengan kualitas gambar yang lebih baik dan metadata yang sempurna. Gunakan command .s atau .sticker!',
                author: '+6285709557572',
                icon: '🖼️'
            },
            {
                title: 'Tournament Mode Coming Soon',
                content: 'Mode tournament akan segera hadir! Bersiaplah untuk kompetisi seru antar squad dengan hadiah menarik. Stay tuned!',
                author: '+6285709557572',
                icon: '🏆'
            }
        ];
        
        for (const announcement of sampleAnnouncements) {
            await pool.query(
                'INSERT INTO announcements (title, content, author, icon) VALUES ($1, $2, $3, $4)',
                [announcement.title, announcement.content, announcement.author, announcement.icon]
            );
        }
        
        console.log('✅ Sample announcements inserted successfully');
    } catch (error) {
        console.error('❌ Error inserting sample announcements:', error);
    }
};

// Get recent announcements (limit for homepage)
const getRecentAnnouncements = async (limit = 3) => {
    try {
        const query = `
            SELECT id, title, content, author, icon, created_at 
            FROM announcements 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    } catch (error) {
        console.error('❌ Error fetching recent announcements:', error);
        return [];
    }
};

// Get all announcements (for news page)
const getAllAnnouncements = async () => {
    try {
        const query = `
            SELECT id, title, content, author, icon, created_at 
            FROM announcements 
            WHERE is_active = true 
            ORDER BY created_at DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('❌ Error fetching all announcements:', error);
        return [];
    }
};

// Add new announcement
const addAnnouncement = async (title, content, author, icon = '📢') => {
    try {
        const query = `
            INSERT INTO announcements (title, content, author, icon) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        
        const result = await pool.query(query, [title, content, author, icon]);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error adding announcement:', error);
        throw error;
    }
};

// Delete announcement
const deleteAnnouncement = async (id) => {
    try {
        const query = 'UPDATE announcements SET is_active = false WHERE id = $1';
        await pool.query(query, [id]);
        return true;
    } catch (error) {
        console.error('❌ Error deleting announcement:', error);
        throw error;
    }
};

// Format date for display
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
};

module.exports = {
    initAnnouncementsTable,
    getRecentAnnouncements,
    getAllAnnouncements,
    addAnnouncement,
    deleteAnnouncement,
    formatDate,
    pool
};