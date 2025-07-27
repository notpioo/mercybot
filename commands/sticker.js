const config = require('../config/config');
const { createSticker, downloadMedia, isImageMessage, getImageMessage } = require('../utils/stickerUtils');

const stickerCommand = async (sock, from, sender, args, message) => {
    try {
        // Check if it's a reply to an image message
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let targetMessage = null;

        if (quotedMessage) {
            // It's a reply - check if quoted message has image
            if (quotedMessage.imageMessage || 
                quotedMessage.viewOnceMessage?.message?.imageMessage ||
                quotedMessage.ephemeralMessage?.message?.imageMessage) {
                
                // Create a message object for the quoted content
                targetMessage = {
                    message: quotedMessage,
                    key: message.message.extendedTextMessage.contextInfo.participant 
                        ? { participant: message.message.extendedTextMessage.contextInfo.participant }
                        : { remoteJid: from }
                };
            }
        } else {
            // Check if current message has image
            if (isImageMessage(message)) {
                targetMessage = message;
            }
        }

        // If no image found
        if (!targetMessage) {
            await sock.sendMessage(from, {
                text: '❌ Penggunaan salah!\n\n' +
                      '📝 Cara Penggunaan:\n' +
                      '• Reply ke gambar: .s / .sticker\n' +
                      '• Kirim gambar: .s / .sticker \n' 
            });
            return false;
        }

        // Send processing message
        await sock.sendMessage(from, {
            text: '⏳ Sedang membuat sticker... Tunggu bentar yaa!'
        });

        try {
            // Download the image
            console.log('📥 Downloading image for sticker conversion...');
            const imageBuffer = await downloadMedia(targetMessage);
            
            if (!imageBuffer) {
                throw new Error('Failed to download image');
            }

            console.log('🎨 Converting image to sticker...');
            // Create sticker
            const stickerBuffer = await createSticker(
                imageBuffer, 
                config.sticker.pack, 
                config.sticker.author
            );

            // Send sticker 
            console.log('📤 Sending sticker...');
            await sock.sendMessage(from, {
                sticker: stickerBuffer
            });

            console.log('✅ Sticker sent successfully');
            
        } catch (conversionError) {
            console.error('❌ Sticker conversion error:', conversionError.message);
            
            await sock.sendMessage(from, {
                text: '❌ Failed to create sticker. Please make sure:\n' +
                      '• The image is valid (JPG, PNG, WebP)\n' +
                      '• The image is not corrupted\n' +
                      '• Try with a different image'
            });
            return false;
        }

        return true;

    } catch (error) {
        console.error('❌ Sticker command error:', error.message);
        
        await sock.sendMessage(from, {
            text: '❌ An error occurred while processing the sticker. Please try again later.'
        });
        
        return false;
    }
};

module.exports = {
    name: 'sticker',
    aliases: ['s'],
    description: 'Convert image to sticker (1 limit)',
    usage: '.s/.sticker (reply to image or send with image)',
    category: 'media',
    requiresLimit: true,
    limitCost: 1,
    execute: stickerCommand
};