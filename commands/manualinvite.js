const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');

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

        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ This command can only be used in groups.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please provide a phone number.\n\nUsage: .manualinvite 628123456789'
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
            text: `🔄 Starting manual invite process for +${phoneNumber}...`
        });

        // Step 1: Send a personal message first to establish connection
        try {
            await sock.sendMessage(targetJid, {
                text: `👋 Hello! This is ${config.botName}.`
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
        } catch (error) {
            console.log('Initial contact failed:', error);
        }

        // Step 2: Try to add using manual intervention
        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            
            // Create a more natural invite message
            const personalMessage = `Hi! 🙋‍♂️\n\n` +
                `I'd like to invite you to join our WhatsApp group:\n` +
                `📱 "${groupMetadata.subject}"\n\n` +
                `We currently have ${groupMetadata.participants.length} members and would love to have you join us!\n\n` +
                `Would you like to join? I can send you the group link.`;

            await sock.sendMessage(targetJid, {
                text: personalMessage
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Send the group link
            const inviteCode = await sock.groupInviteCode(remoteJid);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            
            await sock.sendMessage(targetJid, {
                text: `Here's the group link:\n${inviteLink}\n\nJust tap on it to join! 😊`
            });

            await sock.sendMessage(remoteJid, {
                text: `✅ Personal invitation sent to +${phoneNumber}\n📩 They received a friendly message with the group link.`
            });

        } catch (error) {
            console.error('Manual invite failed:', error);
            await sock.sendMessage(remoteJid, {
                text: `❌ Manual invite failed for +${phoneNumber}. They may have blocked unknown contacts.`
            });
        }

        // Step 3: Try low-level WhatsApp protocol manipulation
        try {
            console.log('Attempting protocol-level add...');
            
            // Use raw protocol commands
            const addCommand = {
                tag: 'iq',
                attrs: {
                    id: Date.now().toString(),
                    type: 'set',
                    to: remoteJid
                },
                content: [{
                    tag: 'add',
                    attrs: {},
                    content: [{
                        tag: 'participant',
                        attrs: { jid: targetJid }
                    }]
                }]
            };

            // This is a more direct approach but may not work with current Baileys version
            // await sock.query(addCommand);
            
        } catch (protocolError) {
            console.log('Protocol-level add not available:', protocolError);
        }

    } catch (error) {
        console.error('Error in manualinvite command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred during manual invite process.'
        });
    }
}

module.exports = { execute };