const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config/config');
const mime = require('mime-types');

module.exports = {
    name: 'stiker',
    description: 'Convert gambar atau video ke sticker',
    aliases: ['sticker', 's'],
    usage: '.stiker (kirim gambar dengan caption atau reply ke gambar/video)',
    category: 'convert',
    cooldown: 5,
    
    async execute(context) {
        const { sock, message, remoteJid, senderJid, args, user } = context;
        
        try {
            console.log('📸 Stiker command executed');
            
            // Cek media dari pesan atau quoted message
            let mediaMessage = null;
            let mediaType = null;
            let quotedMessage = null;
            let isViewOnce = false;
            
            // Function untuk extract media dari berbagai format
            const extractMedia = (msg, isQuoted = false) => {
                console.log('🔍 Extracting media from:', isQuoted ? 'quoted message' : 'direct message');
                console.log('📋 Available message keys:', Object.keys(msg));
                
                // Cek image message biasa
                if (msg.imageMessage) {
                    console.log('📷 Found image message');
                    return { message: msg.imageMessage, type: 'image' };
                }
                
                // Cek video message biasa
                if (msg.videoMessage) {
                    console.log('🎥 Found video message');
                    return { message: msg.videoMessage, type: 'video' };
                }
                
                // Cek view once message dengan berbagai struktur
                if (msg.viewOnceMessage) {
                    console.log('👁️ Found viewOnceMessage');
                    isViewOnce = true;
                    const viewOnceContent = msg.viewOnceMessage.message;
                    console.log('👁️ View once content keys:', Object.keys(viewOnceContent));
                    
                    if (viewOnceContent.imageMessage) {
                        console.log('📷 View once contains image');
                        return { message: viewOnceContent.imageMessage, type: 'image' };
                    }
                    
                    if (viewOnceContent.videoMessage) {
                        console.log('🎥 View once contains video');
                        return { message: viewOnceContent.videoMessage, type: 'video' };
                    }
                }
                
                // Cek viewOnceMessageV2 (format baru)
                if (msg.viewOnceMessageV2) {
                    console.log('👁️ Found viewOnceMessageV2');
                    isViewOnce = true;
                    const viewOnceContent = msg.viewOnceMessageV2.message;
                    console.log('👁️ View once V2 content keys:', Object.keys(viewOnceContent));
                    
                    if (viewOnceContent.imageMessage) {
                        console.log('📷 View once V2 contains image');
                        return { message: viewOnceContent.imageMessage, type: 'image' };
                    }
                    
                    if (viewOnceContent.videoMessage) {
                        console.log('🎥 View once V2 contains video');
                        return { message: viewOnceContent.videoMessage, type: 'video' };
                    }
                }
                
                // Cek ephemeral message (alternative view once format)
                if (msg.ephemeralMessage) {
                    console.log('⏳ Found ephemeral message');
                    return extractMedia(msg.ephemeralMessage.message, isQuoted);
                }
                
                // Cek documentMessage dengan view once
                if (msg.documentMessage && msg.documentMessage.contextInfo?.isForwarded) {
                    console.log('📄 Found forwarded document (possible view once)');
                    return { message: msg.documentMessage, type: 'document' };
                }
                
                console.log('❌ No media found in message');
                console.log('📋 Full message structure:', JSON.stringify(msg, null, 2));
                return null;
            };
            
            // Cek apakah ada quoted message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                console.log('📋 Processing quoted message');
                console.log('🔍 Full quoted message structure:', JSON.stringify(message.message.extendedTextMessage.contextInfo.quotedMessage, null, 2));
                
                quotedMessage = {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: message.message.extendedTextMessage.contextInfo.quotedMessage
                };
                
                const extractedMedia = extractMedia(quotedMessage.message, true);
                if (extractedMedia) {
                    mediaMessage = extractedMedia.message;
                    mediaType = extractedMedia.type;
                }
            }
            // Cek media langsung di pesan saat ini
            else {
                console.log('📋 Processing direct message');
                const extractedMedia = extractMedia(message.message);
                if (extractedMedia) {
                    mediaMessage = extractedMedia.message;
                    mediaType = extractedMedia.type;
                }
            }
            
            if (!mediaMessage) {
                console.log('❌ No media message found');
                return await sock.sendMessage(remoteJid, {
                    text: config.messages.stickerNoMedia
                });
            }
            
            console.log('✅ Media found:', mediaType, isViewOnce ? '(view once)' : '(regular)');
            console.log('📊 Media info:', {
                mimetype: mediaMessage.mimetype,
                fileLength: mediaMessage.fileLength,
                url: mediaMessage.url ? 'present' : 'missing'
            });
            
            // Cek ukuran file (max dari config)
            const fileSize = mediaMessage.fileLength || 0;
            if (fileSize > config.sticker.maxSize) {
                return await sock.sendMessage(remoteJid, {
                    text: config.messages.stickerFileTooLarge.replace('{maxSize}', config.sticker.maxSize / (1024 * 1024))
                });
            }
            
            await sock.sendMessage(remoteJid, {
                text: config.messages.stickerProcessing
            });
            
            // Download media
            let messageToDownload;
            if (quotedMessage) {
                // Jika dari quoted message
                messageToDownload = quotedMessage;
            } else {
                // Jika dari pesan langsung
                messageToDownload = { 
                    key: message.key,
                    message: message.message 
                };
            }
            
            console.log('⬇️ Downloading media...');
            const buffer = await downloadMediaMessage(messageToDownload, 'buffer', {});
            console.log('✅ Download complete, buffer size:', buffer ? buffer.length : 0);
            
            if (!buffer) {
                console.log('❌ Download failed');
                return await sock.sendMessage(remoteJid, {
                    text: config.messages.stickerDownloadFailed
                });
            }
            
            // Generate filename untuk ID unik
            const timestamp = Date.now();
            
            console.log('🎨 Creating sticker...');
            
            // Buat sticker dengan wa-sticker-formatter untuk metadata yang benar
            const sticker = new Sticker(buffer, {
                pack: config.sticker.packName,
                author: config.sticker.authorName,
                type: mediaType === 'video' ? StickerTypes.FULL : StickerTypes.FULL,
                categories: ['🤖', '⚡'], // Bot dan lightning emoji untuk NoMercy
                id: `nomercy_${timestamp}`,
                quality: config.sticker.quality,
                background: 'transparent'
            });
            
            // Convert ke message format untuk Baileys
            console.log('📤 Converting to message format...');
            const stickerMessage = await sticker.toMessage();
            
            // Kirim sticker dengan metadata yang benar
            console.log('📨 Sending sticker...');
            await sock.sendMessage(remoteJid, stickerMessage);
            
            console.log('✅ Sticker sent successfully!');
            
        } catch (error) {
            console.error('Error creating sticker:', error);
            await sock.sendMessage(remoteJid, {
                text: config.messages.stickerCreateFailed
            });
        }
    }
};