const express = require('express');
const config = require('./config/config');
const { setupProfileRoutes } = require('./profile-system');
const { setupListRoutes } = require('./list-system');
const { getNavigationTemplate } = require('./navigation-system');

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

    // Note: Root route '/' is handled by web-server.js

    // Base page template
    function getCategoryIcon(category) {
        const icons = {
            announcement: '📢',
            hot: '🔥',
            event: '🎉',
            update: '🔄'
        };
        return icons[category] || '📢';
    }

    function getBaseTemplate(title, content, activePage = '') {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>NoMercy - ${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%);
            min-height: 100vh;
            color: #ffffff;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .card {
            background: rgba(30, 30, 30, 0.95);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .btn {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
        }
        h1, h2, h3 {
            color: #ffffff;
            margin-bottom: 1rem;
        }
        p {
            color: #cccccc;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            .card {
                padding: 1.5rem;
            }
        }
    </style>
    ${getNavigationTemplate(activePage)}
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>
        `;
    }

    // Home page
    app.get('/home', requireAuth, async (req, res) => {
        try {
            const { getUserDailyLoginStatus } = require('./lib/dailyLoginModel');
            
            // Get user's WhatsApp JID
            let userPhone = req.session.user.phone;
            if (!userPhone.startsWith('+')) {
                if (userPhone.startsWith('62')) {
                    userPhone = '+' + userPhone;
                } else if (userPhone.startsWith('8')) {
                    userPhone = '+62' + userPhone;
                } else {
                    userPhone = '+' + userPhone;
                }
            }
            const userJid = userPhone.replace('+', '') + '@s.whatsapp.net';
            
            // Get daily login status
            const dailyLoginStatus = await getUserDailyLoginStatus(userJid);
            
            // Generate daily login section
            let dailyLoginSection = '';
            if (dailyLoginStatus.canClaim) {
                dailyLoginSection = `
                    <div class="card" style="border: 2px solid #10b981;">
                        <h3>🎁 Daily Login Reward</h3>
                        <p>Claim your daily reward!</p>
                        <p><strong>Day ${dailyLoginStatus.currentDay}</strong> - Reward: ${dailyLoginStatus.reward} balance</p>
                        <form method="post" action="/api/claim-daily">
                            <button type="submit" class="btn">Claim Reward</button>
                        </form>
                    </div>
                `;
            } else if (dailyLoginStatus.hasClaimedToday) {
                const nextClaim = new Date(dailyLoginStatus.nextClaimTime);
                const timeLeft = Math.ceil((nextClaim - new Date()) / (1000 * 60 * 60));
                dailyLoginSection = `
                    <div class="card">
                        <h3>✅ Daily Login Reward</h3>
                        <p>You've already claimed today's reward!</p>
                        <p><strong>Day ${dailyLoginStatus.currentDay}</strong> - Next reward in ~${timeLeft} hours</p>
                    </div>
                `;
            }
            
            const content = `
                <div class="card">
                    <h1>🏠 Welcome to NoMercy Dashboard</h1>
                    <p>Welcome back, <strong>${req.session.user.name || req.session.user.phone}</strong>!</p>
                    <p>Manage your account, view statistics, and access all bot features from here.</p>
                </div>

                ${dailyLoginSection}

                <div class="grid">
                    <div class="card">
                        <h3>📊 Your Statistics</h3>
                        <p>View your detailed profile, balance, and usage statistics.</p>
                        <a href="/profile" class="btn">View Profile</a>
                    </div>
                    
                    <div class="card">
                        <h3>📰 Latest News</h3>
                        <p>Stay updated with the latest announcements and updates.</p>
                        <a href="/news" class="btn">Read News</a>
                    </div>
                    
                    <div class="card">
                        <h3>🎰 Games & Casino</h3>
                        <p>Try your luck with our casino games and challenges.</p>
                        <a href="/list/mine" class="btn">Play Now</a>
                    </div>
                    
                    <div class="card">
                        <h3>🛒 Shop & Rewards</h3>
                        <p>Browse available items and redeem your rewards.</p>
                        <a href="/list/shop" class="btn">Browse Shop</a>
                    </div>
                </div>
                
                ${req.session.user.role === 'owner' ? `
                <div class="card" style="border: 2px solid #ffd700;">
                    <h3>⚡ Owner Panel</h3>
                    <p>Access administrative functions and bot management.</p>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                        <a href="/qr" class="btn">View QR Code</a>
                        <a href="/admin/dashboard" class="btn">Admin Dashboard</a>
                        <a href="/owner/stats" class="btn">Bot Statistics</a>
                        <a href="/owner/users" class="btn">User Management</a>
                    </div>
                </div>
                ` : ''}
            `;
            
            res.send(getBaseTemplate('Home', content, 'home'));
        } catch (error) {
            console.error('Error loading home:', error);
            const content = `
                <div class="card">
                    <h1>🏠 Welcome to NoMercy Dashboard</h1>
                    <p>Welcome back! There was an issue loading some features, but you can still access all the main functions.</p>
                    <a href="/profile" class="btn">View Profile</a>
                </div>
            `;
            res.send(getBaseTemplate('Home', content, 'home'));
        }
    });

    // News page
    app.get('/news', requireAuth, async (req, res) => {
        try {
            let news = [];
            try {
                const { News } = require('./lib/newsModel');
                news = await News.find({ isActive: true }).sort({ priority: -1, createdAt: -1 }).limit(20);
                console.log('Loaded news count:', news.length);
                console.log('News data:', news);
            } catch (modelError) {
                console.log('News model error:', modelError.message);
                news = [];
            }

            let newsContent = '';
            
            if (news.length > 0) {
                newsContent = news.map(item => `
                    <div class="card" style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 1rem;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <span class="news-badge news-${item.category}">${getCategoryIcon(item.category)} ${item.category.toUpperCase()}</span>
                                    ${item.priority > 0 ? `<span class="priority-badge">Priority ${item.priority}</span>` : ''}
                                </div>
                                <h2 style="color: #ffffff; margin-bottom: 0.5rem;">${item.title}</h2>
                            </div>
                        </div>
                        <div style="color: #e5e5e5; line-height: 1.6; margin-bottom: 1rem;">
                            ${item.content.replace(/\n/g, '<br>')}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #888;">
                            <span>📝 By ${item.author}</span>
                            <span>📅 ${item.createdAt.toLocaleDateString('id-ID', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                newsContent = `
                    <div class="card">
                        <h2>📢 No News Available</h2>
                        <p>There are no news updates at the moment. Check back later for the latest announcements and updates.</p>
                    </div>
                `;
            }

            const content = `
                <div class="card">
                    <h1>📰 Latest News</h1>
                    <p>Stay updated with the latest announcements and updates from NoMercy.</p>
                </div>
                
                ${newsContent}

                <style>
                    .news-badge {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .news-announcement {
                        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                        color: white;
                    }
                    .news-hot {
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                    }
                    .news-event {
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                    }
                    .news-update {
                        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                        color: white;
                    }
                    .priority-badge {
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 600;
                    }
                </style>
            `;
            res.send(getBaseTemplate('News', content, 'news'));
        } catch (error) {
            console.error('Error loading news:', error);
            const errorContent = `
                <div class="card">
                    <h1>📰 Latest News</h1>
                    <p>Stay updated with the latest announcements and updates from NoMercy.</p>
                </div>
                
                <div class="card">
                    <h2>⚠️ Error Loading News</h2>
                    <p>Unable to load news at the moment. Please try again later.</p>
                </div>
            `;
            res.send(getBaseTemplate('News', errorContent, 'news'));
        }
    });

    // API endpoint for currency data
    app.get('/api/currency', requireAuth, async (req, res) => {
        try {
            const { User } = require('./lib/database');
            
            // Get user's WhatsApp JID
            let userPhone = req.session.user.phone;
            if (!userPhone.startsWith('+')) {
                if (userPhone.startsWith('62')) {
                    userPhone = '+' + userPhone;
                } else if (userPhone.startsWith('8')) {
                    userPhone = '+62' + userPhone;
                } else {
                    userPhone = '+' + userPhone;
                }
            }
            
            // Find user by phone
            const user = await User.findOne({ 
                $or: [
                    { phone: userPhone },
                    { jid: userPhone.replace('+', '') + '@s.whatsapp.net' }
                ]
            });
            
            if (user) {
                res.json({
                    success: true,
                    balance: user.balance || 0,
                    chips: user.chips || 0,
                    limit: user.limit === 'unlimited' ? '∞' : (user.limit || 30),
                    status: user.status || 'basic'
                });
            } else {
                res.json({
                    success: true,
                    balance: 0,
                    chips: 0,
                    limit: 30,
                    status: 'basic'
                });
            }
        } catch (error) {
            console.error('Error fetching currency:', error);
            res.json({
                success: false,
                balance: 0,
                chips: 0,
                limit: 30,
                status: 'basic'
            });
        }
    });

    // Daily login claim endpoint
    app.post('/api/claim-daily', requireAuth, async (req, res) => {
        try {
            const { claimDailyLoginReward } = require('./lib/dailyLoginModel');
            
            // Get user's WhatsApp JID
            let userPhone = req.session.user.phone;
            if (!userPhone.startsWith('+')) {
                if (userPhone.startsWith('62')) {
                    userPhone = '+' + userPhone;
                } else if (userPhone.startsWith('8')) {
                    userPhone = '+62' + userPhone;
                } else {
                    userPhone = '+' + userPhone;
                }
            }
            const userJid = userPhone.replace('+', '') + '@s.whatsapp.net';
            
            const result = await claimDailyLoginReward(userJid);
            
            if (result.success) {
                res.redirect('/home?claimed=true');
            } else {
                res.redirect('/home?error=' + encodeURIComponent(result.message));
            }
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            res.redirect('/home?error=Failed to claim reward');
        }
    });

    // QR code page (owner only)
    app.get('/qr', requireOwner, (req, res) => {
        const content = `
            <div class="card">
                <h1>📱 WhatsApp QR Code</h1>
                <p>Scan this QR code with WhatsApp to connect the bot.</p>
                <div id="qr-container" style="text-align: center; margin: 2rem 0;">
                    <div id="qr-code"></div>
                    <p style="margin-top: 1rem;"><strong>Status:</strong> <span id="connection-status">Checking...</span></p>
                </div>
                <div style="text-align: center;">
                    <button onclick="refreshQR()" class="btn">Refresh QR</button>
                </div>
            </div>
            
            <script>
                async function loadQR() {
                    try {
                        const response = await fetch('/api/qr');
                        const data = await response.json();
                        
                        if (data.qr) {
                            document.getElementById('qr-code').innerHTML = '<img src="' + data.qr + '" alt="QR Code" style="max-width: 300px; height: auto;">';
                            document.getElementById('connection-status').textContent = 'Ready to scan';
                        } else if (data.connected) {
                            document.getElementById('qr-code').innerHTML = '<div style="padding: 2rem; background: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; border-radius: 12px;"><h3 style="color: #10b981; margin: 0;">✅ Connected</h3><p style="margin: 0.5rem 0 0 0;">Bot is connected and ready!</p></div>';
                            document.getElementById('connection-status').textContent = 'Connected';
                        } else {
                            document.getElementById('qr-code').innerHTML = '<p>QR code not available</p>';
                            document.getElementById('connection-status').textContent = 'Not connected';
                        }
                    } catch (error) {
                        console.error('Error loading QR:', error);
                        document.getElementById('qr-code').innerHTML = '<p>Error loading QR code</p>';
                        document.getElementById('connection-status').textContent = 'Error';
                    }
                }
                
                function refreshQR() {
                    document.getElementById('qr-code').innerHTML = '<p>Loading...</p>';
                    document.getElementById('connection-status').textContent = 'Loading...';
                    loadQR();
                }
                
                // Load QR on page load
                loadQR();
                
                // Auto refresh every 30 seconds
                setInterval(loadQR, 30000);
            </script>
        `;
        res.send(getBaseTemplate('QR Code', content));
    });

    // QR API endpoint (owner only)
    app.get('/api/qr', requireOwner, (req, res) => {
        if (qrFunctions && qrFunctions.getQR) {
            const qrData = qrFunctions.getQR();
            res.json(qrData);
        } else {
            res.json({ qr: null, connected: false });
        }
    });

    // Setup profile routes from the separate module
    setupProfileRoutes(app);
    
    // Setup list routes from the separate module
    setupListRoutes(app);
}

module.exports = { setupDashboardRoutes };