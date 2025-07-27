const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

// Convert image to sticker using wa-sticker-formatter
const createSticker = async (buffer, pack = config.sticker.pack, author = config.sticker.author) => {
    try {
        console.log(`🎨 Creating sticker with pack: ${pack}, author: ${author}`);
        
        // Create sticker using wa-sticker-formatter with proper metadata
        const sticker = new Sticker(buffer, {
            pack: pack,
            author: author,
            type: StickerTypes.FULL,
            quality: 75,
            categories: ['🤖', '💬'],
            id: `seana-bot-${Date.now()}`,
            background: 'transparent'
        });

        // Convert to WebP buffer with metadata
        const stickerBuffer = await sticker.toBuffer();
        
        console.log(`✅ Sticker created with metadata - Pack: ${pack}, Author: ${author}`);
        return stickerBuffer;
        
    } catch (error) {
        console.error('❌ Error creating sticker with wa-sticker-formatter:', error.message);
        
        // Fallback: create basic sticker without metadata
        try {
            console.log('🔄 Trying fallback method...');
            
            // Create temp directory if it doesn't exist
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempInputPath = path.join(tempDir, `input_${Date.now()}.png`);

            // Process image with sharp - resize and convert to PNG
            await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 75 })
                .toFile(tempInputPath);

            const stickerBuffer = fs.readFileSync(tempInputPath);
            
            // Clean up temp file
            try {
                fs.unlinkSync(tempInputPath);
            } catch (cleanupError) {
                console.log('⚠️ Could not clean up temp file:', cleanupError.message);
            }

            console.log('✅ Created basic sticker without metadata');
            return stickerBuffer;
            
        } catch (fallbackError) {
            console.error('❌ Fallback sticker creation failed:', fallbackError.message);
            throw new Error('Failed to create sticker. Please make sure the image is valid.');
        }
    }
};

// Download media from WhatsApp message
const downloadMedia = async (message) => {
    try {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: () => Promise.resolve()
            }
        );
        return buffer;
    } catch (error) {
        console.error('❌ Error downloading media:', error.message);
        throw new Error('Failed to download media from message.');
    }
};

// Check if message contains image
const isImageMessage = (message) => {
    return !!(
        message.message?.imageMessage ||
        message.message?.viewOnceMessage?.message?.imageMessage ||
        message.message?.ephemeralMessage?.message?.imageMessage
    );
};

// Get image message from different types
const getImageMessage = (message) => {
    if (message.message?.imageMessage) {
        return message.message.imageMessage;
    }
    if (message.message?.viewOnceMessage?.message?.imageMessage) {
        return message.message.viewOnceMessage.message.imageMessage;
    }
    if (message.message?.ephemeralMessage?.message?.imageMessage) {
        return message.message.ephemeralMessage.message.imageMessage;
    }
    return null;
};

module.exports = {
    createSticker,
    downloadMedia,
    isImageMessage,
    getImageMessage
};