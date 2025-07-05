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

        // Only owners can use this command
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only bot owners can use this command.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please provide a phone number.\n\nUsage: .forceadd 628123456789'
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

        await sock.sendMessage(remoteJid, {
            text: `🔄 Attempting force add for +${phoneNumber}...`
        });

        // Method 1: Try standard add first
        try {
            console.log('Trying force add method 1: Standard add');
            const result1 = await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'add');
            console.log('Method 1 result:', result1);
            
            if (result1 && result1[0] && result1[0].status === '200') {
                await sock.sendMessage(remoteJid, {
                    text: `✅ Successfully added +${phoneNumber} using method 1.`
                });
                return;
            }
        } catch (error1) {
            console.log('Method 1 failed:', error1);
        }

        // Method 2: Try sending invite message
        try {
            console.log('Trying force add method 2: Direct invite message');
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const inviteCode = await sock.groupInviteCode(remoteJid);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            
            await sock.sendMessage(targetJid, {
                text: `🎉 *Group Invitation*\n\n` +
                      `You've been invited to join:\n` +
                      `📱 *${groupMetadata.subject}*\n` +
                      `👥 ${groupMetadata.participants.length} members\n\n` +
                      `🔗 Join link: ${inviteLink}\n\n` +
                      `Click the link above to join the group!`
            });
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Invite sent directly to +${phoneNumber} via private message.`
            });
            return;
            
        } catch (error2) {
            console.log('Method 2 failed:', error2);
        }

        // Method 3: Try using different participant update methods
        try {
            console.log('Trying force add method 3: Alternative update method');
            
            // Try with different action types
            const actions = ['add', 'invite'];
            
            for (const action of actions) {
                try {
                    const result = await sock.groupParticipantsUpdate(remoteJid, [targetJid], action);
                    console.log(`Method 3 (${action}) result:`, result);
                    
                    if (result && result[0] && result[0].status === '200') {
                        await sock.sendMessage(remoteJid, {
                            text: `✅ Successfully added +${phoneNumber} using method 3 (${action}).`
                        });
                        return;
                    }
                } catch (actionError) {
                    console.log(`Method 3 (${action}) failed:`, actionError);
                }
            }
        } catch (error3) {
            console.log('Method 3 failed:', error3);
        }

        // If all methods failed
        await sock.sendMessage(remoteJid, {
            text: `❌ All force add methods failed for +${phoneNumber}.\n\n` +
                  `This could be due to:\n` +
                  `• User's strict privacy settings\n` +
                  `• User has blocked the bot\n` +
                  `• WhatsApp limitations\n` +
                  `• Network issues\n\n` +
                  `Try asking them to join manually using .grouplink`
        });

    } catch (error) {
        console.error('Error in forceadd command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred during force add attempt.'
        });
    }
}

module.exports = { execute };