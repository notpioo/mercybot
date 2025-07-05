const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./messageHandler');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

let sock;

async function startWhatsApp() {
    try {
        // Ensure sessions directory exists
        const sessionDir = path.join(process.cwd(), config.sessionPath);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
        
        // Create WhatsApp socket
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: require('pino')({ level: 'silent' }),
            browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
            generateHighQualityLinkPreview: true,
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 Scan QR Code to login:');
                console.log('═══════════════════════════════════════');
                qrcode.generate(qr, { small: true });
                console.log('═══════════════════════════════════════');
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log('🔄 Connection closed, reconnecting...');
                    setTimeout(() => startWhatsApp(), 5000);
                } else {
                    console.log('❌ Connection closed. You are logged out.');
                    process.exit(0);
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connected successfully!');
                console.log('🤖 Bot is now active and ready to receive messages.');
                
                // Get bot info
                const botInfo = sock.user;
                console.log('📞 Bot Number:', botInfo.id.split(':')[0]);
                console.log('👤 Bot Name:', botInfo.name || 'Unknown');
                console.log('═══════════════════════════════════════');
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const message = m.messages[0];
                if (!message.key.fromMe && message.message) {
                    await handleMessage(sock, message);
                }
            } catch (error) {
                console.error('❌ Error handling message:', error);
            }
        });

        // Handle group participants update
        sock.ev.on('group-participants.update', async (update) => {
            // Handle group join/leave events if needed
            console.log('👥 Group participants updated:', update.id);
        });

        return sock;
    } catch (error) {
        console.error('❌ Failed to start WhatsApp:', error);
        throw error;
    }
}

function getSocket() {
    return sock;
}

module.exports = {
    startWhatsApp,
    getSocket
};
