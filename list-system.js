
const express = require('express');
const { getNavigationTemplate } = require('./navigation-system');

function setupListRoutes(app) {
    // Middleware to check authentication
    function requireAuth(req, res, next) {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        next();
    }

    // List-specific base template using navigation system
    function getListBaseTemplate(title, content, activePage = '') {
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

    // Leaderboard page
    app.get('/list/leaderboard', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🏆 Leaderboard</h1>
                <p>View top users and their rankings based on balance, activity, and achievements.</p>
            </div>
            
            <div class="card">
                <h2>📊 Coming Soon</h2>
                <p>Leaderboard features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Leaderboard', content, 'list/leaderboard'));
    });

    // Shop page
    app.get('/list/shop', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🛒 Shop</h1>
                <p>Browse available items and services you can purchase with your balance.</p>
            </div>
            
            <div class="card">
                <h2>🏪 Coming Soon</h2>
                <p>Shop features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Shop', content, 'list/shop'));
    });

    // Quiz page
    app.get('/list/quiz', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🧠 Quiz</h1>
                <p>Test your knowledge and earn rewards with various quiz challenges.</p>
            </div>
            
            <div class="card">
                <h2>🎯 Coming Soon</h2>
                <p>Quiz features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Quiz', content, 'list/quiz'));
    });

    // Redeem page
    app.get('/list/redeem', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🎁 Redeem</h1>
                <p>Redeem your rewards and exchange points for various benefits.</p>
            </div>
            
            <div class="card">
                <h2>🎊 Coming Soon</h2>
                <p>Redeem features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Redeem', content, 'list/redeem'));
    });

    // Members page
    app.get('/list/members', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>👤 Members</h1>
                <p>View and manage squad members and their activities.</p>
            </div>
            
            <div class="card">
                <h2>👥 Coming Soon</h2>
                <p>Member management features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Members', content, 'list/members'));
    });

    // Tournament page
    app.get('/list/tournament', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🏅 Tournament</h1>
                <p>Participate in competitive tournaments and win amazing prizes.</p>
            </div>
            
            <div class="card">
                <h2>🎮 Coming Soon</h2>
                <p>Tournament features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Tournament', content, 'list/tournament'));
    });

    // Division page
    app.get('/list/division', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>⚔️ Division</h1>
                <p>Battle in division matches and climb the competitive ladder.</p>
            </div>
            
            <div class="card">
                <h2>⚡ Coming Soon</h2>
                <p>Division battle features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Division', content, 'list/division'));
    });

    // Mine page
    app.get('/list/mine', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>💎 Mine</h1>
                <p>Try your luck in the mines and discover hidden treasures.</p>
            </div>
            
            <div class="card">
                <h2>⛏️ Coming Soon</h2>
                <p>Mining game features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Mine', content, 'list/mine'));
    });

    // Tower page
    app.get('/list/tower', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🗼 Tower</h1>
                <p>Climb the tower of challenges and reach new heights.</p>
            </div>
            
            <div class="card">
                <h2>🏗️ Coming Soon</h2>
                <p>Tower game features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Tower', content, 'list/tower'));
    });

    // Coinflip page
    app.get('/list/coinflip', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🪙 Coinflip</h1>
                <p>Test your luck with classic coin flip gambling games.</p>
            </div>
            
            <div class="card">
                <h2>🎲 Coming Soon</h2>
                <p>Coinflip game features are currently under development. Check back soon!</p>
            </div>
        `;
        res.send(getListBaseTemplate('Coinflip', content, 'list/coinflip'));
    });
}

module.exports = { setupListRoutes };
