const mongoose = require('mongoose');
const config = require('../config/config');

async function cleanDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        console.log('✅ Connected to MongoDB');
        
        // Drop the entire database to clean up any problematic indexes
        await mongoose.connection.db.dropDatabase();
        console.log('🗑️ Database dropped successfully');
        
        console.log('✅ Database cleaned. Bot can now start fresh.');
        
    } catch (error) {
        console.error('❌ Failed to clean database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

cleanDatabase();