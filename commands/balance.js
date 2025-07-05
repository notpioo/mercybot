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

        let newBalance = targetUser.balance || 0;
        
        if (commandName === 'addbalance' || commandName === 'addbal') {
            newBalance += amount;
            await User.updateOne(
                { jid: targetJid },
                { $inc: { balance: amount } }
            );
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Successfully added ${amount} balance to user.\nNew balance: ${newBalance}`,
                mentions: [targetJid]
            });
        } else if (commandName === 'delbalance' || commandName === 'delbal') {
            newBalance = Math.max(0, newBalance - amount);
            await User.updateOne(
                { jid: targetJid },
                { $set: { balance: newBalance } }
            );
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Successfully removed ${amount} balance from user.\nNew balance: ${newBalance}`,
                mentions: [targetJid]
            });
        }

        console.log(`💰 ${commandName} executed by ${senderName}`);
        
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