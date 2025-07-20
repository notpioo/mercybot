const express = require('express');
const { getNavigationTemplate } = require('./navigation-system');

function setupProfileRoutes(app) {
    // Middleware to check authentication
    function requireAuth(req, res, next) {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        next();
    }

    // Profile-specific base template using navigation system
    function getProfileBaseTemplate(title, content, activePage = '') {
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
        .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        .btn-danger:hover {
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
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
        .profile-header {
            display: flex;
            align-items: center;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        .profile-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
        }
        .profile-info h1 {
            margin-bottom: 0.5rem;
        }
        .profile-stats {
            display: flex;
            gap: 2rem;
            margin-top: 1rem;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #6366f1;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #cccccc;
        }
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            .card {
                padding: 1.5rem;
            }
            .profile-header {
                flex-direction: column;
                text-align: center;
            }
            .profile-stats {
                justify-content: center;
                flex-wrap: wrap;
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

    // Profile page
    app.get('/profile', requireAuth, async (req, res) => {
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
                const content = `
                    <div class="card">
                        <div class="profile-header">
                            <div class="profile-avatar">
                                👤
                            </div>
                            <div class="profile-info">
                                <h1>${user.name || user.phone}</h1>
                                <p>Status: <strong style="color: ${getStatusColor(user.status)}">${getStatusName(user.status)}</strong></p>
                                <div class="profile-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">${user.balance || 0}</div>
                                        <div class="stat-label">Balance</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${user.chips || 0}</div>
                                        <div class="stat-label">Chips</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${user.limit === 'unlimited' ? '∞' : (user.limit || 30)}</div>
                                        <div class="stat-label">Daily Limit</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="card">
                            <h3>📱 Account Information</h3>
                            <p><strong>Phone:</strong> ${user.phone}</p>
                            <p><strong>Registered:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
                            <p><strong>Last Active:</strong> ${user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Unknown'}</p>
                        </div>

                        <div class="card">
                            <h3>⚠️ Warnings</h3>
                            <p>Current warnings: <strong>${user.warnings || 0}</strong></p>
                            <p>Maximum allowed: <strong>3</strong></p>
                            ${user.warnings >= 3 ? '<p style="color: #ef4444;">Account may be restricted due to warnings.</p>' : ''}
                        </div>

                        <div class="card">
                            <h3>🎮 Activity</h3>
                            <p>Commands used: <strong>${user.commandsUsed || 0}</strong></p>
                            <p>Games played: <strong>${user.gamesPlayed || 0}</strong></p>
                            <p>Total wins: <strong>${user.totalWins || 0}</strong></p>
                        </div>

                        <div class="card">
                            <h3>⚙️ Account Actions</h3>
                            <p>Manage your account settings and preferences.</p>
                            <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                                <a href="/logout" class="btn btn-danger">Logout</a>
                            </div>
                        </div>
                    </div>
                `;

                res.send(getProfileBaseTemplate('Profile', content, 'profile'));
            } else {
                const content = `
                    <div class="card">
                        <h1>👤 Profile</h1>
                        <p>Profile data not found. Please try logging in again.</p>
                        <a href="/logout" class="btn">Logout</a>
                    </div>
                `;
                res.send(getProfileBaseTemplate('Profile', content, 'profile'));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            const content = `
                <div class="card">
                    <h1>👤 Profile</h1>
                    <p>Error loading profile data. Please try again later.</p>
                    <a href="/home" class="btn">Back to Home</a>
                </div>
            `;
            res.send(getProfileBaseTemplate('Profile', content, 'profile'));
        }
    });
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        owner: '#ffd700',
        premium: '#8b5cf6',
        admin: '#10b981',
        basic: '#6b7280'
    };
    return colors[status] || colors.basic;
}

function getStatusName(status) {
    const names = {
        owner: 'Owner',
        premium: 'Premium',
        admin: 'Admin',
        basic: 'Basic'
    };
    return names[status] || names.basic;
}

module.exports = { setupProfileRoutes };