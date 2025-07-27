const config = require('../config/config');

const menuCommand = async (sock, from, sender, args) => {
    try {
        // Replace botName placeholder with actual bot name
        const menuText = config.messages.menuMessage
            .replace(/{botName}/g, config.botName.toUpperCase());
        
        await sock.sendMessage(from, { 
            text: menuText,
            mentions: [config.ownerNumber]
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error in menu command:', error.message);
        await sock.sendMessage(from, { 
            text: config.messages.databaseError 
        });
        return false;
    }
};

module.exports = {
    name: 'menu',
    description: 'Show bot menu and available commands',
    usage: '.menu',
    category: 'general',
    requiresLimit: false,
    execute: menuCommand
};
