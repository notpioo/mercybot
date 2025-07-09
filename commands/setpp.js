
const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName, isGroup } = context;

    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only bot owners can change bot profile picture.'
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
                text: `❌ Usage: Send an image with caption ${config.prefixes[0]}setpp or reply to an image with ${config.prefixes[0]}setpp`
            });
            return;
        }

        try {
            await sock.sendMessage(remoteJid, {
                text: '⏳ Processing image and updating bot profile picture...'
            });

            // Download the image
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.alloc(0);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Get bot's own JID
            const botJid = sock.user?.id || sock.authState?.creds?.me?.id;
            if (!botJid) {
                throw new Error('Cannot get bot JID');
            }

            // Update bot profile picture
            await sock.updateProfilePicture(botJid, buffer);
            
            await sock.sendMessage(remoteJid, {
                text: `✅ *Bot Profile Picture Updated*\n\n` +
                      `👤 Updated by: ${senderName}\n` +
                      `🤖 Bot profile picture has been changed\n` +
                      `⏰ Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            });

            console.log(`🤖 Bot profile picture updated by ${senderName}`);

        } catch (updateError) {
            console.error('Failed to update bot profile picture:', updateError);
            
            let errorMessage = '❌ Failed to update bot profile picture.';
            if (updateError.output?.statusCode === 400) {
                errorMessage = '❌ Invalid image format. Please use JPG or PNG image.';
            } else if (updateError.message?.includes('rate-limit')) {
                errorMessage = '❌ Rate limited. Please wait before updating profile picture again.';
            }
            
            await sock.sendMessage(remoteJid, {
                text: errorMessage
            });
        }

    } catch (error) {
        console.error('❌ Failed to execute setpp command:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
