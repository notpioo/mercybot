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
                text: '❌ Only group admins can use this command.'
            });
            return;
        }

        // Get all group members
        const participants = groupMetadata.participants;
        const mentionList = participants.map(p => p.id);
        
        // Create custom message or use default
        const customMessage = args.join(' ') || 'Group Announcement';
        
        // Format the message
        let tagMessage = `📢 *${customMessage}*\n\n`;
        tagMessage += `👥 *Mentioning all ${participants.length} members:*\n`;
        
        // Add member list with numbers
        participants.forEach((participant, index) => {
            const number = participant.id.split('@')[0];
            tagMessage += `${index + 1}. @${number}\n`;
        });
        
        tagMessage += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        tagMessage += `📅 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        // Send message with mentions
        await sock.sendMessage(remoteJid, {
            text: tagMessage,
            mentions: mentionList
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while tagging all members.'
        });
    }
}

module.exports = { execute };