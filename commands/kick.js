const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');
const { formatJid } = require('../utils/helpers');

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
        
        // Get bot number and find in participants
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.jid?.split('@')[0] || sock.user?.number;
        const isBotAdmin = groupMetadata.participants.find(p => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === botNumber && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        if (!user.isOwner && !isAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only group admins can use this command.'
            });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Bot needs to be admin to remove members.'
            });
            return;
        }

        let targetJid = null;

        // Check if replying to a message
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant;
            if (quotedParticipant) {
                targetJid = quotedParticipant;
            }
        }
        
        // Check for mentions
        if (!targetJid && message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        // Check for phone number in args
        if (!targetJid && args[0]) {
            let phoneNumber = args[0].replace(/[^0-9]/g, '');
            if (phoneNumber.startsWith('0')) {
                phoneNumber = '62' + phoneNumber.substring(1);
            } else if (!phoneNumber.startsWith('62')) {
                phoneNumber = '62' + phoneNumber;
            }
            targetJid = phoneNumber + '@s.whatsapp.net';
        }

        if (!targetJid) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please mention a user or reply to their message.\n\nUsage: .kick @user or reply to a message with .kick'
            });
            return;
        }

        // Check if target is in the group
        const targetMember = groupMetadata.participants.find(p => p.id === targetJid);
        if (!targetMember) {
            await sock.sendMessage(remoteJid, {
                text: '❌ User is not in this group.'
            });
            return;
        }

        // Prevent kicking other admins (unless you're the owner)
        if (!user.isOwner && (targetMember.admin === 'admin' || targetMember.admin === 'superadmin')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Cannot kick another admin.'
            });
            return;
        }

        // Prevent kicking the bot owner
        const targetUser = await getUser(targetJid);
        if (targetUser && targetUser.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Cannot kick the bot owner.'
            });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'remove');
            
            const targetNumber = targetJid.split('@')[0];
            await sock.sendMessage(remoteJid, {
                text: `✅ Successfully removed +${targetNumber} from the group.`
            });
        } catch (error) {
            console.error('Error removing member:', error);
            await sock.sendMessage(remoteJid, {
                text: '❌ Failed to remove member. Make sure the user is in the group and bot has admin permissions.'
            });
        }

    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while removing member.'
        });
    }
}

module.exports = { execute };