
const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName, isGroup } = context;

    try {
        // Check if user is owner or admin
        if (!user.isOwner) {
            // If not owner, check if it's a group and user is admin
            if (!isGroup) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ This command can only be used by owners or group admins.'
                });
                return;
            }

            const groupMetadata = await sock.groupMetadata(remoteJid);
            const isAdmin = groupMetadata.participants.find(p => 
                p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isAdmin) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Only owners or group admins can delete messages.'
                });
                return;
            }
        }

        // Check if this is a reply to a message
        if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            await sock.sendMessage(remoteJid, {
                text: `❌ Usage: Reply to a message with ${config.prefixes[0]}del to delete it.`
            });
            return;
        }

        const quotedMessageId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant;

        if (!quotedMessageId) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Cannot find the message to delete.'
            });
            return;
        }

        try {
            // Delete the quoted message
            await sock.sendMessage(remoteJid, {
                delete: {
                    remoteJid: remoteJid,
                    fromMe: false,
                    id: quotedMessageId,
                    participant: quotedParticipant
                }
            });

            await sock.sendMessage(remoteJid, {
                text: '✅ Message deleted successfully.'
            });

            console.log(`🗑️ Message deleted by ${senderName} in ${isGroup ? 'group' : 'private chat'}`);

        } catch (deleteError) {
            console.error('Failed to delete message:', deleteError);
            await sock.sendMessage(remoteJid, {
                text: '❌ Failed to delete message. Make sure the message exists and bot has permission.'
            });
        }

    } catch (error) {
        console.error('❌ Failed to execute del command:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
