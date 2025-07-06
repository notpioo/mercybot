const express = require('express');
const { createServer } = require('http');
const { setupAuthRoutes, initializeAuthSystem: initAuth } = require('./auth-system');
const { setupDashboardRoutes } = require('./dashboard-system');
const pinConfig = require('./config/pin');

const app = express();
const server = createServer(app);

// Global variables for QR code
let currentQRCode = null;
let qrCodeExpired = false;
let botConnected = false;

// Middleware for JSON parsing and sessions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require('express-session');
app.use(session({
    secret: 'whatsapp-bot-secret-key-2025',
    resave: true,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: { 
        secure: false, 
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Main landing page (public)
app.get('/', (req, res) => {
    // Check if user is already logged in
    if (req.session.user) {
        return res.redirect('/home');
    }
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>NoMercy - Advanced WhatsApp Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
        }
        .container {
            background: rgba(30, 30, 30, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            text-align: center;
            max-width: 400px;
            width: 90%;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo { font-size: 3rem; margin-bottom: 20px; }
        h1 { color: #ffffff; margin-bottom: 10px; font-size: 1.8rem; font-weight: 700; }
        .subtitle { color: #cccccc; margin-bottom: 30px; }
        .btn {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
        }
        .btn-secret {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
            color: white;
        }
        .btn-secret:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(75, 85, 99, 0.3);
        }
        .features {
            text-align: left;
            margin: 30px 0;
            background: rgba(40, 40, 40, 0.8);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .feature { margin: 10px 0; color: #e5e5e5; }
        .feature::before { content: "✓"; color: #10b981; margin-right: 10px; font-weight: bold; }
        .info {
            color: #cccccc;
            font-size: 14px;
            margin-top: 20px;
            line-height: 1.5;
            background: rgba(40, 40, 40, 0.6);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚡</div>
        <h1>NoMercy</h1>
        <p class="subtitle">Advanced WhatsApp Bot Management System</p>

        <div class="features">
            <div class="feature">Anti View Once Protection</div>
            <div class="feature">Advanced Group Management</div>
            <div class="feature">Premium User System</div>
            <div class="feature">Real-time Analytics</div>
        </div>
        
        <button class="btn btn-primary" onclick="window.location.href='/login'">
            Enter Dashboard
        </button>
        
        <button class="btn btn-secret" onclick="window.location.href='/owner-access'">
            Owner Access
        </button>
        
        <div class="info">
            <p><strong>Bot Status:</strong> Online</p>
            <p>For owner access, use the "Owner Access" button</p>
        </div>
    </div>
</body>
</html>`;
    res.send(html);
});

// Owner access page with PIN authentication
app.get('/owner-access', (req, res) => {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Owner Access - WhatsApp Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            min-height: 100vh;
        }
        .container { 
            max-width: 400px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 { color: #333; margin-bottom: 30px; }
        .auth-form {
            margin: 20px 0;
        }
        .auth-form input {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .auth-form button {
            width: 100%;
            padding: 12px;
            background: #25d366;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
        }
        .auth-form button:hover {
            background: #128c7e;
        }
        .error { 
            color: #e74c3c; 
            margin: 10px 0; 
            padding: 10px;
            background: #ffeaea;
            border-radius: 5px;
        }
        .info {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
        }
        #qr-section {
            display: none;
        }
        #qr-code { 
            max-width: 100%; 
            height: auto; 
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 20px 0;
        }
        .status { 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px; 
            font-weight: bold;
        }
        .waiting { background: #fff3cd; color: #856404; }
        .ready { background: #d4edda; color: #155724; }
        .expired { background: #f8d7da; color: #721c24; }
        .connected { background: #cce5ff; color: #004085; }
        .refresh-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            font-size: 14px;
        }
        .refresh-btn:hover { background: #0056b3; }
        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
            font-size: 12px;
        }
        .logout-btn:hover { background: #c82333; }
        .back-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 0;
            font-size: 12px;
        }
        .back-btn:hover { background: #5a6268; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Owner Access</h1>
        
        <div id="pin-section">
            <div class="auth-form">
                <input type="password" id="pin" placeholder="Masukkan PIN Owner" maxlength="20" />
                <button onclick="authenticatePin()">Masuk</button>
            </div>
            <div id="pin-error" class="error" style="display: none;"></div>
            <button class="back-btn" onclick="window.location.href='/'">← Kembali</button>
            <div class="info">
                <p><strong>Akses Khusus Owner</strong></p>
                <p>Masukkan PIN untuk mengakses QR code WhatsApp</p>
            </div>
        </div>

        <div id="qr-section">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>QR Code Login</h3>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
            <div id="status" class="status waiting">Waiting for QR code...</div>
            <div id="qr-container"></div>
            <button class="refresh-btn" onclick="checkQR()">Refresh QR Code</button>
            <button class="btn btn-secondary" onclick="showChangePinForm()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 5px; font-size: 12px;">Ubah PIN</button>
            <p><small>Last updated: <span id="timestamp">-</span></small></p>
            
            <!-- Change PIN Form (hidden by default) -->
            <div id="change-pin-form" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4>Ubah PIN Owner</h4>
                <input type="password" id="current-pin" placeholder="PIN saat ini" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
                <input type="password" id="new-pin" placeholder="PIN baru" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
                <div style="margin-top: 10px;">
                    <button onclick="updatePin()" style="background: #25d366; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin: 2px;">Update</button>
                    <button onclick="hideChangePinForm()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin: 2px;">Batal</button>
                </div>
                <div id="pin-update-message" style="margin-top: 10px; font-size: 12px;"></div>
            </div>
        </div>
    </div>

    <script>
        let qrInterval;
        
        function authenticatePin() {
            const pin = document.getElementById('pin').value.trim();
            const errorDiv = document.getElementById('pin-error');
            
            if (!pin) {
                showError('Silakan masukkan PIN');
                return;
            }
            
            // Verify PIN with backend
            fetch('/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin: pin })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('pin-section').style.display = 'none';
                    document.getElementById('qr-section').style.display = 'block';
                    checkQR();
                    // Set refresh interval
                    qrInterval = setInterval(checkQR, 5000);
                } else {
                    showError('PIN salah! Akses ditolak.');
                    document.getElementById('pin').value = '';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Terjadi kesalahan. Silakan coba lagi.');
            });
        }
        
        function logout() {
            if (qrInterval) {
                clearInterval(qrInterval);
            }
            document.getElementById('pin-section').style.display = 'block';
            document.getElementById('qr-section').style.display = 'none';
            document.getElementById('pin').value = '';
            hideError();
        }
        
        function showError(message) {
            const errorDiv = document.getElementById('pin-error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        function hideError() {
            document.getElementById('pin-error').style.display = 'none';
        }
        
        function checkQR() {
            fetch('/qr-data')
                .then(response => response.json())
                .then(data => {
                    const status = document.getElementById('status');
                    const qrContainer = document.getElementById('qr-container');
                    const timestamp = document.getElementById('timestamp');

                    timestamp.textContent = new Date().toLocaleString();

                    if (data.status === 'ready') {
                        status.textContent = data.message;
                        status.className = 'status ready';
                        qrContainer.innerHTML = '<img id="qr-code" src="data:image/png;base64,' + data.qr + '" alt="QR Code" />';
                    } else if (data.status === 'expired') {
                        status.textContent = data.message;
                        status.className = 'status expired';
                        qrContainer.innerHTML = '<p>QR code has expired. Please restart the bot.</p>';
                    } else if (data.status === 'connected') {
                        status.textContent = 'Bot is connected to WhatsApp!';
                        status.className = 'status connected';
                        qrContainer.innerHTML = '<p>✅ Successfully connected to WhatsApp</p>';
                    } else {
                        status.textContent = data.message;
                        status.className = 'status waiting';
                        qrContainer.innerHTML = '<p>Waiting for QR code...</p>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('status').textContent = 'Error loading QR code';
                });
        }
        
        function showChangePinForm() {
            document.getElementById('change-pin-form').style.display = 'block';
        }
        
        function hideChangePinForm() {
            document.getElementById('change-pin-form').style.display = 'none';
            document.getElementById('current-pin').value = '';
            document.getElementById('new-pin').value = '';
            document.getElementById('pin-update-message').textContent = '';
        }
        
        function updatePin() {
            const currentPin = document.getElementById('current-pin').value.trim();
            const newPin = document.getElementById('new-pin').value.trim();
            const messageDiv = document.getElementById('pin-update-message');
            
            if (!currentPin || !newPin) {
                messageDiv.style.color = 'red';
                messageDiv.textContent = 'Silakan isi semua field';
                return;
            }
            
            fetch('/update-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPin: currentPin, newPin: newPin })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    messageDiv.style.color = 'green';
                    messageDiv.textContent = 'PIN berhasil diubah!';
                    setTimeout(hideChangePinForm, 2000);
                } else {
                    messageDiv.style.color = 'red';
                    messageDiv.textContent = data.message || 'Gagal mengubah PIN';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                messageDiv.style.color = 'red';
                messageDiv.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
            });
        }
        
        // Allow Enter key to authenticate
        document.getElementById('pin').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                authenticatePin();
            }
        });
    </script>
</body>
</html>`;
    res.send(html);
});

// QR Code data endpoint (for authenticated access)
app.get('/qr-data', (req, res) => {
    if (botConnected) {
        return res.json({
            status: 'connected',
            message: 'Bot is already connected to WhatsApp!'
        });
    }
    
    if (!currentQRCode) {
        return res.json({ 
            status: 'waiting',
            message: 'Waiting for QR code...' 
        });
    }

    if (qrCodeExpired) {
        return res.json({ 
            status: 'expired',
            message: 'QR code has expired. Please restart the bot.' 
        });
    }

    res.json({ 
        status: 'ready',
        qr: currentQRCode,
        message: 'Scan this QR code with WhatsApp'
    });
});

// PIN verification endpoint
app.post('/verify-pin', (req, res) => {
    try {
        const { pin } = req.body;
        
        if (!pin) {
            return res.json({ success: false, message: 'PIN is required' });
        }
        
        const isValid = pinConfig.verifyPin(pin);
        
        if (isValid) {
            console.log('🔐 Successful PIN authentication');
            res.json({ success: true, message: 'PIN valid' });
        } else {
            console.log('❌ Failed PIN authentication attempt');
            res.json({ success: false, message: 'Invalid PIN' });
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

// PIN update endpoint (for owner to change PIN)
app.post('/update-pin', (req, res) => {
    try {
        const { currentPin, newPin } = req.body;
        
        if (!currentPin || !newPin) {
            return res.json({ success: false, message: 'Current PIN and new PIN are required' });
        }
        
        if (!pinConfig.verifyPin(currentPin)) {
            return res.json({ success: false, message: 'Current PIN is incorrect' });
        }
        
        if (newPin.length < 3) {
            return res.json({ success: false, message: 'New PIN must be at least 3 characters' });
        }
        
        pinConfig.updatePin(newPin);
        console.log('🔐 PIN updated by owner');
        res.json({ success: true, message: 'PIN updated successfully' });
    } catch (error) {
        console.error('Error updating PIN:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        bot: 'WhatsApp Bot',
        version: '1.0.0'
    });
});

// Old QR Code web page (now moved to /qr-old for backwards compatibility)
app.get('/qr-old', (req, res) => {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Bot QR Code</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background: #f0f0f0;
        }
        .container { 
            max-width: 500px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #qr-container { 
            margin: 20px 0; 
        }
        #qr-code { 
            max-width: 100%; 
            height: auto; 
        }
        .status { 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .waiting { background: #fff3cd; color: #856404; }
        .ready { background: #d4edda; color: #155724; }
        .expired { background: #f8d7da; color: #721c24; }
        .refresh-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        .refresh-btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 WhatsApp Bot Login</h1>
        <div id="status" class="status waiting">Waiting for QR code...</div>
        <div id="qr-container"></div>
        <button class="refresh-btn" onclick="checkQR()">Refresh QR Code</button>
        <p><small>Last updated: <span id="timestamp">-</span></small></p>
    </div>

    <script>
        function checkQR() {
            fetch('/qr')
                .then(response => response.json())
                .then(data => {
                    const status = document.getElementById('status');
                    const qrContainer = document.getElementById('qr-container');
                    const timestamp = document.getElementById('timestamp');

                    timestamp.textContent = new Date().toLocaleString();

                    if (data.status === 'ready') {
                        status.textContent = data.message;
                        status.className = 'status ready';
                        qrContainer.innerHTML = '<img id="qr-code" src="data:image/png;base64,' + data.qr + '" alt="QR Code" />';
                    } else if (data.status === 'expired') {
                        status.textContent = data.message;
                        status.className = 'status expired';
                        qrContainer.innerHTML = '<p>QR code has expired. Please restart the bot.</p>';
                    } else {
                        status.textContent = data.message;
                        status.className = 'status waiting';
                        qrContainer.innerHTML = '<p>Waiting for QR code...</p>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('status').textContent = 'Error loading QR code';
                });
        }

        // Check QR code every 3 seconds
        setInterval(checkQR, 3000);

        // Initial check
        checkQR();
    </script>
</body>
</html>`;
    res.send(html);
});

// Function to update QR code (called from whatsapp.js)
function updateQRCode(qr) {
    currentQRCode = qr;
    qrCodeExpired = false;
    botConnected = false;
    console.log('📱 QR Code updated and available at web interface');
}

// Function to mark QR as expired
function expireQRCode() {
    qrCodeExpired = true;
    console.log('⏰ QR Code expired');
}

// Function to clear QR code (when connected)
function clearQRCode() {
    currentQRCode = null;
    qrCodeExpired = false;
    botConnected = true;
    console.log('✅ QR Code cleared (connected)');
}

// Function to get current QR status (for admin panel)
function getCurrentQR() {
    if (botConnected) {
        return {
            status: 'connected',
            message: 'Bot is connected to WhatsApp'
        };
    }

    if (!currentQRCode) {
        return { 
            status: 'waiting',
            message: 'Waiting for QR code...' 
        };
    }

    if (qrCodeExpired) {
        return { 
            status: 'expired',
            message: 'QR code has expired. Please restart the bot.' 
        };
    }

    return { 
        status: 'ready',
        qr: currentQRCode,
        message: 'Scan this QR code with WhatsApp'
    };
}

// Initialize socket reference for auth system
let whatsappSocket = null;

// Initialize daily login system
async function initializeDailyLogin() {
    try {
        const { initializeDefaultRewards } = require('./lib/dailyLoginModel');
        await initializeDefaultRewards();
        console.log('🗓️ Daily login system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize daily login:', error);
    }
}

// Set up authentication routes (without socket initially)
setupAuthRoutes(app, null);

// Function to initialize auth system with socket
function initializeAuthSystem(sock) {
    whatsappSocket = sock;
    // Initialize auth system with socket
    initAuth(sock);
    console.log('🔐 Auth system initialized with WhatsApp socket');
}

// Set up dashboard routes with QR functions
setupDashboardRoutes(app, { getCurrentQR });

// API endpoint untuk mendapatkan currency user
app.get('/api/user-currency', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session.user) {
            return res.json({ success: false, error: 'User not authenticated' });
        }

        const { getUser, User } = require('./lib/database');
        let userPhone = req.session.user.phone;
        
        // Format phone number properly
        if (!userPhone.startsWith('+')) {
            if (userPhone.startsWith('62')) {
                userPhone = '+' + userPhone;
            } else if (userPhone.startsWith('8')) {
                userPhone = '+62' + userPhone;
            } else {
                userPhone = '+' + userPhone;
            }
        }
        
        // Create WhatsApp JID - remove + and add @s.whatsapp.net
        const phoneForJid = userPhone.replace('+', '');
        const userJid = phoneForJid + '@s.whatsapp.net';
        
        console.log(`🔍 Looking for user: Phone=${userPhone}, JID=${userJid}`);
        
        // Try multiple JID formats to find existing user
        let user = null;
        
        const possibleJids = [
            userJid, // Current format: 6285709557572@s.whatsapp.net
            userPhone.replace('+62', '62') + '@s.whatsapp.net', // Alternative format
            userPhone, // Raw phone format: +6285709557572
            userPhone + '@s.whatsapp.net' // With + sign: +6285709557572@s.whatsapp.net
        ];
        
        for (const jid of possibleJids) {
            user = await User.findOne({ jid: jid });
            if (user) {
                console.log(`✅ Found user with JID: ${jid} - Balance: ${user.balance}, Status: ${user.status}`);
                break;
            }
        }

        if (!user) {
            // Create new user if doesn't exist
            user = new User({
                jid: userJid,
                name: userPhone,
                balance: 0,
                chips: 0,
                limit: 30,
                status: 'basic',
                warnings: 0,
                lastLimit: new Date(),
                memberSince: new Date()
            });
            await user.save();
            console.log(`👤 Created new user: ${userJid}`);
        }

        console.log(`💰 Currency fetched for ${userPhone}: Balance=${user.balance}, Chips=${user.chips}, Limit=${user.limit}, Status=${user.status}`);

        res.json({
            success: true,
            balance: user.balance || 0,
            chips: user.chips || 0,
            limit: user.limit === 'unlimited' ? 'unlimited' : (user.limit || 30),
            status: user.status || 'basic',
            warnings: user.warnings || 0,
            phoneNumber: userPhone,
            whatsappJid: userJid,
            memberSince: user.memberSince || new Date(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching user currency:', error);
        res.json({ success: false, error: 'Failed to fetch user data' });
    }
});

// Initialize daily login after server start
async function initializeServer() {
    await initializeDailyLogin();
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log('🌐 Web server running on port ' + PORT);
    if (process.env.NODE_ENV === 'production') {
        console.log('📱 Dashboard available at your Railway app URL');
    } else {
        console.log('📱 Dashboard available at: http://localhost:' + PORT);
    }
    
    // Initialize additional systems
    await initializeServer();
});



module.exports = { updateQRCode, expireQRCode, clearQRCode, initializeAuthSystem };