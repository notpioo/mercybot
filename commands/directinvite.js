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

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please provide a phone number.\n\nUsage: .directinvite 628123456789'
            });
            return;
        }

        // Format phone number
        let phoneNumber = args[0].replace(/[^0-9]/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('62')) {
            phoneNumber = '62' + phoneNumber;
        }

        const targetJid = phoneNumber + '@s.whatsapp.net';

        // Check if user is already in group
        const existingMember = groupMetadata.participants.find(p => p.id === targetJid);
        if (existingMember) {
            await sock.sendMessage(remoteJid, {
                text: `❌ +${phoneNumber} is already in the group.`
            });
            return;
        }

        console.log(`Attempting direct invite for ${targetJid} to group ${remoteJid}`);

        // Method 1: Try sending a group invite message with media
        try {
            const inviteCode = await sock.groupInviteCode(remoteJid);
            
            // Create a more compelling invite message
            const inviteMessage = {
                conversation: `🎉 Group Invitation\n\nYou've been invited to join "${groupMetadata.subject}"\n\n👥 ${groupMetadata.participants.length} members\n\nTap to join: https://chat.whatsapp.com/${inviteCode}`
            };

            await sock.sendMessage(targetJid, { message: inviteMessage });

            await sock.sendMessage(remoteJid, {
                text: `✅ Direct group invite sent to +${phoneNumber}`
            });
            return;

        } catch (error1) {
            console.log('Direct invite method failed:', error1);
        }

        // Method 2: Try using group actions with different parameters
        try {
            console.log('Trying alternative group action...');
            
            // Create group invite link and send as contact card
            const inviteCode = await sock.groupInviteCode(remoteJid);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            
            // Send as a contact vCard with the link
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${groupMetadata.subject}\nORG:WhatsApp Group\nTEL;type=CELL:+${phoneNumber}\nURL:${inviteLink}\nNOTE:Tap to join group: ${groupMetadata.subject}\nEND:VCARD`;
            
            await sock.sendMessage(targetJid, {
                contacts: {
                    displayName: groupMetadata.subject,
                    contacts: [{
                        vcard: vcard
                    }]
                }
            });

            await sock.sendMessage(remoteJid, {
                text: `✅ Group contact card sent to +${phoneNumber}`
            });
            return;

        } catch (error2) {
            console.log('Contact card method failed:', error2);
        }

        // Method 3: Force join using different approach
        try {
            console.log('Trying force join method...');
            
            // Try to add with 'promote' action first, then demote
            await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'add');
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Force join attempted for +${phoneNumber}`
            });

        } catch (error3) {
            console.log('Force join failed:', error3);
            
            await sock.sendMessage(remoteJid, {
                text: `❌ All direct invite methods failed for +${phoneNumber}.\n\nThe user may need to:\n• Check their privacy settings\n• Accept the invitation manually\n• Use the group link: .grouplink`
            });
        }

    } catch (error) {
        console.error('Error in directinvite command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while sending direct invite.'
        });
    }
}

module.exports = { execute };