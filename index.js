const { startWhatsApp } = require('./lib/whatsapp');
const { connectDatabase } = require('./lib/database');
const config = require('./config/config');
const { initializeDefaultLevelRewards } = require('./lib/levelRewardSystem');

// Start web server for QR code display
require('./web-server');

async function main() {
    try {
        console.log('🚀 Starting WhatsApp Bot...');
        console.log('📱 Bot Owners:', config.owners.join(', '));
        console.log('🔧 Prefixes:', config.prefixes.join(', '));
        
        // Connect to MongoDB
        await connectDatabase();
        
        // Initialize level reward system
        await initializeDefaultLevelRewards();
        
        // Start WhatsApp client
        await startWhatsApp();
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Bot shutting down...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
