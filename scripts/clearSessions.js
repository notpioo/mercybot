const fs = require('fs');
const path = require('path');

// Function to clear all session data
function clearAllSessions() {
    const sessionsDir = path.join(process.cwd(), 'sessions');
    
    try {
        if (fs.existsSync(sessionsDir)) {
            // Remove all files in sessions directory
            const files = fs.readdirSync(sessionsDir);
            files.forEach(file => {
                const filePath = path.join(sessionsDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Deleted session file: ${file}`);
                }
            });
            console.log('✅ All session files cleared');
        } else {
            console.log('📁 Sessions directory does not exist');
        }
        
        // Recreate sessions directory
        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
            console.log('📁 Sessions directory recreated');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error clearing sessions:', error);
        return false;
    }
}

// Export for use in other modules
module.exports = { clearAllSessions };

// If run directly, clear sessions
if (require.main === module) {
    console.log('🧹 Clearing all WhatsApp sessions...');
    clearAllSessions();
    console.log('✨ Session clearing completed. Please restart the bot.');
}