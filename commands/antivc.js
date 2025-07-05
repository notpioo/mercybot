const config = require('../config/config');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { getGroup } = require('../lib/database');
const fs = require('fs');
const path = require('path');

// Function to extract view once content from message
function extractViewOnceContent(message) {
    let viewOnceMessage = null;
    let mediaType = null;
    let caption = null;

    // Check different view once message formats
    if (message.viewOnceMessageV2?.message) {
        viewOnceMessage = message.viewOnceMessageV2.message;
        console.log('📱 Found viewOnceMessageV2 format');
    } else if (message.viewOnceMessage?.message) {
        viewOnceMessage = message.viewOnceMessage.message;
        console.log('📱 Found viewOnceMessage format');
    } else if (message.ephemeralMessage?.message) {
        viewOnceMessage = message.ephemeralMessage.message;
        console.log('📱 Found ephemeralMessage format');
    } else if (message.imageMessage?.viewOnce) {
        viewOnceMessage = { imageMessage: message.imageMessage };
        console.log('📱 Found imageMessage.viewOnce format');
    } else if (message.videoMessage?.viewOnce) {
        viewOnceMessage = { videoMessage: message.videoMessage };
        console.log('📱 Found videoMessage.viewOnce format');
    } else if (message.audioMessage?.viewOnce) {
        viewOnceMessage = { audioMessage: message.audioMessage };
        console.log('📱 Found audioMessage.viewOnce format');
    }

    if (!viewOnceMessage) {
        return null;
    }

    // Determine media type and caption
    if (viewOnceMessage.imageMessage) {
        mediaType = 'image';
        caption = viewOnceMessage.imageMessage.caption;
    } else if (viewOnceMessage.videoMessage) {
        mediaType = 'video';
        caption = viewOnceMessage.videoMessage.caption;
    } else if (viewOnceMessage.audioMessage) {
        mediaType = 'audio';
        caption = viewOnceMessage.audioMessage.caption;
    }

    return mediaType ? { mediaType, caption, viewOnceMessage } : null;
}

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;
    
    // Handle antivc on/off commands
    if (args[0] === 'on' || args[0] === 'off') {
        return await handleAntivcToggle(context);
    }

    try {
        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Command ini hanya dapat digunakan dalam grup.'
            });
            return;
        }

        // Check if message is replying to another message
        if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Silakan reply pesan view once yang ingin dikirim ulang dengan command .antivc'
            });
            return;
        }

        const quotedMessage = message.message.extendedTextMessage.contextInfo.quotedMessage;
        const quotedMessageId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const quotedSender = message.message.extendedTextMessage.contextInfo.participant;

        console.log(`🔍 Trying to reveal view once from quoted message`);
        console.log(`📝 Quoted message keys:`, Object.keys(quotedMessage));

        // Check if quoted message contains view once media
        let mediaMessage = null;
        let mediaType = '';
        let caption = '';

        // Check different view once formats
        if (quotedMessage.imageMessage?.viewOnce) {
            mediaMessage = quotedMessage.imageMessage;
            mediaType = 'image';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.videoMessage?.viewOnce) {
            mediaMessage = quotedMessage.videoMessage;
            mediaType = 'video';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.audioMessage?.viewOnce) {
            mediaMessage = quotedMessage.audioMessage;
            mediaType = 'audio';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.viewOnceMessage?.message?.imageMessage) {
            mediaMessage = quotedMessage.viewOnceMessage.message.imageMessage;
            mediaType = 'image';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.viewOnceMessage?.message?.videoMessage) {
            mediaMessage = quotedMessage.viewOnceMessage.message.videoMessage;
            mediaType = 'video';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.viewOnceMessage?.message?.audioMessage) {
            mediaMessage = quotedMessage.viewOnceMessage.message.audioMessage;
            mediaType = 'audio';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.viewOnceMessageV2?.message?.imageMessage) {
            mediaMessage = quotedMessage.viewOnceMessageV2.message.imageMessage;
            mediaType = 'image';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.viewOnceMessageV2?.message?.videoMessage) {
            mediaMessage = quotedMessage.viewOnceMessageV2.message.videoMessage;
            mediaType = 'video';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.viewOnceMessageV2?.message?.audioMessage) {
            mediaMessage = quotedMessage.viewOnceMessageV2.message.audioMessage;
            mediaType = 'audio';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.ephemeralMessage?.message?.imageMessage?.viewOnce) {
            mediaMessage = quotedMessage.ephemeralMessage.message.imageMessage;
            mediaType = 'image';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.ephemeralMessage?.message?.videoMessage?.viewOnce) {
            mediaMessage = quotedMessage.ephemeralMessage.message.videoMessage;
            mediaType = 'video';
            caption = mediaMessage.caption || '';
        } else if (quotedMessage.ephemeralMessage?.message?.audioMessage?.viewOnce) {
            mediaMessage = quotedMessage.ephemeralMessage.message.audioMessage;
            mediaType = 'audio';
            caption = mediaMessage.caption || '';
        }

        if (!mediaMessage) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Pesan yang di-reply bukan view once atau sudah tidak dapat diakses.'
            });
            return;
        }

        try {
            console.log(`📥 Downloading ${mediaType} from view once message...`);
            
            // Create a fake message object for download
            const fakeMessage = {
                key: {
                    remoteJid: remoteJid,
                    id: quotedMessageId,
                    participant: quotedSender
                },
                message: quotedMessage
            };

            // Download the media using Baileys downloadMediaMessage function
            const mediaBuffer = await downloadMediaMessage(fakeMessage, 'buffer', {});
            
            // Create downloads directory if it doesn't exist
            const downloadsDir = path.join(process.cwd(), 'downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }
            
            // Save to local file for security
            const timestamp = Date.now();
            const fileExtension = mediaType === 'image' ? 'jpg' : (mediaType === 'video' ? 'mp4' : 'mp3');
            const filename = `viewonce_${timestamp}.${fileExtension}`;
            const filepath = path.join(downloadsDir, filename);
            
            fs.writeFileSync(filepath, mediaBuffer);
            console.log(`💾 Media saved locally: ${filename}`);
            
            console.log(`📤 Resending ${mediaType} without view once...`);
            
            // Create message without view once
            const resendMessage = {
                [`${mediaType}`]: mediaBuffer,
                caption: `🔄 *VIEW ONCE REVEALED*\n\n` +
                        `👤 Original sender: @${quotedSender.split('@')[0]}\n` +
                        `📝 Original caption: ${caption || 'Tidak ada caption'}\n\n` +
                        `⚠️ Pesan view once telah dikirim ulang oleh bot atas permintaan @${user.jid.split('@')[0]}\n` +
                        `💾 File disimpan sebagai: ${filename}`,
                mentions: [quotedSender, user.jid]
            };

            // Send the media without view once
            await sock.sendMessage(remoteJid, resendMessage);

            console.log(`✅ Successfully revealed ${mediaType} view once requested by ${senderName}`);
            console.log(`💾 File saved as: ${filename}`);

        } catch (downloadError) {
            console.error('❌ Failed to download or resend view once media:', downloadError);
            
            await sock.sendMessage(remoteJid, {
                text: `❌ Gagal mengunduh atau mengirim ulang media view once.\n\nKemungkinan penyebab:\n• View once sudah kedaluwarsa\n• Media tidak dapat diakses\n• Error jaringan\n\nError: ${downloadError.message}`
            });
        }

    } catch (error) {
        console.error('Error in antivc command:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

async function handleAntivcToggle(context) {
    const { sock, remoteJid, user, senderName, args } = context;
    
    // Check if user is admin or owner
    if (!user.isOwner && !user.isAdmin) {
        await sock.sendMessage(remoteJid, {
            text: `❌ *Permission Denied*\n\nOnly group admins and bot owners can toggle auto anti-view-once.\n\nYou can still use manual mode by replying to view once messages with .antivc`
        });
        return;
    }
    
    // Check if this is a group
    if (!remoteJid.endsWith('@g.us')) {
        await sock.sendMessage(remoteJid, {
            text: `❌ *Group Only Feature*\n\nAuto anti-view-once can only be used in groups.\n\nUse manual mode by replying to view once messages with .antivc`
        });
        return;
    }
    
    try {
        const group = await getGroup(remoteJid);
        const isEnabled = args[0] === 'on';
        
        // Update group settings
        group.settings.antiViewOnce = isEnabled;
        await group.save();
        
        console.log(`💾 Saved antiViewOnce setting: ${isEnabled} for group ${remoteJid}`);
        
        const status = isEnabled ? 'ENABLED' : 'DISABLED';
        const emoji = isEnabled ? '🟢' : '🔴';
        
        await sock.sendMessage(remoteJid, {
            text: `${emoji} *Anti-View-Once ${status}*\n\n` +
                  `${isEnabled ? 
                    '✅ Auto mode is now ON\n' +
                    '📱 All view once messages will be automatically revealed\n' +
                    '💾 Media will be saved locally for security\n\n' +
                    '💡 To disable: .antivc off' 
                    : 
                    '❌ Auto mode is now OFF\n' +
                    '📱 View once messages will not be automatically revealed\n' +
                    '💡 You can still use manual mode by replying with .antivc\n\n' +
                    '💡 To enable: .antivc on'
                  }\n\n` +
                  `⚙️ Changed by: @${user.jid.split('@')[0]}`,
            mentions: [user.jid]
        });
        
        console.log(`🔧 Anti-view-once ${status} for group ${remoteJid} by ${senderName}`);
        
    } catch (error) {
        console.error('❌ Error toggling anti-view-once:', error);
        await sock.sendMessage(remoteJid, {
            text: `❌ *Error*\n\nFailed to toggle anti-view-once settings.\n\nError: ${error.message}`
        });
    }
}

// Function to automatically handle view once messages
async function handleAutoAntiViewOnce(sock, message, remoteJid, senderJid, senderName) {
    try {
        // Check if this is a group and auto anti-view-once is enabled
        if (!remoteJid.endsWith('@g.us')) {
            return false; // Only work in groups
        }
        
        const group = await getGroup(remoteJid);
        if (!group.antiViewOnce) {
            return false; // Auto mode is disabled
        }
        
        // Check if message contains view once content
        const viewOnceContent = extractViewOnceContent(message);
        if (!viewOnceContent) {
            return false; // No view once content found
        }
        
        const { mediaType, caption } = viewOnceContent;
        
        console.log(`🔄 Auto-revealing ${mediaType} view once from ${senderName}`);
        
        // Create a fake message object for download
        const fakeMessage = {
            key: {
                remoteJid: remoteJid,
                id: message.key.id,
                participant: senderJid
            },
            message: message.message
        };
        
        // Download the media using Baileys downloadMediaMessage function
        const mediaBuffer = await downloadMediaMessage(fakeMessage, 'buffer', {});
        
        // Create downloads directory if it doesn't exist
        const downloadsDir = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        
        // Save to local file for security
        const timestamp = Date.now();
        const fileExtension = mediaType === 'image' ? 'jpg' : (mediaType === 'video' ? 'mp4' : 'mp3');
        const filename = `auto_viewonce_${timestamp}.${fileExtension}`;
        const filepath = path.join(downloadsDir, filename);
        
        fs.writeFileSync(filepath, mediaBuffer);
        console.log(`💾 Auto-saved media: ${filename}`);
        
        // Create message without view once
        const resendMessage = {
            [`${mediaType}`]: mediaBuffer,
            caption: `🤖 *AUTO VIEW ONCE REVEALED*\n\n` +
                    `👤 Original sender: @${senderJid.split('@')[0]}\n` +
                    `📝 Original caption: ${caption || 'Tidak ada caption'}\n\n` +
                    `⚡ Automatically revealed by bot\n` +
                    `💾 File saved as: ${filename}`,
            mentions: [senderJid]
        };
        
        // Send the media without view once
        await sock.sendMessage(remoteJid, resendMessage);
        
        console.log(`✅ Auto-revealed ${mediaType} view once from ${senderName}`);
        console.log(`💾 File saved as: ${filename}`);
        
        return true; // Successfully processed
        
    } catch (error) {
        console.error('❌ Error in auto anti-view-once:', error);
        return false;
    }
}

module.exports = {
    execute,
    handleAutoAntiViewOnce,
    description: 'Reveal view once messages manually (.antivc) or automatically (.antivc on/off)'
};