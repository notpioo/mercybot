
const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName, isGroup } = context;

    try {
        // Only work in groups
        if (!isGroup) {
            await sock.sendMessage(remoteJid, {
                text: '❌ This command can only be used in groups.'
            });
            return;
        }

        // Check if user is owner or admin
        if (!user.isOwner) {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const isAdmin = groupMetadata.participants.find(p => 
                p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isAdmin) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Only owners or group admins can close group chat.'
                });
                return;
            }
        }

        // Check if bot is admin
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.jid?.split('@')[0] || sock.user?.number;
        const isBotAdmin = groupMetadata.participants.find(p => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === botNumber && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        if (!isBotAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Bot needs to be admin to close group chat.'
            });
            return;
        }

        try {
            // Close group chat (only admins can send messages)
            await sock.groupSettingUpdate(remoteJid, 'announcement');
            
            await sock.sendMessage(remoteJid, {
                text: `🔒 *Group Chat Closed*\n\n` +
                      `📢 Only admins can send messages now\n` +
                      `👤 Closed by: ${senderName}\n` +
                      `⏰ Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            });

            console.log(`🔒 Group chat closed by ${senderName} in group ${groupMetadata.subject}`);

        } catch (settingError) {
            console.error('Failed to close group chat:', settingError);
            await sock.sendMessage(remoteJid, {
                text: '❌ Failed to close group chat. Make sure bot has admin permissions.'
            });
        }

    } catch (error) {
        console.error('❌ Failed to execute closegc command:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
