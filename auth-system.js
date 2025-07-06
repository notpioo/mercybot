const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const config = require('./config/config');

// Create Express app for auth routes
const authApp = express();

// Middleware for parsing JSON
authApp.use(express.json());
authApp.use(express.urlencoded({ extended: true }));

// In-memory storage for verification codes (in production, use Redis)
const verificationCodes = new Map();
const activeSessions = new Map();

// Store socket reference globally
let whatsappSocket = null;

// Socket reference
let sock = null;

// Helper functions
function isOwner(phoneNumber) {
    return config.owners.includes(phoneNumber);
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initialize auth system
function initializeAuthSystem(sock) {
    whatsappSocket = sock;
    console.log('🔐 Authentication system initialized with WhatsApp socket');

    // Store socket reference
    if (sock) {
        whatsappSocket = sock;
        console.log('✅ WhatsApp socket stored for authentication');
    } else {
        console.log('❌ No WhatsApp socket provided');
    }
}

function formatPhoneNumber(phone) {
    // Remove non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Indonesian phone numbers
    if (cleaned.startsWith('0')) {
        // Remove leading 0 and add country code 62
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        // Add country code if number starts with 8
        cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62')) {
        // For other formats, assume it needs 62 prefix
        cleaned = '62' + cleaned;
    }

    // Ensure the number is valid length (Indonesian mobile numbers)
    if (cleaned.length < 11 || cleaned.length > 15) {
        throw new Error('Nomor telepon tidak valid. Gunakan format: 08123456789 atau 6285123456789');
    }

    return '+' + cleaned;
}

function setupAuthRoutes(app, sock) {
    // Session middleware
    app.use(session({
        secret: process.env.SESSION_SECRET || 'whatsapp-bot-secret-key-2025',
        resave: true,
        saveUninitialized: false,
        rolling: true, // Reset expiration on activity
        cookie: { 
            secure: false, // Set to false for development
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
    }));

    // Landing page
    app.get('/', (req, res) => {
        if (req.session.user) {
            return res.redirect('/dashboard');
        }

        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Bot - Welcome</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            font-size: 3em;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .features {
            margin-top: 30px;
            text-align: left;
            font-size: 14px;
            color: #666;
        }
        .feature {
            margin: 8px 0;
            display: flex;
            align-items: center;
        }
        .feature::before {
            content: "✓";
            color: #4CAF50;
            font-weight: bold;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🤖</div>
        <h1>WhatsApp Bot</h1>
        <p class="subtitle">Advanced WhatsApp Management System</p>

        <a href="/login" class="btn">Masuk ke Dashboard</a>

        <div class="features">
            <div class="feature">Anti View-Once Protection</div>
            <div class="feature">Group Management Tools</div>
            <div class="feature">User Permission System</div>
            <div class="feature">Automated Moderation</div>
        </div>
    </div>
</body>
</html>
        `);
    });

    // Login page
    app.get('/login', (req, res) => {
        if (req.session.user) {
            return res.redirect('/dashboard');
        }

        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Login - WhatsApp Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 90%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo { font-size: 2.5em; margin-bottom: 15px; }
        h1 { color: #333; margin-bottom: 5px; }
        .subtitle { color: #666; font-size: 14px; }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        input[type="text"] {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .help-text {
            margin-top: 15px;
            font-size: 13px;
            color: #666;
            text-align: center;
        }
        .error {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            text-align: center;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐</div>
            <h1>Login</h1>
            <p class="subtitle">Masukkan nomor WhatsApp Anda</p>
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label for="phone">Nomor WhatsApp:</label>
                <input type="text" id="phone" name="phone" placeholder="08123456789" required>
            </div>

            <button type="submit" class="btn">Kirim Kode Verifikasi</button>

            <div class="help-text">
                Kode verifikasi akan dikirim melalui bot WhatsApp
            </div>
        </form>

        <div class="back-link">
            <a href="/">← Kembali ke Beranda</a>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value;
            const btn = document.querySelector('.btn');

            btn.textContent = 'Mengirim...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = '/verify?phone=' + encodeURIComponent(phone);
                } else {
                    alert(result.message || 'Gagal mengirim kode verifikasi');
                    btn.textContent = 'Kirim Kode Verifikasi';
                    btn.disabled = false;
                }
            } catch (error) {
                alert('Terjadi kesalahan. Coba lagi.');
                btn.textContent = 'Kirim Kode Verifikasi';
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
        `);
    });

    // Verification page
    app.get('/verify', (req, res) => {
        const phone = req.query.phone;
        if (!phone) {
            return res.redirect('/login');
        }

        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Verifikasi - WhatsApp Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 90%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo { font-size: 2.5em; margin-bottom: 15px; }
        h1 { color: #333; margin-bottom: 5px; }
        .subtitle { color: #666; font-size: 14px; }
        .phone-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 500;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        input[type="text"] {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 18px;
            text-align: center;
            letter-spacing: 2px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .resend-link {
            text-align: center;
            margin-top: 15px;
        }
        .resend-link a {
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #999;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📱</div>
            <h1>Verifikasi</h1>
            <p class="subtitle">Masukkan kode yang dikirim ke WhatsApp</p>
        </div>

        <div class="phone-info">
            Kode dikirim ke: ${phone}
        </div>

        <form id="verifyForm">
            <div class="form-group">
                <label for="code">Kode Verifikasi (6 digit):</label>
                <input type="text" id="code" name="code" placeholder="123456" maxlength="6" required>
            </div>

            <button type="submit" class="btn">Verifikasi & Masuk</button>
        </form>

        <div class="resend-link">
            <a href="#" onclick="resendCode()">Kirim ulang kode</a>
        </div>

        <div class="back-link">
            <a href="/login">← Ganti nomor</a>
        </div>
    </div>

    <script>
        const phone = '${phone}';

        document.getElementById('verifyForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const code = document.getElementById('code').value;
            const btn = document.querySelector('.btn');

            btn.textContent = 'Memverifikasi...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, code })
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = '/dashboard';
                } else {
                    alert(result.message || 'Kode verifikasi salah');
                    btn.textContent = 'Verifikasi & Masuk';
                    btn.disabled = false;
                }
            } catch (error) {
                alert('Terjadi kesalahan. Coba lagi.');
                btn.textContent = 'Verifikasi & Masuk';
                btn.disabled = false;
            }
        });

        async function resendCode() {
            try {
                const response = await fetch('/api/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Kode baru telah dikirim!');
                } else {
                    alert(result.message || 'Gagal mengirim kode');
                }
            } catch (error) {
                alert('Terjadi kesalahan');
            }
        }
    </script>
</body>
</html>
        `);
    });

    // API endpoints
    app.post('/api/send-code', async (req, res) => {
        try {
            const { phone } = req.body;
            console.log('Received phone number:', phone);

            const formattedPhone = formatPhoneNumber(phone);
            console.log('Formatted phone number:', formattedPhone);

            const whatsappJid = formattedPhone.substring(1) + '@s.whatsapp.net';
            console.log('WhatsApp JID:', whatsappJid);

            // Generate verification code
            const code = generateVerificationCode();
            console.log('Generated verification code:', code);

            // Store code with expiration (5 minutes)
            verificationCodes.set(formattedPhone, {
                code,
                expires: Date.now() + 5 * 60 * 1000,
                attempts: 0
            });

            // Send verification code via WhatsApp
            if (whatsappSocket && whatsappSocket.user) {
                try {
                    const message = `🔐 *Kode Verifikasi Bot*\n\nKode verifikasi Anda: *${code}*\n\nMasukkan kode ini di halaman login.\n\n_Kode berlaku selama 5 menit_`;

                    await whatsappSocket.sendMessage(whatsappJid, {
                        text: message
                    });

                    console.log(`✅ Verification code sent to ${formattedPhone}`);
                    
                    // Return success response
                    res.json({ 
                        success: true, 
                        message: 'Kode verifikasi berhasil dikirim!' 
                    });
                } catch (sendError) {
                    console.error('❌ Failed to send WhatsApp message:', sendError);
                    throw new Error('Failed to send verification code');
                }
            } else {
                console.log('❌ WhatsApp socket not available or not connected');
                throw new Error('WhatsApp bot is not connected properly');
            }

        } catch (error) {
            console.error('❌ Error sending verification code:', error);
            res.json({ 
                success: false, 
                message: 'Gagal mengirim kode verifikasi: ' + error.message 
            });
        }
    });

    app.post('/api/verify-code', async (req, res) => {
        try {
            const { phone, code } = req.body;
            const formattedPhone = formatPhoneNumber(phone);

            const storedData = verificationCodes.get(formattedPhone);

            if (!storedData) {
                return res.json({ success: false, message: 'Kode tidak ditemukan atau sudah expired' });
            }

            if (Date.now() > storedData.expires) {
                verificationCodes.delete(formattedPhone);
                return res.json({ success: false, message: 'Kode sudah expired' });
            }

            if (storedData.attempts >= 3) {
                verificationCodes.delete(formattedPhone);
                return res.json({ success: false, message: 'Terlalu banyak percobaan salah' });
            }

            if (storedData.code !== code) {
                storedData.attempts++;
                return res.json({ success: false, message: 'Kode verifikasi salah' });
            }

            // Successful verification
            verificationCodes.delete(formattedPhone);

            // Get or create user in database
            try {
                const { getUser, createUser } = require('./lib/database');
                let userData = await getUser(formattedPhone);
                
                if (!userData) {
                    // Create new user if not exists
                    userData = await createUser(formattedPhone, {
                        isOwner: isOwner(formattedPhone),
                        isPremium: isOwner(formattedPhone),
                        balance: isOwner(formattedPhone) ? 1000000 : 1000,
                        chips: isOwner(formattedPhone) ? 1000000 : 100,
                        limit: isOwner(formattedPhone) ? 999999 : 50
                    });
                }

                // Create session
                req.session.user = {
                    phone: formattedPhone,
                    role: isOwner(formattedPhone) ? 'owner' : 'member',
                    loginTime: new Date(),
                    userId: userData._id
                };

                // Save session immediately
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                    }
                    res.json({ success: true });
                });
            } catch (dbError) {
                console.error('Database error during verification:', dbError);
                // Still create session even if DB fails
                req.session.user = {
                    phone: formattedPhone,
                    role: isOwner(formattedPhone) ? 'owner' : 'member',
                    loginTime: new Date()
                };
                res.json({ success: true });
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            res.json({ success: false, message: 'Terjadi kesalahan sistem' });
        }
    });
}

module.exports = {
    initializeAuthSystem,
    setupAuthRoutes
};