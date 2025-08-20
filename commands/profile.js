const config = require('../config/config');
const { getUser } = require('../utils/userUtils');

const profileCommand = async (sock, from, sender, args, message) => {
    try {
        // Get user data
        const user = await getUser(sender);
        if (!user) {
            await sock.sendMessage(from, { 
                text: config.messages.databaseError 
            });
            return false;
        }
        
        // Check if user has enough limits
        if (user.limit < 1) {
            await sock.sendMessage(from, { 
                text: config.messages.insufficientLimit 
            });
            return false;
        }
        
        // Get WhatsApp profile name from multiple sources
        let whatsappName = 'User';
        
        // Try to get name from message pushName first
        if (message && message.pushName) {
            whatsappName = message.pushName;
        } else {
            // Try other methods
            try {
                // Try getting contact info
                const contactInfo = await sock.onWhatsApp(sender);
                if (contactInfo && contactInfo[0] && contactInfo[0].notify) {
                    whatsappName = contactInfo[0].notify;
                }
            } catch (error) {
                console.log('Could not fetch WhatsApp name from onWhatsApp');
            }
            
            // If still no name, try getting from chat
            if (whatsappName === 'User') {
                try {
                    const chat = await sock.chatRead(from);
                    if (chat && chat.name) {
                        whatsappName = chat.name;
                    }
                } catch (error) {
                    console.log('Could not fetch name from chat');
                }
            }
        }
        
        console.log(`📝 Using WhatsApp name: ${whatsappName} for user: ${sender}`);
        
        // Deduct limit silently (no notification)
        user.deductLimit(1);
        user.updateActivity();
        await user.save();
        
        // Format limit display based on user status
        let limitDisplay = '';
        if (user.hasUnlimitedLimits()) {
            limitDisplay = '∞ (unlimited)';
        } else {
            limitDisplay = `${user.limit}/${user.totalLimit}`;
        }
        
        // Format profile message
        const profileText = config.messages.profileMessage
            .replace('{username}', whatsappName)
            .replace('{tag}', `@${sender.split('@')[0]}`)
            .replace('{status}', user.status.toUpperCase())
            .replace('{limitDisplay}', limitDisplay)
            .replace('{balance}', user.balance)
            .replace('{reelCoin}', user.reelCoin || 0)
            .replace('{chips}', user.chips)
            .replace('{memberSince}', user.getFormattedMemberSince());
        
        // Get profile picture
        let profilePicUrl = null;
        try {
            profilePicUrl = await sock.profilePictureUrl(sender, 'image');
        } catch (error) {
            console.log('Could not fetch profile picture');
        }
        
        // Send profile info with picture if available
        if (profilePicUrl) {
            await sock.sendMessage(from, {
                image: { url: profilePicUrl },
                caption: profileText,
                mentions: [sender]
            });
        } else {
            // Send without image if profile picture is not available
            await sock.sendMessage(from, { 
                text: profileText,
                mentions: [sender]
            });
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error in profile command:', error.message);
        await sock.sendMessage(from, { 
            text: config.messages.databaseError 
        });
        return false;
    }
};

module.exports = {
    name: 'profile',
    description: 'View your user profile and statistics',
    usage: '.profile',
    category: 'user',
    requiresLimit: true,
    limitCost: 1,
    execute: profileCommand
};
