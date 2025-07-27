const config = require('../config/config');

const pingCommand = async (sock, from, sender, args) => {
    try {
        const startTime = Date.now();
        
        // Send initial message
        const sentMessage = await sock.sendMessage(from, { 
            text: '🏓 Calculating ping...' 
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Edit the message with actual ping
        const pingText = config.messages.pingMessage.replace('{responseTime}', responseTime);
        
        await sock.sendMessage(from, { 
            text: pingText,
            edit: sentMessage.key
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error in ping command:', error.message);
        await sock.sendMessage(from, { 
            text: config.messages.databaseError 
        });
        return false;
    }
};

module.exports = {
    name: 'ping',
    description: 'Check bot response time and status',
    usage: '.ping',
    category: 'general',
    requiresLimit: false,
    execute: pingCommand
};
