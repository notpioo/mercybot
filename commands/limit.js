const config = require('../config/config');
const { getUser } = require('../lib/database');
const { formatJid } = require('../utils/helpers');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;
    
    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only owners can use this command.'
            });
            return;
        }

        // Get target user (from mention or phone number)
        let targetJid = null;
        let amount = 0;

        // Check if there's a mention
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            // For mentions, get the amount from the text after removing mention
            const fullText = message.message.extendedTextMessage.text || '';
            const textParts = fullText.trim().split(/\s+/);
            // Find the amount part (should be after the command and mention)
            amount = parseInt(textParts.find(part => /^\d+$/.test(part))) || 0;
        } else if (args.length >= 2) {
            // Format phone number
            const phoneNumber = args[0].replace(/\D/g, '');
            if (phoneNumber.length >= 10) {
                targetJid = formatJid(phoneNumber);
                amount = parseInt(args[1]) || 0;
            }
        }

        if (!targetJid || amount <= 0) {
            await sock.sendMessage(remoteJid, {
                text: `❌ Usage: ${config.prefixes[0]}${commandName} @mention/number amount`
            });
            return;
        }

        // Get target user
        const targetUser = await getUser(targetJid);
        const { User } = require('../lib/database');

        let newLimit = targetUser.limit || 0;
        
        if (commandName === 'addlimit') {
            if (targetUser.limit === 'unlimited') {
                newLimit = 'unlimited';
                // Don't update if already unlimited
                await sock.sendMessage(remoteJid, {
                    text: `✅ User already has unlimited limit.`,
                    mentions: [targetJid]
                });
                return;
            } else {
                newLimit = (targetUser.limit || 0) + amount;
                await User.updateOne(
                    { jid: targetJid },
                    { $inc: { limit: amount } }
                );
            }
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Successfully added ${amount} limit to user.\nNew limit: ${newLimit}`,
                mentions: [targetJid]
            });
        } else if (commandName === 'dellimit') {
            if (targetUser.limit === 'unlimited') {
                newLimit = 'unlimited';
                await sock.sendMessage(remoteJid, {
                    text: `✅ User has unlimited limit. Cannot reduce unlimited limit.`,
                    mentions: [targetJid]
                });
                return;
            } else {
                newLimit = Math.max(0, (targetUser.limit || 0) - amount);
                await User.updateOne(
                    { jid: targetJid },
                    { $set: { limit: newLimit } }
                );
            }
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Successfully removed ${amount} limit from user.\nNew limit: ${newLimit}`,
                mentions: [targetJid]
            });
        }

        console.log(`⏰ ${commandName} executed by ${senderName}`);
        
    } catch (error) {
        console.error(`❌ Failed to execute ${commandName}:`, error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};