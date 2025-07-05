
const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ This command can only be used in groups.'
            });
            return;
        }

        // Get group info and check if user is admin/owner
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(p => 
            p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!user.isOwner && !isAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only bot owners and group admins can use this command.'
            });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please provide words to remove from badword list.\n\nUsage: .delbadword word1 word2 word3\n\nExample: .delbadword spam scam'
            });
            return;
        }

        // Get group data
        const group = await getGroup(remoteJid);
        if (!group || !group.settings || !group.settings.badWords || group.settings.badWords.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '❌ No badwords configured for this group.'
            });
            return;
        }

        // Normalize input words (lowercase)
        const wordsToRemove = args.map(word => word.toLowerCase().trim()).filter(word => word.length > 0);
        
        // Get existing badwords
        const existingWords = group.settings.badWords || [];
        
        // Find words that exist in the list
        const validWords = wordsToRemove.filter(word => existingWords.includes(word));
        
        // Find words that don't exist in the list
        const invalidWords = wordsToRemove.filter(word => !existingWords.includes(word));
        
        if (validWords.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: `❌ None of the specified words are in the badword list.\n\nNot found: ${invalidWords.join(', ')}`
            });
            return;
        }

        // Remove words from the list
        group.settings.badWords = existingWords.filter(word => !validWords.includes(word));
        await group.save();

        let responseMessage = `✅ Successfully removed ${validWords.length} badword(s):\n`;
        responseMessage += `➖ Removed: ${validWords.join(', ')}\n`;
        
        if (invalidWords.length > 0) {
            responseMessage += `⚠️ Not found: ${invalidWords.join(', ')}\n`;
        }
        
        responseMessage += `\n📊 Remaining badwords: ${group.settings.badWords.length}`;

        await sock.sendMessage(remoteJid, {
            text: responseMessage
        });

    } catch (error) {
        console.error('Error in delbadword command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while removing badwords.'
        });
    }
}

module.exports = { execute };
