const express = require('express');
const path = require('path');
const config = require('../config/config');

// Import middleware
const { requireAuth, requireOwner } = require('./middleware');

// Import route handlers
const { setupHomeRoutes } = require('./routes/home');
const { setupNewsRoutes } = require('./routes/news');
const { setupProfileRoutes } = require('./routes/profile');
const { setupApiRoutes } = require('./routes/api');
const { setupAdminRoutes } = require('./routes/admin');

function setupDashboardRoutes(app, qrFunctions) {
    // Setup all route handlers
    setupHomeRoutes(app);
    setupNewsRoutes(app);
    setupProfileRoutes(app);
    setupApiRoutes(app);
    setupAdminRoutes(app);

    // Additional routes that were in the original dashboard-system.js
    // These are the remaining routes that haven't been moved to separate files

    // List routes
    app.get('/list/shop', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🛒 Shop</h1>
                    <p>Purchase items and upgrades for your account.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The shop feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Shop', content, 'list'));
        } catch (error) {
            console.error('Error loading shop page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/quiz', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🧠 Quiz</h1>
                    <p>Test your knowledge and earn rewards.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The quiz feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Quiz', content, 'list'));
        } catch (error) {
            console.error('Error loading quiz page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/redeem', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🎁 Redeem</h1>
                    <p>Redeem your rewards and claim prizes.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The redeem feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Redeem', content, 'list'));
        } catch (error) {
            console.error('Error loading redeem page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/inventory', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🎒 Inventory</h1>
                    <p>View your collected items and inventory.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The inventory feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Inventory', content, 'list'));
        } catch (error) {
            console.error('Error loading inventory page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/members', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>👤 Members</h1>
                    <p>View squad members and their information.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The members feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Members', content, 'list'));
        } catch (error) {
            console.error('Error loading members page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/tournament', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🏅 Tournament</h1>
                    <p>Join tournaments and compete with others.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The tournament feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Tournament', content, 'list'));
        } catch (error) {
            console.error('Error loading tournament page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/division', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>⚔️ Division</h1>
                    <p>View division rankings and battles.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The division feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Division', content, 'list'));
        } catch (error) {
            console.error('Error loading division page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/mine', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>💎 Mine</h1>
                    <p>Play the mines casino game and win chips.</p>
                    <div class="mine-redirect">
                        <h3>🎰 Play Mines Game</h3>
                        <p>Click the button below to play the mines game.</p>
                        <a href="/games/mines" class="btn">Play Now</a>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Mine', content, 'list'));
        } catch (error) {
            console.error('Error loading mine page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/tower', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🗼 Tower</h1>
                    <p>Climb the tower and earn rewards.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The tower feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Tower', content, 'list'));
        } catch (error) {
            console.error('Error loading tower page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/list/coinflip', requireAuth, async (req, res) => {
        try {
            const { getBaseTemplate } = require('./templates');
            const content = `
                <div class="card">
                    <h1>🪙 Coinflip</h1>
                    <p>Flip coins and test your luck.</p>
                    <div class="coming-soon">
                        <h3>Coming Soon!</h3>
                        <p>The coinflip feature is currently under development.</p>
                    </div>
                </div>
            `;
            res.send(getBaseTemplate('Coinflip', content, 'list'));
        } catch (error) {
            console.error('Error loading coinflip page:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Add styles for coming soon pages
    const comingSoonStyles = `
        <style>
            .coming-soon {
                text-align: center;
                padding: 3rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                margin-top: 2rem;
            }
            .coming-soon h3 {
                color: #6366f1;
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            .coming-soon p {
                color: #cccccc;
                font-size: 1.1rem;
            }
            .mine-redirect {
                text-align: center;
                padding: 3rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                margin-top: 2rem;
            }
            .mine-redirect h3 {
                color: #6366f1;
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            .mine-redirect p {
                color: #cccccc;
                font-size: 1.1rem;
                margin-bottom: 2rem;
            }
        </style>
    `;

    // Add styles to each page
    app.use((req, res, next) => {
        if (req.path.startsWith('/list/')) {
            const originalSend = res.send;
            res.send = function(data) {
                if (typeof data === 'string') {
                    data = data.replace('</head>', comingSoonStyles + '</head>');
                }
                originalSend.call(this, data);
            };
        }
        next();
    });
}

module.exports = { setupDashboardRoutes };