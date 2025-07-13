const config = require('../config/config');
const { getUser } = require('../lib/database');
const { formatJid } = require('../utils/helpers');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args } = context;
    
    try {
        let targetUser = user;
        let targetName = senderName;
        let targetJid = user.jid;
        
        // Check and update premium status if expired for own profile
        if (targetUser.status === 'premium' && targetUser.premiumUntil && new Date() > targetUser.premiumUntil) {
            const { User } = require('../lib/database');
            await User.updateOne(
                { jid: targetJid },
                { 
                    $set: { 
                        status: 'basic',
                        premiumUntil: null,
                        limit: config.userSystem.defaultLimit
                    }
                }
            );
            targetUser.status = 'basic';
            targetUser.premiumUntil = null;
            targetUser.limit = config.userSystem.defaultLimit;
        }

        // Check if user mentioned someone or provided phone number
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            targetUser = await getUser(mentionedJid);
            targetJid = mentionedJid;
            
            // Check and update premium status if expired
            if (targetUser.status === 'premium' && targetUser.premiumUntil && new Date() > targetUser.premiumUntil) {
                const { User } = require('../lib/database');
                await User.updateOne(
                    { jid: targetJid },
                    { 
                        $set: { 
                            status: 'basic',
                            premiumUntil: null,
                            limit: config.userSystem.defaultLimit
                        }
                    }
                );
                targetUser.status = 'basic';
                targetUser.premiumUntil = null;
                targetUser.limit = config.userSystem.defaultLimit;
            }
            
            // Get mentioned user's name from WhatsApp
            try {
                const contactInfo = await sock.onWhatsApp(mentionedJid);
                if (contactInfo && contactInfo[0]?.name) {
                    targetName = contactInfo[0].name;
                } else {
                    targetName = targetUser.name || 'Unknown';
                }
            } catch (error) {
                targetName = targetUser.name || 'Unknown';
            }
        } else if (args.length > 0) {
            // Check if user provided phone number
            const phoneNumber = args[0].replace(/\D/g, '');
            if (phoneNumber.length >= 10) {
                targetJid = formatJid(phoneNumber);
                targetUser = await getUser(targetJid);
                
                // Check and update premium status if expired
                if (targetUser.status === 'premium' && targetUser.premiumUntil && new Date() > targetUser.premiumUntil) {
                    const { User } = require('../lib/database');
                    await User.updateOne(
                        { jid: targetJid },
                        { 
                            $set: { 
                                status: 'basic',
                                premiumUntil: null,
                                limit: config.userSystem.defaultLimit
                            }
                        }
                    );
                    targetUser.status = 'basic';
                    targetUser.premiumUntil = null;
                    targetUser.limit = config.userSystem.defaultLimit;
                }
                
                // Get user's name from WhatsApp
                try {
                    const contactInfo = await sock.onWhatsApp(targetJid);
                    if (contactInfo && contactInfo[0]?.name) {
                        targetName = contactInfo[0].name;
                    } else {
                        targetName = targetUser.name || 'Unknown';
                    }
                } catch (error) {
                    targetName = targetUser.name || 'Unknown';
                }
            }
        }

        // Get target user's profile picture
        let profilePictureUrl = null;
        try {
            profilePictureUrl = await sock.profilePictureUrl(targetJid, 'image');
        } catch (error) {
            // If no profile picture, use default
            profilePictureUrl = null;
        }

        // Check if user is owner based on config
        const { isOwner } = require('../utils/helpers');
        const isOwnerUser = isOwner(targetJid);
        
        // Format user data
        const username = targetUser.username || targetName || 'Unknown';
        const phoneNumber = targetJid.split('@')[0];
        const tag = `@${phoneNumber}`;
        const status = isOwnerUser ? 'owner' : (targetUser.status || 'basic');
        const statusName = config.userSystem.statuses[status]?.name || 'Basic';
        const limit = isOwnerUser ? '∞' : (targetUser.limit === 'unlimited' ? '∞' : targetUser.limit);
        const balance = targetUser.balance || 0;
        const chips = targetUser.chips || 0;
        const memberSince = targetUser.createdAt ? targetUser.createdAt.toLocaleDateString('id-ID') : 'Unknown';

        // Create profile text
        const profileText = `┌─「 User Info 」
│ • Username: ${username}
│ • Tag: ${tag}
│ • Status: ${statusName}
│ • Limit: ${limit}
│ • Balance: ${balance}
│ • Chips: ${chips}
│ • Member since: ${memberSince}
└──────────────────────`;

        // Send profile picture if available with mention
        if (profilePictureUrl) {
            await sock.sendMessage(remoteJid, {
                image: { url: profilePictureUrl },
                caption: profileText,
                mentions: [targetJid]
            });
        } else {
            await sock.sendMessage(remoteJid, {
                text: profileText,
                mentions: [targetJid]
            });
        }

        console.log('👤 Profile sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send profile:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};