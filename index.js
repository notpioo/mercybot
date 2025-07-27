const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const config = require('./config/config');
const connectDB = require('./database/connection');
const commandHandler = require('./handlers/commandHandler');
const { createUser, getUser } = require('./utils/userUtils');

// Import setBotInstance and setQRCode from server if running both
let setBotInstance, setQRCode;
try {
    const serverModule = require('./server');
    setBotInstance = serverModule.setBotInstance;
    setQRCode = serverModule.setQRCode;
} catch (error) {
    // Server not loaded, that's okay
    setBotInstance = null;
    setQRCode = null;
}

class SeanaBot {
    constructor() {
        this.sock = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            console.log('🚀 Starting Seana Bot...');
            
            // Connect to MongoDB
            await connectDB();
            
            // Initialize WhatsApp connection
            await this.connectWhatsApp();
            
        } catch (error) {
            console.error('❌ Failed to initialize bot:', error.message);
            process.exit(1);
        }
    }

    async connectWhatsApp() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
            
            this.sock = makeWASocket({
                auth: state,
                browser: ['Seana Bot', 'Chrome', '1.0.0']
            });

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('📱 Scan QR Code to connect WhatsApp:');
                    qrcode.generate(qr, { small: true });
                    
                    // Store QR code for web display
                    if (setQRCode) {
                        setQRCode(qr);
                    }
                }
                
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('❌ Connection closed due to:', lastDisconnect?.error);
                    
                    if (shouldReconnect) {
                        console.log('🔄 Reconnecting...');
                        setTimeout(() => this.connectWhatsApp(), 3000);
                    } else {
                        console.log('⚠️ Logged out. Please restart the bot.');
                        process.exit(0);
                    }
                } else if (connection === 'open') {
                    console.log('✅ WhatsApp connected successfully!');
                    console.log(`🤖 Bot Name: ${config.botName}`);
                    console.log(`👑 Owner: ${config.ownerNumber}`);
                    this.isConnected = true;
                    
                    // Clear QR code when connected
                    if (setQRCode) {
                        setQRCode(null);
                    }
                    
                    // Set bot instance for web server
                    if (setBotInstance) {
                        setBotInstance(this);
                        console.log('🔗 Bot instance connected to web server');
                        console.log('🔍 Bot instance details:', {
                            isConnected: this.isConnected,
                            hasSocket: !!this.sock,
                            socketConnected: this.sock ? 'ready' : 'not ready'
                        });
                    }
                    
                    // Test message capability
                    console.log('🧪 Bot ready to send messages');
                }
            });

            // Handle credential updates
            this.sock.ev.on('creds.update', saveCreds);

            // Handle incoming messages
            this.sock.ev.on('messages.upsert', async (messageUpdate) => {
                const { messages } = messageUpdate;
                
                for (const message of messages) {
                    if (message.key.fromMe || !message.message) continue;
                    
                    try {
                        await this.handleMessage(message);
                    } catch (error) {
                        console.error('❌ Error handling message:', error.message);
                    }
                }
            });

        } catch (error) {
            console.error('❌ WhatsApp connection error:', error.message);
            setTimeout(() => this.connectWhatsApp(), 5000);
        }
    }

    async handleMessage(message) {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;
        
        // Extract text from different message types including image captions
        let messageText = '';
        if (message.message?.conversation) {
            messageText = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            messageText = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage?.caption) {
            messageText = message.message.imageMessage.caption;
        } else if (message.message?.videoMessage?.caption) {
            messageText = message.message.videoMessage.caption;
        } else if (message.message?.documentMessage?.caption) {
            messageText = message.message.documentMessage.caption;
        }

        // Only process commands that start with '.'
        if (!messageText.startsWith('.')) return;

        const command = messageText.slice(1).split(' ')[0].toLowerCase();
        const args = messageText.slice(1).split(' ').slice(1);

        console.log(`📨 Command received: .${command} from ${sender}`);
        console.log(`📝 Message pushName: ${message.pushName || 'not available'}`);
        console.log(`📝 Message verifiedBizName: ${message.verifiedBizName || 'not available'}`);

        // Ensure user exists in database
        await createUser(sender, {}, this.sock);

        // Handle the command
        await commandHandler(this.sock, from, sender, command, args, message);
    }

    async sendMessage(jid, content) {
        if (!this.isConnected) {
            console.log('⚠️ Bot not connected yet');
            return;
        }
        
        try {
            await this.sock.sendMessage(jid, { text: content });
        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
        }
    }
}

// Initialize and start the bot
const bot = new SeanaBot();
bot.initialize();

// Also start the web server
require('./server');

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Seana Bot...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error.message);
});
