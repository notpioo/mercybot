
const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName, isGroup } = context;

    try {
        // Only work in groups
        if (!isGroup) {
            await sock.sendMessage(remoteJid, {
                text: '❌ This command can only be used in groups.'
            });
            return;
        }

        // Check if user is owner or admin
        if (!user.isOwner) {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const isAdmin = groupMetadata.participants.find(p => 
                p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isAdmin) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Only owners or group admins can change group profile picture.'
                });
                return;
            }
        }

        // Check if bot is admin
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.jid?.split('@')[0] || sock.user?.number;
        const isBotAdmin = groupMetadata.participants.find(p => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === botNumber && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        if (!isBotAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Bot needs to be admin to change group profile picture.'
            });
            return;
        }

        let imageMessage = null;

        // Check if it's a reply to an image
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.imageMessage) {
                imageMessage = quoted.imageMessage;
            }
        }
        // Check if current message has an image
        else if (message.message?.imageMessage) {
            imageMessage = message.message.imageMessage;
        }

        if (!imageMessage) {
            await sock.sendMessage(remoteJid, {
                text: `❌ Usage: Send an image with caption ${config.prefixes[0]}setppgrup or reply to an image with ${config.prefixes[0]}setppgrup`
            });
            return;
        }

        try {
            await sock.sendMessage(remoteJid, {
                text: '⏳ Processing image and updating group profile picture...'
            });

            // Download the image
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.alloc(0);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Update group profile picture
            await sock.updateProfilePicture(remoteJid, buffer);
            
            await sock.sendMessage(remoteJid, {
                text: `✅ *Group Profile Picture Updated*\n\n` +
                      `👤 Updated by: ${senderName}\n` +
                      `📷 New profile picture has been set\n` +
                      `⏰ Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            });

            console.log(`📷 Group profile picture updated by ${senderName} in group ${groupMetadata.subject}`);

        } catch (updateError) {
            console.error('Failed to update group profile picture:', updateError);
            
            let errorMessage = '❌ Failed to update group profile picture.';
            if (updateError.output?.statusCode === 400) {
                errorMessage = '❌ Invalid image format. Please use JPG or PNG image.';
            } else if (updateError.output?.statusCode === 403) {
                errorMessage = '❌ Bot does not have permission to change group profile picture.';
            }
            
            await sock.sendMessage(remoteJid, {
                text: errorMessage
            });
        }

    } catch (error) {
        console.error('❌ Failed to execute setppgrup command:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
