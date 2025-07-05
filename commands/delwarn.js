const config = require('../config/config');
const { getUser } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Check if user is owner or group admin
        let isGroupAdmin = false;
        if (remoteJid.endsWith('@g.us') && !user.isOwner) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                isGroupAdmin = groupMetadata.participants.find(p => 
                    p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
                );
            } catch (error) {
                console.error('Error checking group admin status:', error);
            }
        }

        if (!user.isOwner && !isGroupAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only bot owners and group admins can use this command.'
            });
            return;
        }

        if (!args[0] || !args[1]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Usage: .delwarn @mention amount\n\nExample: .delwarn @user 2'
            });
            return;
        }

        // Get mentioned user from message
        let targetJid = null;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please mention a user to remove warnings from.\n\nExample: .delwarn @user 2'
            });
            return;
        }

        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please provide a valid number of warnings to remove.'
            });
            return;
        }

        // Get target user
        const targetUser = await getUser(targetJid);
        if (!targetUser) {
            await sock.sendMessage(remoteJid, {
                text: '❌ User not found in database.'
            });
            return;
        }

        const currentWarnings = targetUser.warnings || 0;
        const newWarnings = Math.max(0, currentWarnings - amount);
        
        targetUser.warnings = newWarnings;
        await targetUser.save();

        const userPhone = targetJid.replace('@s.whatsapp.net', '');
        
        await sock.sendMessage(remoteJid, {
            text: `✅ Warning removed successfully!\n\n` +
                  `👤 User: @${userPhone}\n` +
                  `⚠️ Previous warnings: ${currentWarnings}\n` +
                  `➖ Removed: ${amount}\n` +
                  `📊 Current warnings: ${newWarnings}`,
            mentions: [targetJid]
        });

    } catch (error) {
        console.error('Error in delwarn command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while removing warnings.'
        });
    }
}

module.exports = { execute };