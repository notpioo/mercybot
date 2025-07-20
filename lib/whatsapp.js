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

        // Check if we need to clear sessions due to Railway deployment issues
        const railwayEnv = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
        if (railwayEnv) {
            console.log('🚂 Railway environment detected - using optimized session handling');
        }

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
        
        // Create WhatsApp socket with Railway-optimized settings
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false, // Disabled for production
            logger: require('pino')({ level: 'silent' }),
            browser: ['Railway WhatsApp Bot', 'Desktop', '1.0.0'],
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            // Enhanced settings for Railway deployment
            qrTimeout: 40000,
            retryRequestDelayMs: 1000,
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 QR Code received for WhatsApp login');
                console.log('🌐 QR Code akan ditampilkan di web dashboard');
                
                // Generate QR for terminal (fallback for local development)
                if (process.env.NODE_ENV !== 'production') {
                    console.log('═══════════════════════════════════════');
                    qrcode.generate(qr, { small: true });
                    console.log('═══════════════════════════════════════');
                }
                
                // Generate QR for web interface with enhanced options
                if (webServerFunctions) {
                    try {
                        // Generate ultra high quality QR code for Railway deployment
                        QRCode.toDataURL(qr, { 
                            width: 512, 
                            margin: 6,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            },
                            errorCorrectionLevel: 'H',
                            type: 'image/png',
                            quality: 1.0,
                            rendererOpts: {
                                quality: 1.0
                            }
                        }, (err, url) => {
                            if (!err) {
                                // Extract base64 data
                                const base64Data = url.split(',')[1];
                                webServerFunctions.updateQRCode(base64Data);
                                console.log('🌐 QR Code updated for web interface');
                                console.log('🌐 Buka web dashboard untuk scan QR code');
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
                    // Clear QR code and mark as disconnected
                    if (webServerFunctions) {
                        webServerFunctions.clearQRCode();
                        webServerFunctions.setConnectionStatus(false);
                    }
                    setTimeout(() => startWhatsApp(), 3000);
                } else {
                    console.log('❌ Connection closed. You are logged out.');
                    console.log('🌐 Web dashboard masih tersedia untuk scan QR code baru');
                    console.log('🧹 Clearing sessions for fresh authentication...');
                    
                    // Clear sessions for Railway deployment compatibility
                    const { clearAllSessions } = require('../scripts/clearSessions');
                    clearAllSessions();
                    
                    // Clear QR code and prepare for new QR scan
                    if (webServerFunctions) {
                        webServerFunctions.clearQRCode();
                        webServerFunctions.setConnectionStatus(false);
                    }
                    // Auto restart for new QR code generation with fresh session
                    setTimeout(() => startWhatsApp(), 8000);
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connected successfully!');
                console.log('🤖 Bot is now active and ready to receive messages.');
                
                // Clear QR code from web interface and mark as connected
                if (webServerFunctions) {
                    webServerFunctions.clearQRCode();
                    webServerFunctions.setConnectionStatus(true);
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
