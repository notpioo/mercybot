const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { handleMessage } = require('./messageHandler');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

// Import web server functions
let webServerFunctions = null;
try {
    webServerFunctions = require('../web-server');
} catch (error) {
    console.log('📱 Web server not available, using terminal QR only');
}

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
                console.log('📱 QR Code received for WhatsApp login');
                
                // Generate QR for terminal (fallback)
                console.log('═══════════════════════════════════════');
                qrcode.generate(qr, { small: true });
                console.log('═══════════════════════════════════════');
                
                // Generate QR for web interface
                if (webServerFunctions) {
                    try {
                        QRCode.toDataURL(qr, { width: 300, margin: 2 }, (err, url) => {
                            if (!err) {
                                // Extract base64 data
                                const base64Data = url.split(',')[1];
                                webServerFunctions.updateQRCode(base64Data);
                                console.log('🌐 QR Code updated for web interface');
                            }
                        });
                    } catch (error) {
                        console.log('❌ Failed to generate web QR code:', error.message);
                    }
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log('🔄 Connection closed, reconnecting...');
                    setTimeout(() => startWhatsApp(), 5000);
                } else {
                    console.log('❌ Connection closed. You are logged out.');
                    console.log('🌐 Web dashboard still available for QR scan');
                    // Don't exit, keep web server running for new QR scan
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connected successfully!');
                console.log('🤖 Bot is now active and ready to receive messages.');
                
                // Clear QR code from web interface
                if (webServerFunctions) {
                    webServerFunctions.clearQRCode();
                    // Initialize authentication system with socket
                    webServerFunctions.initializeAuthSystem(sock);
                }
                
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
