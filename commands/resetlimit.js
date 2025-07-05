const config = require('../config/config');

async function execute(context) {
    const { sock, remoteJid, user, senderName } = context;
    
    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only owners can use this command.'
            });
            return;
        }

        const { User } = require('../lib/database');
        
        // Reset limit for all basic users to default limit
        const result = await User.updateMany(
            { 
                status: 'basic',
                limit: { $ne: 'unlimited' }
            },
            { 
                $set: { 
                    limit: config.userSystem.defaultLimit
                }
            }
        );
        
        await sock.sendMessage(remoteJid, {
            text: `✅ Successfully reset daily limit for ${result.modifiedCount} users to ${config.userSystem.defaultLimit}`
        });

        console.log(`🔄 Reset limit executed by ${senderName} - ${result.modifiedCount} users affected`);
        
    } catch (error) {
        console.error('❌ Failed to reset limits:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};