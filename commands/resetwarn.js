const config = require('../config/config');
const { getUser } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Only owners can use this command
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only bot owners can use this command.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Usage: .resetwarn @mention | .resetwarn all\n\nExample: .resetwarn @user\nExample: .resetwarn all'
            });
            return;
        }

        // Check if user wants to reset all warnings
        if (args[0].toLowerCase() === 'all') {
            const { User } = require('../lib/database');
            
            // Get all users with warnings > 0
            const usersWithWarnings = await User.find({ warnings: { $gt: 0 } });
            
            if (usersWithWarnings.length === 0) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ No users with warnings found in database.'
                });
                return;
            }

            // Reset all warnings
            await User.updateMany({ warnings: { $gt: 0 } }, { $set: { warnings: 0 } });
            
            await sock.sendMessage(remoteJid, {
                text: `✅ All warnings reset successfully!\n\n` +
                      `👥 Total users affected: ${usersWithWarnings.length}\n` +
                      `🔄 All users now have 0 warnings\n\n` +
                      `Everyone has a clean slate now!`
            });
            return;
        }

        // Get mentioned user from message
        let targetJid = null;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please mention a user to reset warnings.\n\nExample: .resetwarn @user'
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

        const previousWarnings = targetUser.warnings || 0;
        
        targetUser.warnings = 0;
        await targetUser.save();

        const userPhone = targetJid.replace('@s.whatsapp.net', '');
        
        await sock.sendMessage(remoteJid, {
            text: `✅ Warnings reset successfully!\n\n` +
                  `👤 User: @${userPhone}\n` +
                  `⚠️ Previous warnings: ${previousWarnings}\n` +
                  `🔄 Current warnings: 0\n\n` +
                  `User has a clean slate now!`,
            mentions: [targetJid]
        });

    } catch (error) {
        console.error('Error in resetwarn command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while resetting warnings.'
        });
    }
}

module.exports = { execute };