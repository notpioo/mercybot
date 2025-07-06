const express = require('express');
const { createServer } = require('http');
const { setupAuthRoutes, initializeAuthSystem: initAuth } = require('./auth-system');
const { setupDashboardRoutes } = require('./dashboard-system');

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

// QR Code endpoint
app.get('/qr', (req, res) => {
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
        const userPhone = req.session.user.phone;
        const userJid = userPhone + '@s.whatsapp.net';
        
        // Force refresh from database to get latest data
        let user = await User.findOne({ jid: userJid });

        if (!user) {
            // Create new user if doesn't exist
            user = new User({
                jid: userJid,
                name: userPhone,
                balance: 0,
                chips: 0,
                limit: 30
            });
            await user.save();
        }

        console.log(`💰 Currency fetched for ${userPhone}: Balance=${user.balance}, Chips=${user.chips}, Limit=${user.limit}`);

        res.json({
            success: true,
            balance: user.balance || 0,
            chips: user.chips || 0,
            limit: user.limit === 'unlimited' ? 'unlimited' : (user.limit || 30),
            phoneNumber: userPhone,
            whatsappJid: userJid,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching user currency:', error);
        res.json({ success: false, error: 'Failed to fetch user data' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('🌐 Web server running on port ' + PORT);
    if (process.env.NODE_ENV === 'production') {
        console.log('📱 Dashboard available at your Railway app URL');
    } else {
        console.log('📱 Dashboard available at: http://localhost:' + PORT);
    }
});



module.exports = { updateQRCode, expireQRCode, clearQRCode, initializeAuthSystem };