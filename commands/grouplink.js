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
                text: '❌ Only group admins can generate invite links.'
            });
            return;
        }

        // Get bot number and check if bot is admin
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.jid?.split('@')[0] || sock.user?.number;
        const isBotAdmin = groupMetadata.participants.find(p => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === botNumber && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        if (!isBotAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Bot needs to be admin to generate invite links.'
            });
            return;
        }

        try {
            // Generate group invite link
            const inviteCode = await sock.groupInviteCode(remoteJid);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            
            const linkMessage = `🔗 *Group Invite Link*\n\n` +
                `📱 Group: ${groupMetadata.subject}\n` +
                `👥 Members: ${groupMetadata.participants.length}\n\n` +
                `🌐 Invite Link:\n${inviteLink}\n\n` +
                `⚠️ *Important:*\n` +
                `• Don't share this link publicly\n` +
                `• Link can be revoked by admins\n` +
                `• Anyone with this link can join the group\n\n` +
                `📅 Generated: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

            await sock.sendMessage(remoteJid, {
                text: linkMessage
            });

        } catch (error) {
            console.error('Error generating invite link:', error);
            await sock.sendMessage(remoteJid, {
                text: '❌ Failed to generate invite link. Make sure bot has admin permissions.'
            });
        }

    } catch (error) {
        console.error('Error in grouplink command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while generating group link.'
        });
    }
}

module.exports = { execute };