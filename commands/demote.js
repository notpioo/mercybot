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
                text: '❌ Only group admins or bot owners can use this command.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Usage: .demote @mention or .demote phonenumber\n\nExample: .demote @user or .demote 628123456789'
            });
            return;
        }

        let targetJid = null;

        // Check if it's a mention
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else {
            // Try to parse as phone number
            let phoneNumber = args[0].replace(/[^0-9]/g, '');
            if (phoneNumber.startsWith('0')) {
                phoneNumber = '62' + phoneNumber.substring(1);
            } else if (!phoneNumber.startsWith('62')) {
                phoneNumber = '62' + phoneNumber;
            }
            targetJid = phoneNumber + '@s.whatsapp.net';
        }

        // Check if user is in the group
        const targetMember = groupMetadata.participants.find(p => p.id === targetJid);
        if (!targetMember) {
            await sock.sendMessage(remoteJid, {
                text: '❌ User is not a member of this group.'
            });
            return;
        }

        // Check if user is an admin
        if (!targetMember.admin || targetMember.admin === null) {
            await sock.sendMessage(remoteJid, {
                text: '❌ User is not an admin.'
            });
            return;
        }

        // Demote the user
        await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'demote');

        const userPhone = targetJid.replace('@s.whatsapp.net', '');
        
        await sock.sendMessage(remoteJid, {
            text: `✅ User demoted successfully!\n\n` +
                  `👤 User: @${userPhone}\n` +
                  `⬇️ Status: Admin → Member\n` +
                  `🛡️ Demoted by: ${senderName}`,
            mentions: [targetJid]
        });

    } catch (error) {
        console.error('Error in demote command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while demoting user. Make sure the bot has admin permissions.'
        });
    }
}

module.exports = { execute };