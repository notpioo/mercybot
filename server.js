
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const QRCode = require('qrcode');
const config = require('./config/config');
const { getUser, createUser } = require('./utils/userUtils');

// Global variable to store bot instance
let botInstance = null;
let currentQRCode = null;

// Function to set bot instance from index.js
const setBotInstance = (bot) => {
    botInstance = bot;
};

// Function to set current QR code
const setQRCode = (qrCode) => {
    currentQRCode = qrCode;
    console.log('🔄 QR Code updated for web display');
};

// Function to send verification code via WhatsApp
const sendVerificationCode = async (phone, code) => {
    console.log(`🔄 Attempting to send verification code to ${phone}`);
    console.log(`🔍 Bot instance exists: ${!!botInstance}`);
    console.log(`🔍 Bot connected: ${botInstance ? botInstance.isConnected : 'N/A'}`);
    console.log(`🔍 Bot socket exists: ${botInstance && botInstance.sock ? 'YES' : 'NO'}`);
    
    if (!botInstance || !botInstance.isConnected || !botInstance.sock) {
        console.log('⚠️ Bot not properly connected, cannot send verification code');
        console.log(`⚠️ Bot instance: ${!!botInstance}, isConnected: ${botInstance ? botInstance.isConnected : 'N/A'}, socket: ${botInstance && botInstance.sock ? 'exists' : 'missing'}`);
        return false;
    }
    
    try {
        const whatsappId = phone + '@s.whatsapp.net';
        const message = `🔐 *Kode Verifikasi NoMercy*\n\nKode verifikasi Anda: *${code}*\n\nMasukkan kode ini di website untuk login.\nKode berlaku selama 5 menit.\n\n_Jangan bagikan kode ini kepada siapapun!_`;
        
        console.log(`📤 Sending message to ${whatsappId}`);
        console.log(`📝 Message content: ${message}`);
        
        // Use the socket directly to send message
        await botInstance.sock.sendMessage(whatsappId, { text: message });
        console.log(`✅ Verification code successfully sent to ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send verification code:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return false;
    }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'seanabot-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Store verification codes temporarily
const verificationCodes = new Map();

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/owner', (req, res) => {
    res.render('owner');
});

app.post('/owner-auth', (req, res) => {
    const { password } = req.body;
    
    if (password === 'Faratama') {
        req.session.isOwner = true;
        res.render('qr-scanner');
    } else {
        res.render('owner', { error: 'Password salah!' });
    }
});

app.post('/verify-phone', async (req, res) => {
    const { phone } = req.body;
    
    console.log(`📞 Verification request for phone: ${phone}`);
    
    // Generate 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated verification code: ${verificationCode}`);
    
    // Store code with phone number
    verificationCodes.set(phone, {
        code: verificationCode,
        timestamp: Date.now(),
        attempts: 0
    });
    
    // Send verification code via WhatsApp bot
    console.log(`📤 Attempting to send verification code...`);
    const codeSent = await sendVerificationCode(phone, verificationCode);
    
    if (!codeSent) {
        console.log(`⚠️ Could not send code via WhatsApp, logging code for manual testing: ${verificationCode}`);
        console.log(`🔍 Please check if bot is properly connected and phone number is correct`);
    } else {
        console.log(`✅ Verification code sent successfully to ${phone}`);
    }
    
    // Auto-delete code after 5 minutes
    setTimeout(() => {
        verificationCodes.delete(phone);
        console.log(`🗑️ Verification code for ${phone} expired and deleted`);
    }, 5 * 60 * 1000);
    
    res.render('verify-code', { phone, codeSent });
});

app.post('/verify-code', async (req, res) => {
    const { phone, code } = req.body;
    
    const storedData = verificationCodes.get(phone);
    
    if (!storedData) {
        return res.render('verify-code', { 
            phone, 
            error: 'Kode verifikasi sudah kedaluwarsa. Silakan coba lagi.' 
        });
    }
    
    if (storedData.attempts >= 3) {
        verificationCodes.delete(phone);
        return res.render('login', { 
            error: 'Terlalu banyak percobaan. Silakan kirim ulang kode verifikasi.' 
        });
    }
    
    if (storedData.code === code) {
        // Code is correct
        verificationCodes.delete(phone);
        req.session.userPhone = phone;
        req.session.isAuthenticated = true;
        
        // Create or get user from database
        try {
            await createUser(phone + '@s.whatsapp.net', {});
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Error creating user:', error);
            res.render('login', { error: 'Terjadi kesalahan. Silakan coba lagi.' });
        }
    } else {
        // Incorrect code
        storedData.attempts++;
        res.render('verify-code', { 
            phone, 
            error: 'Kode verifikasi salah. Silakan coba lagi.' 
        });
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/login');
    }
    
    try {
        let userData = null;
        if (req.session.userPhone) {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        }
        
        res.render('dashboard', { 
            isOwner: req.session.isOwner,
            userData: userData,
            phone: req.session.userPhone
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.render('dashboard', { 
            isOwner: req.session.isOwner,
            userData: null,
            phone: req.session.userPhone
        });
    }
});

app.post('/resend-code', async (req, res) => {
    const { phone } = req.body;
    
    console.log(`🔄 Resend verification request for phone: ${phone}`);
    
    // Generate new 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated new verification code: ${verificationCode}`);
    
    // Store new code with phone number
    verificationCodes.set(phone, {
        code: verificationCode,
        timestamp: Date.now(),
        attempts: 0
    });
    
    // Send verification code via WhatsApp bot
    console.log(`📤 Attempting to resend verification code...`);
    const codeSent = await sendVerificationCode(phone, verificationCode);
    
    if (!codeSent) {
        console.log(`⚠️ Could not resend code via WhatsApp, logging code for manual testing: ${verificationCode}`);
        console.log(`🔍 Please check if bot is properly connected and phone number is correct`);
    } else {
        console.log(`✅ Verification code resent successfully to ${phone}`);
    }
    
    // Auto-delete code after 5 minutes
    setTimeout(() => {
        verificationCodes.delete(phone);
        console.log(`🗑️ Resent verification code for ${phone} expired and deleted`);
    }, 5 * 60 * 1000);
    
    res.render('verify-code', { 
        phone, 
        codeSent,
        message: codeSent ? 'Kode verifikasi baru telah dikirim!' : 'Bot tidak terhubung. Kode verifikasi di-log ke console.' 
    });
});

app.get('/api/bot-status', (req, res) => {
    const isConnected = botInstance && botInstance.isConnected && botInstance.sock;
    console.log(`🔍 Bot status check: ${isConnected ? 'CONNECTED' : 'NOT CONNECTED'}`);
    console.log(`🔍 Bot instance exists: ${!!botInstance}`);
    console.log(`🔍 Bot isConnected flag: ${botInstance ? botInstance.isConnected : 'N/A'}`);
    console.log(`🔍 Bot socket exists: ${botInstance && botInstance.sock ? 'YES' : 'NO'}`);
    
    if (isConnected) {
        res.json({ 
            connected: true, 
            message: 'Bot WhatsApp sudah terhubung!',
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({ 
            connected: false, 
            message: 'Bot belum terhubung, silakan scan QR code',
            hasQR: !!currentQRCode,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/qr-code', async (req, res) => {
    try {
        console.log('📱 QR code requested. Current QR available:', !!currentQRCode);
        
        if (currentQRCode) {
            console.log('✅ Generating QR code data URL...');
            // Generate QR code as data URL with high quality
            const qrCodeDataURL = await QRCode.toDataURL(currentQRCode, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            console.log('✅ QR code generated successfully');
            res.json({ 
                success: true, 
                qrCode: qrCodeDataURL,
                message: 'QR code ready'
            });
        } else {
            console.log('⚠️ QR code not available yet');
            res.json({ 
                success: false, 
                message: 'QR code not available yet. Bot may be starting or already connected.' 
            });
        }
    } catch (error) {
        console.error('❌ Error generating QR code:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating QR code: ' + error.message 
        });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on http://0.0.0.0:${PORT}`);
});

module.exports = { app, setBotInstance, setQRCode };
