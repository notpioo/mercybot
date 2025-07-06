const express = require('express');
const config = require('./config/config');

function setupDashboardRoutes(app, qrFunctions) {
    // Middleware to check authentication
    function requireAuth(req, res, next) {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        next();
    }

    // Middleware to check owner role
    function requireOwner(req, res, next) {
        if (!req.session.user || req.session.user.role !== 'owner') {
            return res.status(403).send('Access denied. Owner role required.');
        }
        next();
    }

    // Landing page (root)
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo { font-size: 3rem; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 10px; font-size: 1.8rem; }
        .subtitle { color: #666; margin-bottom: 30px; }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        .btn:hover { transform: translateY(-2px); }
        .features {
            text-align: left;
            margin: 30px 0;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
        }
        .feature { margin: 10px 0; color: #555; }
        .feature::before { content: "✓"; color: #28a745; margin-right: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🤖</div>
        <h1>WhatsApp Bot</h1>
        <p class="subtitle">Sistem Manajemen Bot WhatsApp Lengkap</p>

        <div class="features">
            <div class="feature">Anti View Once Protection</div>
            <div class="feature">Admin Group Management</div>
            <div class="feature">User & Premium System</div>
            <div class="feature">Real-time Dashboard</div>
        </div>

        <a href="/login" class="btn">Masuk ke Dashboard</a>
    </div>
</body>
</html>
        `);
    });

    // Dashboard main page
    app.get('/dashboard', requireAuth, (req, res) => {
        const user = req.session.user;
        const isOwner = user.role === 'owner';

        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard - WhatsApp Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
        }
        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 10px;
            }
            .nav-menu {
                flex-direction: column;
                gap: 10px !important;
                width: 100%;
                text-align: center;
            }
            .nav-user {
                width: 100%;
                justify-content: center;
            }
        }
        .nav-brand {
            font-size: 24px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        .nav-brand .emoji { margin-right: 10px; }
        .nav-menu {
            display: flex;
            list-style: none;
            gap: 20px;
        }
        .nav-menu a {
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            transition: background 0.3s;
        }
        .nav-menu a:hover {
            background: rgba(255,255,255,0.2);
        }
        .nav-user {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .user-info {
            text-align: right;
            font-size: 14px;
        }
        .user-phone { font-weight: 500; }
        .user-role { 
            font-size: 12px; 
            opacity: 0.8;
            text-transform: uppercase;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        .welcome-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            margin-bottom: 30px;
            text-align: center;
        }
        .welcome-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }
        .welcome-subtitle {
            color: #666;
            font-size: 16px;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .dashboard-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.2s;
        }
        .dashboard-card:hover {
            transform: translateY(-5px);
        }
        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .card-icon {
            font-size: 2em;
            margin-right: 15px;
        }
        .card-title {
            font-size: 20px;
            color: #333;
            margin: 0;
        }
        .card-content {
            color: #666;
            line-height: 1.6;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
            margin-top: 15px;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6c757d;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            text-decoration: none;
            font-size: 14px;
        }
        .currency-section {
            margin: 30px 0;
            padding: 0;
        }
        .currency-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .currency-header h2 {
            color: #333;
            font-size: 24px;
            margin: 0;
        }
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .refresh-btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        .currency-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .currency-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        }
        .currency-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }
        .chips-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
        }
        .chips-card:hover {
            box-shadow: 0 12px 35px rgba(240, 147, 251, 0.4);
        }
        .limit-card {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3);
        }
        .limit-card:hover {
            box-shadow: 0 12px 35px rgba(79, 172, 254, 0.4);
        }
        .currency-icon {
            font-size: 32px;
            opacity: 0.9;
        }
        .currency-info h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
        }
        .currency-amount {
            font-size: 24px;
            font-weight: bold;
            display: block;
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            display: none; /* Hidden by default */
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <span class="emoji">🤖</span>
                WhatsApp Bot
            </div>
            <ul class="nav-menu">
                <li><a href="/dashboard">Dashboard</a></li>
                ${isOwner ? '<li><a href="/admin">Admin Panel</a></li>' : ''}
            </ul>
            <div class="nav-user">
                <div class="user-info">
                    <div class="user-phone">${user.phone}</div>
                    <div class="user-role">${user.role}</div>
                </div>
                <a href="/logout" class="logout-btn">Logout</a>
            </div>
        </div>
    </nav>

    <div class="container">
            <div id="notification" class="notification"></div>
            <div class="currency-section">
            <div class="currency-header">
                <h2>💰 Account Balance</h2>
                <button onclick="refreshCurrency()" class="refresh-btn">🔄 Refresh</button>
            </div>
            <div class="currency-grid">
                <div class="currency-card balance-card">
                    <div class="currency-icon">💵</div>
                    <div class="currency-info">
                        <h3>Balance</h3>
                        <span id="user-balance" class="currency-amount">Loading...</span>
                    </div>
                </div>
                <div class="currency-card chips-card">
                    <div class="currency-icon">🎰</div>
                    <div class="currency-info">
                        <h3>Chips</h3>
                        <span id="user-chips" class="currency-amount">Loading...</span>
                    </div>
                </div>
                <div class="currency-card limit-card">
                    <div class="currency-icon">🎯</div>
                    <div class="currency-info">
                        <h3>Daily Limit</h3>
                        <span id="user-limit" class="currency-amount">Loading...</span>
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin: 15px 0; color: #666; font-size: 12px;">
                <span id="last-updated">Click refresh to update currency</span>
            </div>
        </div>

        <div class="welcome-card">
            <h1 class="welcome-title">Selamat Datang!</h1>
            <p class="welcome-subtitle">Dashboard WhatsApp Bot Management System</p>
        </div>

        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-icon">📊</div>
                    <h3 class="card-title">Status Bot</h3>
                </div>
                <div class="card-content">
                    <p><span class="status-indicator status-online"></span>Bot sedang aktif</p>
                    <p>Anti-View-Once: Tersedia</p>
                    <p>Group Management: Aktif</p>
                    <p>Session: Valid</p>
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-icon">🛡️</div>
                    <h3 class="card-title">Fitur Keamanan</h3>
                </div>
                <div class="card-content">
                    <p>• Anti View-Once Protection</p>
                    <p>• Automatic Badword Detection</p>
                    <p>• User Permission System</p>
                    <p>• Session Management</p>
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-icon">👥</div>
                    <h3 class="card-title">Management Tools</h3>
                </div>
                <div class="card-content">
                    <p>• Group Administration</p>
                    <p>• User Ban/Unban System</p>
                    <p>• Warning Management</p>
                    <p>• Premium User Control</p>
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-icon">📱</div>
                    <h3 class="card-title">WhatsApp Features</h3>
                </div>
                <div class="card-content">
                    <p>• Command System (${config.prefixes.join(', ')})</p>
                    <p>• Multi-Owner Support</p>
                    <p>• Group Link Management</p>
                    <p>• Auto Moderation</p>
                </div>
            </div>
        </div>

        ${isOwner ? `
        <div class="dashboard-card">
            <div class="card-header">
                <div class="card-icon">⚙️</div>
                <h3 class="card-title">Owner Controls</h3>
            </div>
            <div class="card-content">
                <p>Sebagai owner, Anda memiliki akses ke fitur administrasi lanjutan.</p>
                <a href="/admin" class="btn">Buka Admin Panel</a>
            </div>
        </div>
        ` : ''}
    </div>

    <script>
        function refreshCurrency() {
            // Show loading state
            const balanceEl = document.getElementById('user-balance');
            const chipsEl = document.getElementById('user-chips');
            const limitEl = document.getElementById('user-limit');

            balanceEl.innerHTML = '<div class="loading-spinner">⏳</div>';
            chipsEl.innerHTML = '<div class="loading-spinner">⏳</div>';
            limitEl.innerHTML = '<div class="loading-spinner">⏳</div>';

            // Fetch user currency data
            fetch('/api/user-currency')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        balanceEl.textContent = formatNumber(data.balance);
                        chipsEl.textContent = formatNumber(data.chips);
                        limitEl.textContent = data.limit === 'unlimited' ? '∞' : formatNumber(data.limit);

                        // Update last updated time
                        const lastUpdated = document.getElementById('last-updated');
                        if (lastUpdated) {
                            lastUpdated.textContent = 'Last updated: ' + new Date().toLocaleTimeString('id-ID');
                        }

                        console.log('Currency updated for:', data.phoneNumber);
                    } else {
                        balanceEl.innerHTML = '<span style="color: #ff6b6b;">❌</span>';
                        chipsEl.innerHTML = '<span style="color: #ff6b6b;">❌</span>';
                        limitEl.innerHTML = '<span style="color: #ff6b6b;">❌</span>';
                        console.error('Failed to fetch currency:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Error fetching currency:', error);
                    balanceEl.innerHTML = '<span style="color: #ff6b6b;">❌</span>';
                    chipsEl.innerHTML = '<span style="color: #ff6b6b;">❌</span>';
                    limitEl.innerHTML = '<span style="color: #ff6b6b;">❌</span>';
                });
        }

        function formatNumber(num) {
            if (num === null || num === undefined) return '0';
            if (typeof num === 'string') return num;
            return num.toLocaleString();
        }

        // Auto refresh currency every 10 seconds
        setInterval(refreshCurrency, 10000);

        // Initial load
        refreshCurrency();
    </script>
</body>
</html>
        `);
    });

    // Admin panel (owner only)
    app.get('/admin', requireOwner, (req, res) => {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel - WhatsApp Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
        }
        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 10px;
            }
            .nav-menu {
                flex-direction: column;
                gap: 10px !important;
                width: 100%;
                text-align: center;
            }
            .nav-user {
                width: 100%;
                justify-content: center;
            }
        }
        .nav-brand {
            font-size: 24px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        .nav-brand .emoji { margin-right: 10px; }
        .nav-menu {
            display: flex;
            list-style: none;
            gap: 20px;
        }
        .nav-menu a {
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            transition: background 0.3s;
        }
        .nav-menu a:hover, .nav-menu a.active {
            background: rgba(255,255,255,0.2);
        }
        .nav-user {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .user-info {
            text-align: right;
            font-size: 14px;
        }
        .user-phone { font-weight: 500; }
        .user-role { 
            font-size: 12px; 
            opacity: 0.8;
            text-transform: uppercase;
            color: #ffd700;
        }
        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            text-decoration: none;
            font-size: 14px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        .admin-header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            margin-bottom: 30px;
            text-align: center;
        }
        .admin-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }
        .admin-subtitle {
            color: #666;
            font-size: 16px;
        }
        .qr-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            text-align: center;
        }
        .qr-header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .qr-header h3 {
            font-size: 24px;
            color: #333;
            margin-left: 10px;
        }
        #qr-container {
            margin: 20px 0;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #qr-code {
            max-width: 300px;
            height: auto;
            border: 3px solid #667eea;
            border-radius: 15px;
            padding: 10px;
            background: white;
        }
        .status {
            padding: 15px;
            margin: 15px 0;
            border-radius: 10px;
            font-weight: 500;
        }
        .waiting { background: #fff3cd; color: #856404; }
        .ready { background: #d4edda; color: #155724; }
        .expired { background: #f8d7da; color: #721c24; }
        .connected { background: #d1ecf1; color: #0c5460; }
        .refresh-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px 5px;
            font-size: 14px;
            font-weight: 500;
        }
        .refresh-btn:hover {
            background: #138496;
        }
        .timestamp {
            font-size: 12px;
            color: #999;
            margin-top: 15px;
        }
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .warning-box strong {
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <span class="emoji">🔧</span>
                Admin Panel
            </div>
            <ul class="nav-menu">
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/admin" class="active">Admin Panel</a></li>
            </ul>
            <div class="nav-user">
                <div class="user-info">
                    <div class="user-phone">${req.session.user.phone}</div>
                    <div class="user-role">Owner</div>
                </div>
                <a href="/logout" class="logout-btn">Logout</a>
            </div>
        </div>
    </nav>

    <div class="container">
            <div id="notification" class="notification"></div>
            <div class="currency-section">
        <div class="admin-header">
            <h1 class="admin-title">⚙️ Admin Panel</h1>
            <p class="admin-subtitle">Panel kontrol khusus untuk owner bot</p>
        </div>

        <div class="warning-box">
            <strong>⚠️ Area Khusus Owner</strong>
            QR Code bot hanya dapat diakses oleh owner. Jangan bagikan akses ini kepada member biasa.
        </div>

        <div class="qr-section">
            <div class="qr-header">
                <span style="font-size: 2em;">📱</span>
                <h3>WhatsApp Bot QR Code</h3>
            </div>

            <div id="status" class="status waiting">Checking bot status...</div>
            <div id="qr-container">
                <div style="color: #999;">Loading QR code...</div>
            </div>

            <button class="refresh-btn" onclick="checkQR()">🔄 Refresh QR Code</button>
            <button class="refresh-btn" onclick="checkStatus()" style="background: #28a745;">📊 Check Status</button>

            <div class="timestamp">
                Last updated: <span id="timestamp">-</span>
            </div>
        </div>
    </div>

    <script>
        function checkQR() {
            fetch('/qr-api')
                .then(response => response.json())
                .then(data => {
                    const status = document.getElementById('status');
                    const qrContainer = document.getElementById('qr-container');
                    const timestamp = document.getElementById('timestamp');

                    timestamp.textContent = new Date().toLocaleString();

                    if (data.status === 'ready') {
                        status.innerHTML = '✅ ' + data.message;
                        status.className = 'status ready';
                        qrContainer.innerHTML = '<img id="qr-code" src="data:image/png;base64,' + data.qr + '" alt="QR Code" />';
                    } else if (data.status === 'expired') {
                        status.innerHTML = '⏰ ' + data.message;
                        status.className = 'status expired';
                        qrContainer.innerHTML = '<div style="color: #999;">QR code has expired. Please restart the bot.</div>';
                    } else if (data.status === 'connected') {
                        status.innerHTML = '🔗 Bot sudah terhubung ke WhatsApp';
                        status.className = 'status connected';
                        qrContainer.innerHTML = '<div style="color: #0c5460;">✅ Bot sedang aktif dan terhubung</div>';
                    } else {
                        status.innerHTML = '⏳ ' + data.message;
                        status.className = 'status waiting';
                        qrContainer.innerHTML = '<div style="color: #999;">Waiting for QR code...</div>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('status').innerHTML = '❌ Error loading QR code';
                    document.getElementById('status').className = 'status expired';
                });
        }

        function checkStatus() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    alert('Bot Status: ' + data.status + '\\nTimestamp: ' + data.timestamp);
                })
                .catch(error => {
                    alert('Error checking status');
                });
        }

        // Check QR code every 5 seconds
        setInterval(checkQR, 5000);

        // Initial check
        checkQR();
    </script>
</body>
</html>
        `);
    });

    // QR API endpoint for admin
    app.get('/qr-api', requireOwner, (req, res) => {
        if (qrFunctions && qrFunctions.getCurrentQR) {
            const qrData = qrFunctions.getCurrentQR();
            res.json(qrData);
        } else {
            res.json({
                status: 'connected',
                message: 'Bot is connected'
            });
        }
    });

    // Logout endpoint
    app.get('/logout', (req, res) =>{
        req.session.destroy();
        res.redirect('/');
    });
}

module.exports = { setupDashboardRoutes };