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
