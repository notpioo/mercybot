module.exports = {
    // Bot Configuration
    botName: 'seana bot',
    ownerNumber: '6285709557572@s.whatsapp.net',
    
    // Database Configuration
    mongoURI: process.env.MONGO_URI || 'mongodb+srv://pioo:Avionika27@cluster0.feboa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    
    // User Default Settings
    defaultSettings: {
        status: 'basic', // owner, premium, basic
        limit: 30,
        balance: 50,
        chips: 100
    },
    
    // Command Configuration
    commands: {
        prefix: '.',
        limitCommands: ['profile', 'sticker', 's'] // Commands that require limits
    },
    
    // Sticker Configuration
    sticker: {
        pack: 'seana bot',
        author: 'pioo'
    },
    
    // Status Levels
    statusLevels: {
        OWNER: 'owner',
        PREMIUM: 'premium', 
        BASIC: 'basic'
    },
    
    // Level System Configuration
    levelSystem: {
        // XP required per level (medium grinding)
        xpPerLevel: (level) => Math.floor(100 + (level * 50) + (level ** 1.5 * 25)),
        
        // Rank Configuration
        ranks: [
            { name: 'Luminary', minLevel: 1, maxLevel: 15, color: '#fbbf24', icon: '⭐' },
            { name: 'Sage', minLevel: 16, maxLevel: 30, color: '#10b981', icon: '🌟' },
            { name: 'Visionary', minLevel: 31, maxLevel: 50, color: '#3b82f6', icon: '🔮' },
            { name: 'Guardian', minLevel: 51, maxLevel: 75, color: '#8b5cf6', icon: '🛡️' },
            { name: 'Mastermind', minLevel: 76, maxLevel: 100, color: '#f59e0b', icon: '🧠' },
            { name: 'Zenith', minLevel: 101, maxLevel: 129, color: '#ef4444', icon: '⚡' },
            { name: 'Celestial', minLevel: 130, maxLevel: 999, color: '#ec4899', icon: '🛡️' },
            { name: 'Mastermind', minLevel: 76, maxLevel: 100, color: '#ef4444', icon: '🧠' },
            { name: 'Zenith', minLevel: 101, maxLevel: 129, color: '#f59e0b', icon: '⚡' },
            { name: 'Celestial', minLevel: 130, maxLevel: 999, color: '#ec4899', icon: '👑' }
        ],
        
        // XP Rewards
        rewards: {
            commandUse: 10,
            dailyLogin: 50,
            stickerCreate: 15,
            profileView: 5
        }
    },
    
    // Messages Configuration
    messages: {
        // Success Messages
        commandSuccess: '✅ Command executed successfully!',
        profileUpdated: '✅ Profile updated successfully!',
        
        // Error Messages
        commandNotFound: '❌ Command not found. Type .menu to see available commands.',
        insufficientLimit: '❌ Insufficient limit! You need at least 1 limit to use this command.',
        databaseError: '❌ Database error occurred. Please try again later.',
        unauthorizedAccess: '❌ You are not authorized to use this command.',
        
        // Info Messages
        welcomeMessage: '👋 Welcome to Seana Bot! Type .menu to get started.',
        
        // Menu Message
        menuMessage: `
╭─「 🤖 {botName} MENU 」
│
├─「 📋 Basic Commands 」
│ • .menu - Show this menu
│ • .ping - Check bot response time
│ • .profile - View your profile (1 limit)
│
├─「 🎨 Media Commands 」
│ • .s/.sticker - Convert image to sticker (1 limit)
│
├─「 ℹ️ Bot Information 」
│ • Bot Name: {botName}
│ • Owner: @6285709557572
│ • Status: Active
│
╰─「 💡 Note: Commands marked with limit cost will deduct from your available limits 」
╰─「 ⭐ Owner & Premium users have unlimited limits 」`,

        // Profile Message Template
        profileMessage: `
┌─「 User Info 」
│ • Username: {username}
│ • Tag: {tag}
│ • Status: {status}
│ • Limit: {limitDisplay}
│ • Balance: {balance}
│ • Chips: {chips}
│ • Member since: {memberSince}
└──────────────────────`,
        
        // Ping Message
        pingMessage: '🏓 Pong!  {responseTime}ms'
    }
};
