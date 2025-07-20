const express = require('express');
const path = require('path');
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

    // Note: Root route '/' is handled by web-server.js

    // Navigation template function
    function getNavigationTemplate(activePage = '') {
        return `
        <style>
            /* Navigation Styles */
            .nav-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                background: rgba(15, 15, 15, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .nav-desktop {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .nav-logo {
                font-size: 1.5rem;
                font-weight: 700;
                color: #ffffff;
                text-decoration: none;
            }
            
            .nav-links {
                display: flex;
                gap: 2rem;
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .nav-links > li {
                position: relative;
            }
            
            .nav-links a,
            .nav-links .nav-dropdown-toggle {
                color: #cccccc;
                text-decoration: none;
                font-weight: 500;
                transition: color 0.3s ease;
                position: relative;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                font-family: inherit;
                padding: 0;
            }
            
            .nav-links a:hover,
            .nav-links a.active,
            .nav-links .nav-dropdown-toggle:hover,
            .nav-links .nav-dropdown-toggle.active {
                color: #6366f1;
            }
            
            .nav-links a.active::after,
            .nav-links .nav-dropdown-toggle.active::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 0;
                right: 0;
                height: 2px;
                background: #6366f1;
                border-radius: 1px;
            }
            
            /* Desktop Dropdown */
            .nav-dropdown {
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(20, 20, 20, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 1.5rem;
                margin-top: 1rem;
                min-width: 600px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .nav-dropdown.show {
                opacity: 1;
                visibility: visible;
            }
            
            .dropdown-content {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2rem;
            }
            
            .dropdown-section {
                text-align: center;
            }
            
            .dropdown-section h4 {
                color: #ffffff;
                font-size: 1.1rem;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid #6366f1;
            }
            
            .dropdown-section ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .dropdown-section li {
                margin: 0.5rem 0;
            }
            
            .dropdown-section a {
                color: #cccccc;
                text-decoration: none;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                border-radius: 8px;
                transition: all 0.3s ease;
            }
            
            .dropdown-section a:hover {
                background: rgba(99, 102, 241, 0.1);
                color: #6366f1;
            }
            
            /* Currency Navigation */
            .nav-currency {
                display: flex;
                gap: 1rem;
                align-items: center;
            }
            
            .currency-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .currency-icon {
                font-size: 1rem;
            }
            
            /* Mobile Top Navigation */
            .nav-mobile-top {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(15, 15, 15, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding: 1rem 2rem;
                z-index: 1000;
                justify-content: space-between;
                align-items: center;
            }
            
            .nav-mobile-logo {
                font-size: 1.2rem;
                font-weight: 700;
                color: #ffffff;
            }
            
            .nav-mobile-currency {
                display: flex;
                gap: 0.75rem;
            }
            
            .nav-mobile-currency .currency-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 0.4rem 0.8rem;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            /* Mobile Bottom Navigation */
            .nav-mobile {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(15, 15, 15, 0.95);
                backdrop-filter: blur(10px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding: 1rem 0;
                z-index: 1000;
            }
            
            .nav-mobile-links {
                display: flex;
                justify-content: space-around;
                align-items: center;
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .nav-mobile-links a,
            .nav-mobile-links button {
                color: #cccccc;
                text-decoration: none;
                font-size: 0.75rem;
                font-weight: 500;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                transition: color 0.3s ease;
                background: none;
                border: none;
                cursor: pointer;
                font-family: inherit;
            }
            
            .nav-mobile-links a:hover,
            .nav-mobile-links a.active,
            .nav-mobile-links button:hover,
            .nav-mobile-links button.active {
                color: #6366f1;
            }
            
            .nav-mobile-links .nav-icon {
                font-size: 1.25rem;
            }
            
            /* Mobile Bottom Sheet */
            .mobile-bottom-sheet {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(15, 15, 15, 0.98);
                backdrop-filter: blur(20px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px 20px 0 0;
                padding: 2rem;
                z-index: 1001;
                transform: translateY(100%);
                transition: transform 0.3s ease;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .mobile-bottom-sheet.show {
                transform: translateY(0);
            }
            
            .bottom-sheet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }
            
            .bottom-sheet-header h3 {
                color: #ffffff;
                font-size: 1.3rem;
                margin: 0;
            }
            
            .close-bottom-sheet {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #ffffff;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
            }
            
            .bottom-sheet-tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .bottom-sheet-tab {
                background: none;
                border: none;
                color: #cccccc;
                font-size: 1rem;
                font-weight: 500;
                padding: 1rem 0;
                cursor: pointer;
                position: relative;
                flex: 1;
                text-align: center;
                transition: color 0.3s ease;
            }
            
            .bottom-sheet-tab.active {
                color: #6366f1;
            }
            
            .bottom-sheet-tab.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: #6366f1;
            }
            
            .bottom-sheet-content {
                display: none;
            }
            
            .bottom-sheet-content.active {
                display: block;
            }
            
            .bottom-sheet-section ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .bottom-sheet-section li {
                margin: 1rem 0;
            }
            
            .bottom-sheet-section a {
                color: #cccccc;
                text-decoration: none;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.05);
                transition: all 0.3s ease;
            }
            
            .bottom-sheet-section a:hover {
                background: rgba(99, 102, 241, 0.1);
                color: #6366f1;
            }
            
            .bottom-sheet-section .icon {
                font-size: 1.3rem;
                width: 24px;
                text-align: center;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .nav-desktop {
                    display: none;
                }
                .nav-mobile-top {
                    display: flex;
                }
                .nav-mobile {
                    display: block;
                }
                body {
                    padding-top: 70px;
                    padding-bottom: 80px;
                }
            }
            
            @media (min-width: 769px) {
                body {
                    padding-top: 80px;
                }
                .mobile-bottom-sheet {
                    display: none;
                }
            }
        </style>
        
        <nav class="nav-container">
            <div class="nav-desktop">
                <a href="/home" class="nav-logo">⚡ NoMercy</a>
                <ul class="nav-links">
                    <li><a href="/home" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="/news" class="${activePage === 'news' ? 'active' : ''}">News</a></li>
                    <li><a href="/profile" class="${activePage === 'profile' ? 'active' : ''}">Profile</a></li>
                    <li class="nav-dropdown-container">
                        <button class="nav-dropdown-toggle ${activePage.startsWith('list') ? 'active' : ''}" onclick="toggleDropdown()">
                            List ▼
                        </button>
                        <div class="nav-dropdown" id="nav-dropdown">
                            <div class="dropdown-content">
                                <div class="dropdown-section">
                                    <h4>🎯 Main</h4>
                                    <ul>
                                        <li><a href="/list/leaderboard">🏆 Leaderboard</a></li>
                                        <li><a href="/list/shop">🛒 Shop</a></li>
                                        <li><a href="/list/quiz">🧠 Quiz</a></li>
                                        <li><a href="/list/redeem">🎁 Redeem</a></li>
                                    </ul>
                                </div>
                                <div class="dropdown-section">
                                    <h4>👥 Squad</h4>
                                    <ul>
                                        <li><a href="/list/members">👤 Members</a></li>
                                        <li><a href="/list/tournament">🏅 Tournament</a></li>
                                        <li><a href="/list/division">⚔️ Division</a></li>
                                    </ul>
                                </div>
                                <div class="dropdown-section">
                                    <h4>🎰 Casino</h4>
                                    <ul>
                                        <li><a href="/list/mine">💎 Mine</a></li>
                                        <li><a href="/list/tower">🗼 Tower</a></li>
                                        <li><a href="/list/coinflip">🪙 Coinflip</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="nav-currency">
                    <div class="currency-item">
                        <span class="currency-icon">💵</span>
                        <span id="nav-balance">-</span>
                    </div>
                    <div class="currency-item">
                        <span class="currency-icon">🎰</span>
                        <span id="nav-chips">-</span>
                    </div>
                </div>
            </div>
        </nav>
        
        <div class="nav-mobile-top">
            <div class="nav-mobile-logo">⚡ NoMercy</div>
            <div class="nav-mobile-currency">
                <div class="currency-item">
                    <span class="currency-icon">💵</span>
                    <span id="nav-balance-mobile">-</span>
                </div>
                <div class="currency-item">
                    <span class="currency-icon">🎰</span>
                    <span id="nav-chips-mobile">-</span>
                </div>
            </div>
        </div>
        
        <nav class="nav-mobile">
            <ul class="nav-mobile-links">
                <li><a href="/home" class="${activePage === 'home' ? 'active' : ''}">
                    <span class="nav-icon">🏠</span>
                    <span>Home</span>
                </a></li>
                <li><a href="/news" class="${activePage === 'news' ? 'active' : ''}">
                    <span class="nav-icon">📰</span>
                    <span>News</span>
                </a></li>
                <li><a href="/profile" class="${activePage === 'profile' ? 'active' : ''}">
                    <span class="nav-icon">👤</span>
                    <span>Profile</span>
                </a></li>
                <li><button onclick="toggleMobileBottomSheet()" class="${activePage.startsWith('list') ? 'active' : ''}">
                    <span class="nav-icon">📋</span>
                    <span>List</span>
                </button></li>
            </ul>
        </nav>
        
        <!-- Mobile Bottom Sheet -->
        <div class="mobile-bottom-sheet" id="mobile-bottom-sheet">
            <div class="bottom-sheet-header">
                <h3>Menu List</h3>
                <button class="close-bottom-sheet" onclick="toggleMobileBottomSheet()">×</button>
            </div>
            
            <div class="bottom-sheet-tabs">
                <button class="bottom-sheet-tab active" onclick="switchBottomSheetTab('main')">Main</button>
                <button class="bottom-sheet-tab" onclick="switchBottomSheetTab('squad')">Squad</button>
                <button class="bottom-sheet-tab" onclick="switchBottomSheetTab('casino')">Casino</button>
            </div>
            
            <div class="bottom-sheet-content active" id="main-content">
                <div class="bottom-sheet-section">
                    <ul>
                        <li><a href="/list/leaderboard"><span class="icon">🏆</span> Leaderboard</a></li>
                        <li><a href="/list/shop"><span class="icon">🛒</span> Shop</a></li>
                        <li><a href="/list/quiz"><span class="icon">🧠</span> Quiz</a></li>
                        <li><a href="/list/redeem"><span class="icon">🎁</span> Redeem</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="bottom-sheet-content" id="squad-content">
                <div class="bottom-sheet-section">
                    <ul>
                        <li><a href="/list/members"><span class="icon">👤</span> Members</a></li>
                        <li><a href="/list/tournament"><span class="icon">🏅</span> Tournament</a></li>
                        <li><a href="/list/division"><span class="icon">⚔️</span> Division</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="bottom-sheet-content" id="casino-content">
                <div class="bottom-sheet-section">
                    <ul>
                        <li><a href="/list/mine"><span class="icon">💎</span> Mine</a></li>
                        <li><a href="/list/tower"><span class="icon">🗼</span> Tower</a></li>
                        <li><a href="/list/coinflip"><span class="icon">🪙</span> Coinflip</a></li>
                    </ul>
                </div>
            </div>
        </div>
        
        <script>
            // Function to update navigation currency
            async function updateNavCurrency() {
                try {
                    const response = await fetch('/api/user-currency');
                    const data = await response.json();
                    
                    if (data.success) {
                        // Update desktop navigation
                        const balanceEl = document.getElementById('nav-balance');
                        const chipsEl = document.getElementById('nav-chips');
                        
                        // Update mobile navigation
                        const balanceMobileEl = document.getElementById('nav-balance-mobile');
                        const chipsMobileEl = document.getElementById('nav-chips-mobile');
                        
                        if (balanceEl) balanceEl.textContent = data.balance;
                        if (chipsEl) chipsEl.textContent = data.chips;
                        if (balanceMobileEl) balanceMobileEl.textContent = data.balance;
                        if (chipsMobileEl) chipsMobileEl.textContent = data.chips;
                    }
                } catch (error) {
                    console.error('Error updating nav currency:', error);
                }
            }
            
            // Desktop dropdown functionality
            function toggleDropdown() {
                const dropdown = document.getElementById('nav-dropdown');
                dropdown.classList.toggle('show');
            }
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(event) {
                const dropdown = document.getElementById('nav-dropdown');
                const toggle = document.querySelector('.nav-dropdown-toggle');
                
                if (!dropdown.contains(event.target) && !toggle.contains(event.target)) {
                    dropdown.classList.remove('show');
                }
            });
            
            // Mobile bottom sheet functionality
            function toggleMobileBottomSheet() {
                const bottomSheet = document.getElementById('mobile-bottom-sheet');
                bottomSheet.classList.toggle('show');
            }
            
            function switchBottomSheetTab(tabName) {
                // Remove active class from all tabs and contents
                document.querySelectorAll('.bottom-sheet-tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.bottom-sheet-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                event.target.classList.add('active');
                document.getElementById(tabName + '-content').classList.add('active');
            }
            
            // Update currency when page loads
            document.addEventListener('DOMContentLoaded', updateNavCurrency);
            
            // Update currency every 30 seconds
            setInterval(updateNavCurrency, 30000);
        </script>
        `;
    }

    // Base page template
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
            if (dailyLoginStatus) {
                const rewardIcons = {
                    'balance': '💰',
                    'chips': '🎰',
                    'premium': '⭐'
                };
                
                const nextReward = dailyLoginStatus.nextReward;
                const canClaim = dailyLoginStatus.canClaim;
                
                let rewardText = 'No reward';
                if (nextReward) {
                    if (nextReward.rewardType === 'premium') {
                        rewardText = `${rewardIcons[nextReward.rewardType]} Premium ${nextReward.premiumDuration || 1} hari`;
                    } else {
                        rewardText = `${rewardIcons[nextReward.rewardType]} ${nextReward.rewardAmount} ${nextReward.rewardType}`;
                    }
                }
                
                dailyLoginSection = `
                    <div class="daily-login-card">
                        <div class="daily-login-header">
                            <h3>🗓️ Daily Login</h3>
                            <div class="streak-display">
                                <span class="streak-number">${dailyLoginStatus.currentStreak}</span>
                                <span class="streak-label">Streak</span>
                            </div>
                        </div>
                        
                        <div class="daily-login-content">
                            <div class="reward-preview">
                                <div class="next-reward">
                                    <span class="reward-label">Day ${dailyLoginStatus.currentDay} Reward:</span>
                                    <span class="reward-value">${rewardText}</span>
                                </div>
                            </div>
                            
                            <div class="login-days">
                                ${dailyLoginStatus.rewards.map(reward => {
                                    const dayIcon = rewardIcons[reward.rewardType];
                                    const isCurrentDay = reward.day === dailyLoginStatus.currentDay;
                                    const isCompleted = reward.day < dailyLoginStatus.currentDay || 
                                        (dailyLoginStatus.currentDay === 1 && reward.day <= 7 && dailyLoginStatus.currentStreak > 0);
                                    
                                    return `
                                        <div class="day-item ${isCurrentDay ? 'current' : ''} ${isCompleted ? 'completed' : ''}">
                                            <div class="day-number">Day ${reward.day}</div>
                                            <div class="day-icon">${dayIcon}</div>
                                            <div class="day-reward">
                                                ${reward.rewardType === 'premium' ? 
                                                    `${reward.premiumDuration || 1}d Premium` : 
                                                    `${reward.rewardAmount} ${reward.rewardType}`}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            
                            <div class="claim-section">
                                ${canClaim ? `
                                    <button class="claim-btn" onclick="claimDailyLogin()">
                                        🎁 Claim Daily Reward
                                    </button>
                                ` : `
                                    <div class="claim-status">
                                        ${dailyLoginStatus.reason === 'already_claimed_today' ? 
                                            '✅ Already claimed today! Come back tomorrow.' : 
                                            '⏰ Come back tomorrow to claim your reward!'}
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            const content = `
                <div class="card">
                    <h1>Welcome to NoMercy</h1>
                    <p>Hello <strong>${req.session.user.phone}</strong>, welcome to the advanced WhatsApp bot management system.</p>
                    <p>Manage your bot, track analytics, and control your WhatsApp automation from this powerful dashboard.</p>
                </div>
                
                ${dailyLoginSection}
                
                <div class="grid">
                    <div class="card">
                        <h3>🤖 Bot Status</h3>
                        <p>Your WhatsApp bot is currently active and processing messages.</p>
                        <p style="color: #10b981; font-weight: 600;">✅ Online & Connected</p>
                    </div>
                    
                    <div class="card">
                        <h3>📊 Quick Stats</h3>
                        <p>Monitor your bot's performance and user engagement.</p>
                        <p style="color: #6366f1; font-weight: 600;">📈 All Systems Operational</p>
                    </div>
                    
                    ${req.session.user.role === 'owner' ? `
                    <div class="card">
                        <h3>⚙️ Admin Panel</h3>
                        <p>Access advanced bot management features.</p>
                        <a href="/admin" class="btn">Open Admin Panel</a>
                    </div>
                    ` : ''}
                </div>
                
                <style>
                    .daily-login-card {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 20px;
                        padding: 2rem;
                        margin-bottom: 2rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .daily-login-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                    }
                    
                    .daily-login-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1.5rem;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .daily-login-header h3 {
                        margin: 0;
                        color: white;
                        font-size: 1.5rem;
                    }
                    
                    .streak-display {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 1rem;
                        border-radius: 15px;
                        backdrop-filter: blur(10px);
                    }
                    
                    .streak-number {
                        display: block;
                        font-size: 2rem;
                        font-weight: 700;
                        color: white;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    
                    .streak-label {
                        font-size: 0.9rem;
                        color: rgba(255, 255, 255, 0.9);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .daily-login-content {
                        position: relative;
                        z-index: 2;
                    }
                    
                    .reward-preview {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        margin-bottom: 2rem;
                        text-align: center;
                        backdrop-filter: blur(10px);
                    }
                    
                    .next-reward {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .reward-label {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 1rem;
                    }
                    
                    .reward-value {
                        color: white;
                        font-weight: 700;
                        font-size: 1.2rem;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    
                    .login-days {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 0.5rem;
                        margin-bottom: 2rem;
                    }
                    
                    .day-item {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 1rem 0.5rem;
                        border-radius: 12px;
                        text-align: center;
                        border: 2px solid transparent;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .day-item.current {
                        border-color: #ffd700;
                        background: rgba(255, 215, 0, 0.2);
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
                    }
                    
                    .day-item.completed {
                        background: rgba(16, 185, 129, 0.3);
                        border-color: #10b981;
                    }
                    
                    .day-number {
                        font-size: 0.8rem;
                        color: rgba(255, 255, 255, 0.8);
                        margin-bottom: 0.5rem;
                    }
                    
                    .day-icon {
                        font-size: 1.5rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .day-reward {
                        font-size: 0.7rem;
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 500;
                    }
                    
                    .claim-section {
                        text-align: center;
                    }
                    
                    .claim-btn {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 15px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                    }
                    
                    .claim-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                    }
                    
                    .claim-status {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 1rem;
                        font-weight: 500;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                    }
                    
                    @media (max-width: 768px) {
                        .daily-login-header {
                            flex-direction: column;
                            gap: 1rem;
                        }
                        
                        .next-reward {
                            flex-direction: column;
                            gap: 0.5rem;
                        }
                        
                        .login-days {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 0.75rem;
                        }
                        
                        .day-item {
                            padding: 0.75rem 0.25rem;
                        }
                    }
                </style>
                
                <script>
                    async function claimDailyLogin() {
                        try {
                            const claimBtn = document.querySelector('.claim-btn');
                            claimBtn.disabled = true;
                            claimBtn.textContent = '⏳ Claiming...';
                            
                            const response = await fetch('/api/daily-login/claim', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                // Show success message
                                alert(\`🎉 Daily Login Claimed!\\n\\n\` +
                                      \`🏆 Streak: \${data.streak}\\n\` +
                                      \`🎁 Reward: \${data.reward}\\n\\n\` +
                                      \`Come back tomorrow for more rewards!\`);
                                
                                // Reload page to update UI
                                window.location.reload();
                            } else {
                                alert('❌ Failed to claim daily login: ' + (data.message || 'Unknown error'));
                                claimBtn.disabled = false;
                                claimBtn.textContent = '🎁 Claim Daily Reward';
                            }
                        } catch (error) {
                            console.error('Error claiming daily login:', error);
                            alert('❌ Error claiming daily login. Please try again.');
                            const claimBtn = document.querySelector('.claim-btn');
                            claimBtn.disabled = false;
                            claimBtn.textContent = '🎁 Claim Daily Reward';
                        }
                    }
                </script>
            `;
            
            res.send(getBaseTemplate('Home', content, 'home'));
        } catch (error) {
            console.error('Error loading home page:', error);
            const content = `
                <div class="card">
                    <h1>Welcome to NoMercy</h1>
                    <p>Hello <strong>${req.session.user.phone}</strong>, welcome to the advanced WhatsApp bot management system.</p>
                    <p>There was an error loading some features. Please refresh the page.</p>
                </div>
            `;
            res.send(getBaseTemplate('Home', content, 'home'));
        }
    });

    // News page
    app.get('/news', requireAuth, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.find({ isActive: true }).sort({ priority: -1, createdAt: -1 }).limit(10);
            
            const getCategoryIcon = (category) => {
                switch(category) {
                    case 'hot': return '🔥';
                    case 'announcement': return '📢';
                    case 'event': return '🎉';
                    case 'update': return '🆕';
                    default: return '📰';
                }
            };
            
            const getCategoryColor = (category) => {
                switch(category) {
                    case 'hot': return '#ef4444';
                    case 'announcement': return '#10b981';
                    case 'event': return '#f59e0b';
                    case 'update': return '#6366f1';
                    default: return '#6b7280';
                }
            };
            
            let newsContent = '';
            
            if (news.length === 0) {
                newsContent = `
                    <div class="card">
                        <h3>📰 No News Available</h3>
                        <p>There are no news updates at the moment. Check back later for the latest announcements and updates.</p>
                    </div>
                `;
            } else {
                newsContent = news.map(item => `
                    <div class="card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <span style="font-size: 1.5rem;">${getCategoryIcon(item.category)}</span>
                            <h3 style="margin: 0;">${item.title}</h3>
                            <span style="background: ${getCategoryColor(item.category)}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">${item.category}</span>
                        </div>
                        <p style="margin-bottom: 1rem;">${item.content}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #9ca3af;">
                            <span>By ${item.author}</span>
                            <span>${new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>
                `).join('');
            }
            
            const content = `
                <div class="card">
                    <h1>📰 Latest News</h1>
                    <p>Stay updated with the latest announcements and updates from NoMercy.</p>
                </div>
                
                ${newsContent}
            `;
            
            res.send(getBaseTemplate('News', content, 'news'));
        } catch (error) {
            console.error('Error fetching news:', error);
            const content = `
                <div class="card">
                    <h1>📰 Latest News</h1>
                    <p>Sorry, we couldn't load the news at the moment. Please try again later.</p>
                </div>
            `;
            res.send(getBaseTemplate('News', content, 'news'));
        }
    });

    // List pages - Main section
    app.get('/list/leaderboard', requireAuth, async (req, res) => {
        try {
            const { User } = require('./lib/database');
            
            // Get top 10 users by balance
            const topBalance = await User.find({ balance: { $gt: 0 } })
                .sort({ balance: -1 })
                .limit(10)
                .select('name jid balance');
            
            // Get top 10 users by chips
            const topChips = await User.find({ chips: { $gt: 0 } })
                .sort({ chips: -1 })
                .limit(10)
                .select('name jid chips');
            
            const formatPhoneNumber = (jid) => {
                return jid.split('@')[0];
            };
            
            const formatName = (name, jid) => {
                if (name && name !== 'Unknown') {
                    return name;
                }
                return formatPhoneNumber(jid);
            };
            
            const generatePodium = (topUsers, type) => {
                const podiumData = topUsers.slice(0, 3);
                while (podiumData.length < 3) {
                    podiumData.push(null);
                }
                
                return `
                    <div class="podium-container">
                        <div class="podium">
                            <!-- Second Place -->
                            <div class="podium-place second ${!podiumData[1] ? 'empty' : ''}">
                                <div class="podium-trophy">🥈</div>
                                <div class="podium-rank">2</div>
                                <div class="podium-info">
                                    ${podiumData[1] ? `
                                        <div class="podium-name">${formatName(podiumData[1].name, podiumData[1].jid)}</div>
                                        <div class="podium-phone">${formatPhoneNumber(podiumData[1].jid)}</div>
                                        <div class="podium-value">${type === 'balance' ? podiumData[1].balance : podiumData[1].chips}</div>
                                    ` : '<div class="empty-text">No Data</div>'}
                                </div>
                                <div class="podium-bar second-bar"></div>
                            </div>
                            
                            <!-- First Place -->
                            <div class="podium-place first ${!podiumData[0] ? 'empty' : ''}">
                                <div class="podium-crown">👑</div>
                                <div class="podium-trophy">🥇</div>
                                <div class="podium-rank">1</div>
                                <div class="podium-info">
                                    ${podiumData[0] ? `
                                        <div class="podium-name">${formatName(podiumData[0].name, podiumData[0].jid)}</div>
                                        <div class="podium-phone">${formatPhoneNumber(podiumData[0].jid)}</div>
                                        <div class="podium-value">${type === 'balance' ? podiumData[0].balance : podiumData[0].chips}</div>
                                    ` : '<div class="empty-text">No Data</div>'}
                                </div>
                                <div class="podium-bar first-bar"></div>
                            </div>
                            
                            <!-- Third Place -->
                            <div class="podium-place third ${!podiumData[2] ? 'empty' : ''}">
                                <div class="podium-trophy">🥉</div>
                                <div class="podium-rank">3</div>
                                <div class="podium-info">
                                    ${podiumData[2] ? `
                                        <div class="podium-name">${formatName(podiumData[2].name, podiumData[2].jid)}</div>
                                        <div class="podium-phone">${formatPhoneNumber(podiumData[2].jid)}</div>
                                        <div class="podium-value">${type === 'balance' ? podiumData[2].balance : podiumData[2].chips}</div>
                                    ` : '<div class="empty-text">No Data</div>'}
                                </div>
                                <div class="podium-bar third-bar"></div>
                            </div>
                        </div>
                    </div>
                `;
            };
            
            const generateTable = (users, type, startRank = 4) => {
                if (users.length <= 3) {
                    return '<div class="no-more-data">📊 Tidak ada data tambahan untuk ditampilkan</div>';
                }
                
                const tableUsers = users.slice(3);
                return `
                    <div class="leaderboard-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>${type === 'balance' ? 'Balance' : 'Chips'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableUsers.map((user, index) => `
                                    <tr>
                                        <td><span class="rank-number">${startRank + index}</span></td>
                                        <td><span class="user-name">${formatName(user.name, user.jid)}</span></td>
                                        <td><span class="phone-number">${formatPhoneNumber(user.jid)}</span></td>
                                        <td><span class="value-amount">${type === 'balance' ? user.balance : user.chips}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            };
            
            const content = `
                <div class="card">
                    <h1>🏆 Leaderboard</h1>
                    <p>Lihat peringkat top player dengan balance dan chips terbanyak.</p>
                </div>
                
                <!-- Leaderboard Cards -->
                <div class="leaderboard-cards">
                    <div class="leaderboard-card ${true ? 'active' : ''}" onclick="showLeaderboard('balance')">
                        <div class="card-icon">💰</div>
                        <div class="card-info">
                            <h3>Balance Leaders</h3>
                            <p>Top players dengan balance terbanyak</p>
                        </div>
                    </div>
                    
                    <div class="leaderboard-card" onclick="showLeaderboard('chips')">
                        <div class="card-icon">🎰</div>
                        <div class="card-info">
                            <h3>Chips Leaders</h3>
                            <p>Top players dengan chips terbanyak</p>
                        </div>
                    </div>
                    
                    <div class="leaderboard-card coming-soon">
                        <div class="card-icon">🎯</div>
                        <div class="card-info">
                            <h3>Casino Champions</h3>
                            <p>Coming Soon...</p>
                        </div>
                        <div class="coming-soon-badge">🚀 Soon</div>
                    </div>
                </div>
                
                <!-- Balance Leaderboard -->
                <div id="balance-leaderboard" class="leaderboard-content active">
                    <div class="card">
                        <h2>💰 Balance Leaderboard</h2>
                        ${generatePodium(topBalance, 'balance')}
                        ${generateTable(topBalance, 'balance')}
                    </div>
                </div>
                
                <!-- Chips Leaderboard -->
                <div id="chips-leaderboard" class="leaderboard-content">
                    <div class="card">
                        <h2>🎰 Chips Leaderboard</h2>
                        ${generatePodium(topChips, 'chips')}
                        ${generateTable(topChips, 'chips')}
                    </div>
                </div>
                
                <style>
                    .leaderboard-cards {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    
                    .leaderboard-card {
                        background: rgba(30, 30, 30, 0.95);
                        border-radius: 15px;
                        padding: 1.5rem;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .leaderboard-card:hover {
                        transform: translateY(-5px);
                        border-color: #6366f1;
                        box-shadow: 0 15px 40px rgba(99, 102, 241, 0.2);
                    }
                    
                    .leaderboard-card.active {
                        border-color: #6366f1;
                        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
                    }
                    
                    .leaderboard-card.coming-soon {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    
                    .leaderboard-card.coming-soon:hover {
                        transform: none;
                        border-color: rgba(255, 255, 255, 0.1);
                        box-shadow: none;
                    }
                    
                    .card-icon {
                        font-size: 2.5rem;
                        opacity: 0.9;
                    }
                    
                    .card-info h3 {
                        color: #ffffff;
                        margin: 0 0 0.5rem 0;
                        font-size: 1.2rem;
                    }
                    
                    .card-info p {
                        color: #cccccc;
                        margin: 0;
                        font-size: 0.9rem;
                    }
                    
                    .coming-soon-badge {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 600;
                    }
                    
                    .leaderboard-content {
                        display: none;
                    }
                    
                    .leaderboard-content.active {
                        display: block;
                    }
                    
                    /* Podium Styles */
                    .podium-container {
                        display: flex;
                        justify-content: center;
                        margin: 2rem 0;
                    }
                    
                    .podium {
                        display: flex;
                        align-items: end;
                        gap: 1rem;
                        max-width: 600px;
                        width: 100%;
                    }
                    
                    .podium-place {
                        flex: 1;
                        text-align: center;
                        position: relative;
                        margin-bottom: 1rem;
                    }
                    
                    .podium-place.empty {
                        opacity: 0.3;
                    }
                    
                    .podium-crown {
                        position: absolute;
                        top: -40px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 2rem;
                        z-index: 10;
                    }
                    
                    .podium-trophy {
                        font-size: 3rem;
                        margin-bottom: 0.5rem;
                        position: relative;
                        z-index: 5;
                    }
                    
                    .podium-rank {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #ffffff;
                        margin-bottom: 1rem;
                    }
                    
                    .podium-info {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        padding: 1rem;
                        margin-bottom: 1rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .podium-name {
                        color: #ffffff;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        font-size: 1rem;
                    }
                    
                    .podium-phone {
                        color: #cccccc;
                        font-size: 0.85rem;
                        margin-bottom: 0.75rem;
                    }
                    
                    .podium-value {
                        color: #6366f1;
                        font-weight: 700;
                        font-size: 1.2rem;
                    }
                    
                    .empty-text {
                        color: #999999;
                        font-style: italic;
                    }
                    
                    .podium-bar {
                        border-radius: 10px 10px 0 0;
                        position: relative;
                    }
                    
                    .first-bar {
                        height: 120px;
                        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                        border: 3px solid #ffd700;
                    }
                    
                    .second-bar {
                        height: 90px;
                        background: linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%);
                        border: 3px solid #c0c0c0;
                    }
                    
                    .third-bar {
                        height: 60px;
                        background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
                        border: 3px solid #cd7f32;
                    }
                    
                    /* Table Styles */
                    .leaderboard-table {
                        margin-top: 2rem;
                    }
                    
                    .leaderboard-table table {
                        width: 100%;
                        border-collapse: collapse;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    
                    .leaderboard-table th {
                        background: rgba(99, 102, 241, 0.2);
                        color: #ffffff;
                        padding: 1rem;
                        font-weight: 600;
                        text-align: left;
                    }
                    
                    .leaderboard-table td {
                        padding: 1rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .leaderboard-table tr:hover {
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    .rank-number {
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-weight: 600;
                        font-size: 0.9rem;
                    }
                    
                    .user-name {
                        color: #ffffff;
                        font-weight: 500;
                    }
                    
                    .phone-number {
                        color: #cccccc;
                        font-family: monospace;
                    }
                    
                    .value-amount {
                        color: #10b981;
                        font-weight: 700;
                        font-size: 1.1rem;
                    }
                    
                    .no-more-data {
                        text-align: center;
                        color: #999999;
                        font-style: italic;
                        margin-top: 2rem;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 10px;
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                    }
                    
                    /* Responsive */
                    @media (max-width: 768px) {
                        .podium {
                            flex-direction: column-reverse;
                            align-items: center;
                            gap: 1.5rem;
                        }
                        
                        .podium-place {
                            margin-bottom: 0;
                            max-width: 300px;
                            width: 100%;
                        }
                        
                        .podium-bar {
                            display: none;
                        }
                        
                        .leaderboard-table {
                            overflow-x: auto;
                        }
                        
                        .leaderboard-table table {
                            min-width: 500px;
                        }
                        
                        .leaderboard-cards {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
                
                <script>
                    function showLeaderboard(type) {
                        // Remove active class from all cards and contents
                        document.querySelectorAll('.leaderboard-card').forEach(card => {
                            card.classList.remove('active');
                        });
                        document.querySelectorAll('.leaderboard-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        
                        // Add active class to selected card and content
                        event.target.closest('.leaderboard-card').classList.add('active');
                        document.getElementById(type + '-leaderboard').classList.add('active');
                    }
                </script>
            `;
            
            res.send(getBaseTemplate('Leaderboard', content, 'list-leaderboard'));
        } catch (error) {
            console.error('Error in leaderboard:', error);
            const content = `
                <div class="card">
                    <h1>🏆 Leaderboard</h1>
                    <p>Sorry, we couldn't load the leaderboard at the moment. Please try again later.</p>
                </div>
            `;
            res.send(getBaseTemplate('Leaderboard', content, 'list-leaderboard'));
        }
    });

    app.get('/list/shop', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🛒 Shop</h1>
                <p>Purchase premium features and exclusive items.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>⭐ Premium Status</h3>
                    <p>Upgrade to premium for unlimited commands.</p>
                    <a href="#" class="btn">Upgrade Now</a>
                </div>
                
                <div class="card">
                    <h3>🎰 Casino Chips</h3>
                    <p>Buy chips to play casino games.</p>
                    <a href="#" class="btn btn-secondary">Buy Chips</a>
                </div>
                
                <div class="card">
                    <h3>🎁 Special Items</h3>
                    <p>Exclusive items and power-ups.</p>
                    <a href="#" class="btn btn-secondary">Browse Items</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Shop', content, 'list-shop'));
    });

    app.get('/list/quiz', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🧠 Quiz</h1>
                <p>Test your knowledge and earn rewards.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>📚 Daily Quiz</h3>
                    <p>Answer daily questions to earn balance.</p>
                    <a href="#" class="btn">Start Quiz</a>
                </div>
                
                <div class="card">
                    <h3>🎯 Challenge Mode</h3>
                    <p>Compete with other players.</p>
                    <a href="#" class="btn btn-secondary">Join Challenge</a>
                </div>
                
                <div class="card">
                    <h3>🏆 Quiz Rankings</h3>
                    <p>See who knows the most.</p>
                    <a href="#" class="btn btn-secondary">View Rankings</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Quiz', content, 'list-quiz'));
    });

    app.get('/list/redeem', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🎁 Redeem</h1>
                <p>Redeem codes and claim your rewards.</p>
            </div>
            
            <div class="card">
                <h3>💳 Redeem Code</h3>
                <div style="margin: 1rem 0;">
                    <input type="text" placeholder="Enter your redeem code" style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; border-radius: 8px; margin-bottom: 1rem;">
                    <button class="btn" style="width: 100%;">Redeem Code</button>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>🎫 Available Codes</h3>
                    <p>Check for active redeem codes.</p>
                    <a href="#" class="btn btn-secondary">View Codes</a>
                </div>
                
                <div class="card">
                    <h3>📊 Redeem History</h3>
                    <p>See your previous redemptions.</p>
                    <a href="#" class="btn btn-secondary">View History</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Redeem', content, 'list-redeem'));
    });

    // List pages - Squad section
    app.get('/list/members', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>👤 Members</h1>
                <p>Manage squad members and their roles.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>👥 Active Members</h3>
                    <p>View all active squad members.</p>
                    <a href="#" class="btn">View Members</a>
                </div>
                
                <div class="card">
                    <h3>🛡️ Permissions</h3>
                    <p>Manage member roles and permissions.</p>
                    <a href="#" class="btn btn-secondary">Set Permissions</a>
                </div>
                
                <div class="card">
                    <h3>➕ Invite Members</h3>
                    <p>Invite new members to join your squad.</p>
                    <a href="#" class="btn btn-secondary">Send Invites</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Members', content, 'list-members'));
    });

    app.get('/list/tournament', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🏅 Tournament</h1>
                <p>Compete in squad tournaments and events.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>⚔️ Active Tournaments</h3>
                    <p>Join ongoing tournaments.</p>
                    <a href="#" class="btn">Join Tournament</a>
                </div>
                
                <div class="card">
                    <h3>📅 Upcoming Events</h3>
                    <p>See scheduled tournaments.</p>
                    <a href="#" class="btn btn-secondary">View Schedule</a>
                </div>
                
                <div class="card">
                    <h3>🏆 Tournament History</h3>
                    <p>View past tournament results.</p>
                    <a href="#" class="btn btn-secondary">View Results</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Tournament', content, 'list-tournament'));
    });

    app.get('/list/division', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>⚔️ Division</h1>
                <p>Squad divisions and competitive rankings.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>🏅 Current Division</h3>
                    <p>Your squad's current division rank.</p>
                    <a href="#" class="btn">View Division</a>
                </div>
                
                <div class="card">
                    <h3>📈 Division Progress</h3>
                    <p>Track your squad's advancement.</p>
                    <a href="#" class="btn btn-secondary">View Progress</a>
                </div>
                
                <div class="card">
                    <h3>🎯 Division Goals</h3>
                    <p>Requirements for promotion.</p>
                    <a href="#" class="btn btn-secondary">View Goals</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Division', content, 'list-division'));
    });

    // List pages - Casino section
    app.get('/list/mine', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>💎 Mines Casino</h1>
                <p>Test your luck in the classic Mines game. Find gems while avoiding bombs!</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>🎰 Play Mines</h3>
                    <p>Start playing the Mines casino game.</p>
                    <a href="/games/mines" class="btn">Play Now</a>
                </div>
                
                <div class="card">
                    <h3>📊 Game Stats</h3>
                    <p>View your mines game statistics.</p>
                    <a href="/games/stats" class="btn btn-secondary">View Stats</a>
                </div>
                
                <div class="card">
                    <h3>🏆 Leaderboard</h3>
                    <p>Compete with other players.</p>
                    <a href="/games/leaderboard" class="btn btn-secondary">View Leaderboard</a>
                </div>
                
                <div class="card"></div>
        `;
        
        res.send(getBaseTemplate('Mine Casino', content, 'list-mine'));
    });

    // Game routes
    app.get('/games/mines', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'mines.html'));
    });

    app.get('/games/stats', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'mines-stats.html'));
    });

    app.get('/games/leaderboard', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
    });

    // Update the existing mines route to redirect to the new path
    app.get('/mines', requireAuth, (req, res) => {
        res.redirect('/games/mines');
    });

    app.get('/list/tower', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🗼 Tower</h1>
                <p>Climb the tower and claim your rewards.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>🎯 Start Climbing</h3>
                    <p>Begin your tower challenge.</p>
                    <a href="#" class="btn">Start Game</a>
                </div>
                
                <div class="card">
                    <h3>🏆 Tower Records</h3>
                    <p>View highest climbers.</p>
                    <a href="#" class="btn btn-secondary">View Records</a>
                </div>
                
                <div class="card">
                    <h3>💰 Tower Rewards</h3>
                    <p>See available rewards.</p>
                    <a href="#" class="btn btn-secondary">View Rewards</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Tower', content, 'list-tower'));
    });

    app.get('/list/coinflip', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>🪙 Coinflip</h1>
                <p>Test your luck with coinflip games.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>🎲 Quick Flip</h3>
                    <p>Start a quick coinflip game.</p>
                    <a href="#" class="btn">Flip Coin</a>
                </div>
                
                <div class="card">
                    <h3>💰 High Stakes</h3>
                    <p>Play with higher betting limits.</p>
                    <a href="#" class="btn btn-secondary">High Stakes</a>
                </div>
                
                <div class="card">
                    <h3>📊 Flip Statistics</h3>
                    <p>View your coinflip statistics.</p>
                    <a href="#" class="btn btn-secondary">View Stats</a>
                </div>
            </div>
        `;
        
        res.send(getBaseTemplate('Coinflip', content, 'list-coinflip'));
    });

    // Profile page
    app.get('/profile', requireAuth, async (req, res) => {
        try {
            const { User } = require('./lib/database');
            
            // Get user data from database
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
            
            const phoneForJid = userPhone.replace('+', '');
            const userJid = phoneForJid + '@s.whatsapp.net';
            
            // Try to find user in database
            let user = await User.findOne({ jid: userJid });
            
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
            }
            
            // Check and update premium status if expired
            if (user.status === 'premium' && user.premiumUntil && new Date() > user.premiumUntil) {
                await User.updateOne(
                    { jid: userJid },
                    { 
                        $set: { 
                            status: 'basic',
                            premiumUntil: null,
                            limit: 30
                        }
                    }
                );
                user.status = 'basic';
                user.premiumUntil = null;
                user.limit = 30;
            }
            
            // Format data for display
            const username = user.name || user.username || 'Unknown';
            const displayPhone = userPhone;
            const status = user.status || 'basic';
            const statusName = status === 'owner' ? 'Owner' : 
                             status === 'premium' ? 'Premium' : 'Basic';
            const limit = user.limit === 'unlimited' ? '∞' : (user.limit || 30);
            const balance = user.balance || 0;
            const chips = user.chips || 0;
            const warnings = user.warnings || 0;
            const commandCount = user.commandCount || 0;
            const memberSince = user.createdAt ? user.createdAt.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Unknown';
            const lastSeen = user.lastSeen ? user.lastSeen.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Unknown';
            
            // Calculate premium time remaining
            let premiumTimeRemaining = null;
            if (user.status === 'premium' && user.premiumUntil) {
                const now = new Date();
                const premiumEnd = new Date(user.premiumUntil);
                if (premiumEnd > now) {
                    const diffMs = premiumEnd - now;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    
                    if (diffDays > 0) {
                        premiumTimeRemaining = `${diffDays} hari ${diffHours} jam`;
                    } else {
                        premiumTimeRemaining = `${diffHours} jam`;
                    }
                }
            }
            
            const content = `
                <div class="profile-header">
                    <div class="profile-avatar">
                        <div class="avatar-placeholder">
                            <span class="avatar-text">${username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="status-badge-container">
                            <span class="status-badge ${status}">${statusName}</span>
                        </div>
                    </div>
                    <div class="profile-info">
                        <h1>${username}</h1>
                        <p class="profile-subtitle">${displayPhone}</p>
                        <div class="profile-stats">
                            <div class="stat">
                                <span class="stat-number">${commandCount}</span>
                                <span class="stat-label">Commands Used</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${warnings}</span>
                                <span class="stat-label">Warnings</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${memberSince.split(' ')[2]}</span>
                                <span class="stat-label">Member Since</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Currency Cards -->
                <div class="currency-grid">
                    <div class="currency-card balance-card">
                        <div class="currency-header">
                            <div class="currency-icon">💰</div>
                            <h3>Balance</h3>
                        </div>
                        <div class="currency-amount">${balance}</div>
                        <div class="currency-footer">
                            <span class="currency-label">Current Balance</span>
                        </div>
                    </div>
                    
                    <div class="currency-card chips-card">
                        <div class="currency-header">
                            <div class="currency-icon">🎰</div>
                            <h3>Chips</h3>
                        </div>
                        <div class="currency-amount">${chips}</div>
                        <div class="currency-footer">
                            <span class="currency-label">Casino Chips</span>
                        </div>
                    </div>
                    
                    <div class="currency-card limit-card">
                        <div class="currency-header">
                            <div class="currency-icon">🎯</div>
                            <h3>Daily Limit</h3>
                        </div>
                        <div class="currency-amount">${limit}</div>
                        <div class="currency-footer">
                            <span class="currency-label">Commands Left</span>
                        </div>
                    </div>
                </div>
                
                <!-- Profile Details -->
                <div class="profile-details">
                    <div class="detail-card">
                        <div class="detail-header">
                            <h3>📱 Account Information</h3>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Phone Number</span>
                                <span class="detail-value">${displayPhone}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">WhatsApp ID</span>
                                <span class="detail-value">${userJid}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Account Status</span>
                                <span class="detail-value">
                                    <span class="inline-status-badge ${status}">${statusName}</span>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Member Since</span>
                                <span class="detail-value">${memberSince}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Last Activity</span>
                                <span class="detail-value">${lastSeen}</span>
                            </div>
                            ${premiumTimeRemaining ? `
                            <div class="detail-item">
                                <span class="detail-label">Premium Until</span>
                                <span class="detail-value premium-time">${premiumTimeRemaining} remaining</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="detail-card">
                        <div class="detail-header">
                            <h3>📊 Activity Statistics</h3>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">⚡</div>
                                <div class="stat-content">
                                    <div class="stat-number">${commandCount}</div>
                                    <div class="stat-label">Total Commands</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">⚠️</div>
                                <div class="stat-content">
                                    <div class="stat-number">${warnings}</div>
                                    <div class="stat-label">Warnings</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-content">
                                    <div class="stat-number">${limit}</div>
                                    <div class="stat-label">Daily Limit</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">📅</div>
                                <div class="stat-content">
                                    <div class="stat-number">${Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))}</div>
                                    <div class="stat-label">Days Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${req.session.user.role === 'owner' ? `
                <div class="admin-section">
                    <div class="detail-card admin-card">
                        <div class="detail-header">
                            <h3>🔧 Admin Access</h3>
                        </div>
                        <p>You have owner privileges. Access advanced bot management features.</p>
                        <div class="admin-actions">
                            <a href="/admin" class="btn admin-btn">Open Admin Panel</a>
                            <a href="/admin/users" class="btn btn-secondary">Manage Users</a>
                            <a href="/admin/settings" class="btn btn-secondary">Bot Settings</a>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <style>
                    .profile-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 20px;
                        padding: 2rem;
                        margin-bottom: 2rem;
                        display: flex;
                        align-items: center;
                        gap: 2rem;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .profile-header::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                    }
                    
                    .profile-avatar {
                        position: relative;
                        z-index: 2;
                    }
                    
                    .avatar-placeholder {
                        width: 120px;
                        height: 120px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 4px solid rgba(255, 255, 255, 0.3);
                        backdrop-filter: blur(10px);
                        margin-bottom: 1rem;
                    }
                    
                    .avatar-text {
                        font-size: 3rem;
                        font-weight: 700;
                        color: white;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    
                    .status-badge-container {
                        text-align: center;
                    }
                    
                    .status-badge {
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .status-badge.owner {
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                        color: white;
                        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                    }
                    
                    .status-badge.premium {
                        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                        color: #333;
                        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                    }
                    
                    .status-badge.basic {
                        background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
                        color: white;
                        box-shadow: 0 4px 15px rgba(156, 163, 175, 0.3);
                    }
                    
                    .profile-info {
                        flex: 1;
                        z-index: 2;
                    }
                    
                    .profile-info h1 {
                        font-size: 2.5rem;
                        font-weight: 700;
                        margin: 0 0 0.5rem 0;
                        color: white;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    
                    .profile-subtitle {
                        font-size: 1.2rem;
                        color: rgba(255, 255, 255, 0.9);
                        margin-bottom: 1.5rem;
                    }
                    
                    .profile-stats {
                        display: flex;
                        gap: 2rem;
                    }
                    
                    .stat {
                        text-align: center;
                    }
                    
                    .stat-number {
                        display: block;
                        font-size: 2rem;
                        font-weight: 700;
                        color: white;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    
                    .stat-label {
                        font-size: 0.9rem;
                        color: rgba(255, 255, 255, 0.8);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .currency-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    
                    .currency-card {
                        background: rgba(30, 30, 30, 0.95);
                        border-radius: 15px;
                        padding: 1.5rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .currency-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        opacity: 0.1;
                        border-radius: 15px;
                    }
                    
                    .balance-card::before {
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    }
                    
                    .chips-card::before {
                        background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
                    }
                    
                    .limit-card::before {
                        background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%);
                    }
                    
                    .currency-header {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        margin-bottom: 1rem;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .currency-icon {
                        font-size: 2rem;
                    }
                    
                    .currency-header h3 {
                        margin: 0;
                        color: #ffffff;
                        font-size: 1.2rem;
                    }
                    
                    .currency-amount {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #ffffff;
                        margin-bottom: 0.5rem;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .currency-footer {
                        position: relative;
                        z-index: 2;
                    }
                    
                    .currency-label {
                        color: #cccccc;
                        font-size: 0.9rem;
                    }
                    
                    .profile-details {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 2rem;
                        margin-bottom: 2rem;
                    }
                    
                    .detail-card {
                        background: rgba(30, 30, 30, 0.95);
                        border-radius: 15px;
                        padding: 1.5rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .detail-header {
                        margin-bottom: 1.5rem;
                    }
                    
                    .detail-header h3 {
                        margin: 0;
                        color: #ffffff;
                        font-size: 1.3rem;
                    }
                    
                    .detail-grid {
                        display: grid;
                        gap: 1rem;
                    }
                    
                    .detail-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    
                    .detail-item:last-child {
                        border-bottom: none;
                    }
                    
                    .detail-label {
                        color: #cccccc;
                        font-size: 0.9rem;
                    }
                    
                    .detail-value {
                        color: #ffffff;
                        font-weight: 500;
                        text-align: right;
                    }
                    
                    .inline-status-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    
                    .inline-status-badge.owner {
                        background: #ff6b6b;
                        color: white;
                    }
                    
                    .inline-status-badge.premium {
                        background: #ffd700;
                        color: #333;
                    }
                    
                    .inline-status-badge.basic {
                        background: #6b7280;
                        color: white;
                    }
                    
                    .premium-time {
                        color: #ffd700;
                        font-weight: 600;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 1rem;
                    }
                    
                    .stat-card {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        padding: 1rem;
                        text-align: center;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .stat-card .stat-icon {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .stat-card .stat-number {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #6366f1;
                        margin-bottom: 0.25rem;
                    }
                    
                    .stat-card .stat-label {
                        font-size: 0.8rem;
                        color: #cccccc;
                    }
                    
                    .admin-section {
                        margin-top: 2rem;
                    }
                    
                    .admin-card {
                        background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(238, 90, 82, 0.1) 100%);
                        border: 1px solid rgba(255, 107, 107, 0.3);
                    }
                    
                    .admin-actions {
                        display: flex;
                        gap: 1rem;
                        margin-top: 1rem;
                        flex-wrap: wrap;
                    }
                    
                    .admin-btn {
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
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
                    
                    .admin-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
                    }
                    
                    @media (max-width: 768px) {
                        .profile-header {
                            flex-direction: column;
                            text-align: center;
                            gap: 1rem;
                        }
                        
                        .profile-stats {
                            justify-content: center;
                        }
                        
                        .currency-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .profile-details {
                            grid-template-columns: 1fr;
                        }
                        
                        .admin-actions {
                            flex-direction: column;
                        }
                        
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                </style>
            `;
            
            res.send(getBaseTemplate('Profile', content, 'profile'));
        } catch (error) {
            console.error('Error loading profile:', error);
            const content = `
                <div class="card">
                    <h1>Profile</h1>
                    <p>Sorry, we couldn't load your profile at the moment. Please try again later.</p>
                </div>
            `;
            res.send(getBaseTemplate('Profile', content, 'profile'));
        }
    });

    // Currency page
    app.get('/currency', requireAuth, (req, res) => {
        const content = `
            <div class="card">
                <h1>💰 Account Balance</h1>
                <p>Manage your currency, chips, and daily limits.</p>
                <button onclick="refreshCurrency()" class="btn">🔄 Refresh</button>
            </div>
            
            <div class="currency-grid">
                <div class="currency-card balance-card">
                    <div class="currency-icon">💵</div>
                    <div class="currency-info">
                        <h3>Balance</h3>
                        <div class="currency-amount" id="balance">Loading...</div>
                    </div>
                </div>
                
                <div class="currency-card chips-card">
                    <div class="currency-icon">🎰</div>
                    <div class="currency-info">
                        <h3>Chips</h3>
                        <div class="currency-amount" id="chips">Loading...</div>
                    </div>
                </div>
                
                <div class="currency-card limit-card">
                    <div class="currency-icon">🎯</div>
                    <div class="currency-info">
                        <h3>Daily Limit</h3>
                        <div class="currency-amount" id="limit">Loading...</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Account Information</h3>
                <p><strong>Phone:</strong> <span id="phone">Loading...</span></p>
                <p><strong>Status:</strong> <span id="status">Loading...</span></p>
                <p><strong>Last Updated:</strong> <span id="lastUpdated">Loading...</span></p>
            </div>
            
            <style>
                .currency-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .currency-card {
                    background: rgba(30, 30, 30, 0.95);
                    border-radius: 15px;
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    transition: transform 0.3s ease;
                }
                
                .currency-card:hover {
                    transform: translateY(-5px);
                }
                
                .balance-card {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                }
                
                .chips-card {
                    background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
                }
                
                .limit-card {
                    background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%);
                }
                
                .currency-icon {
                    font-size: 2.5rem;
                    opacity: 0.9;
                }
                
                .currency-info h3 {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }
                
                .currency-amount {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #ffffff;
                }
            </style>
            
            <script>
                async function refreshCurrency() {
                    try {
                        const response = await fetch('/api/user-currency');
                        const data = await response.json();
                        
                        if (data.success) {
                            document.getElementById('balance').textContent = data.balance;
                            document.getElementById('chips').textContent = data.chips;
                            document.getElementById('limit').textContent = data.limit === 'unlimited' ? '∞' : data.limit;
                            document.getElementById('phone').textContent = data.phoneNumber;
                            document.getElementById('status').textContent = data.status.toUpperCase();
                            document.getElementById('lastUpdated').textContent = new Date(data.timestamp).toLocaleString();
                        } else {
                            console.error('Failed to fetch currency data:', data.error);
                        }
                    } catch (error) {
                        console.error('Error fetching currency:', error);
                    }
                }
                
                // Load currency data on page load
                refreshCurrency();
            </script>
        `;
        
        res.send(getBaseTemplate('Currency', content, 'currency'));
    });

    

    // Admin panel (owner only)
    app.get('/admin', requireOwner, (req, res) => {
        const content = `
            <div class="card">
                <h1>⚙️ Admin Panel</h1>
                <p>Panel kontrol khusus untuk owner bot. Kelola semua aspek bot dari sini.</p>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ Area Khusus Owner</strong>
                Panel ini hanya dapat diakses oleh owner. Jangan bagikan akses ini kepada member biasa.
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>📱 Bot Status</h3>
                    <div id="bot-status" class="status waiting">Checking bot status...</div>
                    <div id="qr-container" style="margin: 20px 0; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                        <div style="color: #999;">Loading QR code...</div>
                    </div>
                    <button class="btn" onclick="checkQR()">🔄 Refresh QR Code</button>
                    <button class="btn btn-secondary" onclick="checkStatus()">📊 Check Status</button>
                    <div class="timestamp" style="font-size: 12px; color: #cccccc; margin-top: 15px;">
                        Last updated: <span id="timestamp">-</span>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📰 News Management</h3>
                    <p>Kelola berita dan pengumuman untuk member.</p>
                    <a href="/admin/news" class="btn">Kelola News</a>
                </div>
                
                <div class="card">
                    <h3>🗓️ Daily Login Rewards</h3>
                    <p>Kelola reward daily login untuk member.</p>
                    <a href="/admin/daily-login" class="btn">Kelola Rewards</a>
                </div>
                
                <div class="card">
                    <h3>👥 User Management</h3>
                    <p>Kelola user, premium, dan statistik.</p>
                    <a href="/admin/users" class="btn btn-secondary">Kelola Users</a>
                </div>
                
                <div class="card">
                    <h3>🛡️ Bot Settings</h3>
                    <p>Pengaturan bot dan konfigurasi sistem.</p>
                    <a href="/admin/settings" class="btn btn-secondary">Pengaturan</a>
                </div>
            </div>
            
            <style>
                .warning-box {
                    background: rgba(245, 158, 11, 0.2);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #f59e0b;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .warning-box strong {
                    display: block;
                    margin-bottom: 5px;
                }
                .status {
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 10px;
                    font-weight: 500;
                }
                .waiting { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
                .ready { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
                .expired { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
                .connected { background: rgba(99, 102, 241, 0.2); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3); }
                #qr-code {
                    max-width: 300px;
                    height: auto;
                    border: 3px solid #6366f1;
                    border-radius: 15px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.95);
                }
            </style>
            
            <script>
                function checkQR() {
                    fetch('/qr-api')
                        .then(response => response.json())
                        .then(data => {
                            const status = document.getElementById('bot-status');
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
                            document.getElementById('bot-status').innerHTML = '❌ Error loading QR code';
                            document.getElementById('bot-status').className = 'status expired';
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
        `;
        
        res.send(getBaseTemplate('Admin Panel', content, 'admin'));
    });

    // Admin news management
    app.get('/admin/news', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.find().sort({ createdAt: -1 });
            
            const newsRows = news.map(item => `
                <tr>
                    <td>${item.title}</td>
                    <td>
                        <span class="category-badge ${item.category}">${item.category}</span>
                    </td>
                    <td>${item.priority}</td>
                    <td>
                        <span class="status-badge ${item.isActive ? 'active' : 'inactive'}">
                            ${item.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>${new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>
                        <button class="btn-small" onclick="editNews('${item._id}')">Edit</button>
                        <button class="btn-small btn-danger" onclick="deleteNews('${item._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
            
            const content = `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h1>📰 News Management</h1>
                        <button class="btn" onclick="showAddForm()">+ Add News</button>
                    </div>
                    <p>Kelola berita dan pengumuman untuk member.</p>
                </div>
                
                <!-- Add/Edit News Form -->
                <div id="news-form" class="card" style="display: none;">
                    <h3 id="form-title">Add New News</h3>
                    <form id="newsForm">
                        <input type="hidden" id="newsId" />
                        <div class="form-group">
                            <label>Title:</label>
                            <input type="text" id="newsTitle" required />
                        </div>
                        <div class="form-group">
                            <label>Content:</label>
                            <textarea id="newsContent" required rows="5"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Category:</label>
                            <select id="newsCategory">
                                <option value="announcement">Announcement</option>
                                <option value="hot">Hot Updates</option>
                                <option value="event">Event</option>
                                <option value="update">Update</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Priority:</label>
                            <input type="number" id="newsPriority" value="0" min="0" max="10" />
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="newsActive" checked />
                                Active
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Save</button>
                            <button type="button" class="btn btn-secondary" onclick="hideForm()">Cancel</button>
                        </div>
                    </form>
                </div>
                
                <!-- News List -->
                <div class="card">
                    <h3>News List</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${newsRows || '<tr><td colspan="6">No news available</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <style>
                    .form-group {
                        margin-bottom: 1rem;
                    }
                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        font-weight: 500;
                    }
                    .form-group input, .form-group textarea, .form-group select {
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        background: rgba(255, 255, 255, 0.05);
                        color: white;
                        border-radius: 8px;
                        font-size: 1rem;
                    }
                    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                        outline: none;
                        border-color: #6366f1;
                    }
                    .form-actions {
                        display: flex;
                        gap: 1rem;
                        margin-top: 1.5rem;
                    }
                    .table-container {
                        overflow-x: auto;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 1rem;
                    }
                    th, td {
                        padding: 0.75rem;
                        text-align: left;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    th {
                        background: rgba(255, 255, 255, 0.05);
                        font-weight: 600;
                    }
                    .btn-small {
                        padding: 0.25rem 0.75rem;
                        font-size: 0.875rem;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 0.5rem;
                        background: #6366f1;
                        color: white;
                    }
                    .btn-danger {
                        background: #ef4444;
                    }
                    .category-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .category-badge.hot { background: #ef4444; color: white; }
                    .category-badge.announcement { background: #10b981; color: white; }
                    .category-badge.event { background: #f59e0b; color: white; }
                    .category-badge.update { background: #6366f1; color: white; }
                    .status-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 600;
                    }
                    .status-badge.active { background: #10b981; color: white; }
                    .status-badge.inactive { background: #6b7280; color: white; }
                </style>
                
                <script>
                    function showAddForm() {
                        document.getElementById('news-form').style.display = 'block';
                        document.getElementById('form-title').textContent = 'Add New News';
                        document.getElementById('newsForm').reset();
                        document.getElementById('newsId').value = '';
                        document.getElementById('newsActive').checked = true;
                    }
                    
                    function hideForm() {
                        document.getElementById('news-form').style.display = 'none';
                    }
                    
                    function editNews(id) {
                        fetch('/api/news/' + id)
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    document.getElementById('news-form').style.display = 'block';
                                    document.getElementById('form-title').textContent = 'Edit News';
                                    document.getElementById('newsId').value = data.news._id;
                                    document.getElementById('newsTitle').value = data.news.title;
                                    document.getElementById('newsContent').value = data.news.content;
                                    document.getElementById('newsCategory').value = data.news.category;
                                    document.getElementById('newsPriority').value = data.news.priority;
                                    document.getElementById('newsActive').checked = data.news.isActive;
                                }
                            });
                    }
                    
                    function deleteNews(id) {
                        if (confirm('Are you sure you want to delete this news?')) {
                            fetch('/api/news/' + id, {
                                method: 'DELETE'
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    location.reload();
                                } else {
                                    alert('Error deleting news');
                                }
                            });
                        }
                    }
                    
                    document.getElementById('newsForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        const id = document.getElementById('newsId').value;
                        const newsData = {
                            title: document.getElementById('newsTitle').value,
                            content: document.getElementById('newsContent').value,
                            category: document.getElementById('newsCategory').value,
                            priority: parseInt(document.getElementById('newsPriority').value),
                            isActive: document.getElementById('newsActive').checked,
                            author: '${req.session.user.phone}'
                        };
                        
                        const method = id ? 'PUT' : 'POST';
                        const url = id ? '/api/news/' + id : '/api/news';
                        
                        fetch(url, {
                            method: method,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(newsData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                location.reload();
                            } else {
                                alert('Error saving news');
                            }
                        });
                    });
                </script>
            `;
            
            res.send(getBaseTemplate('News Management', content, 'admin'));
        } catch (error) {
            console.error('Error in admin news:', error);
            res.status(500).send('Error loading news management');
        }
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

    // Daily Login API endpoints
    app.post('/api/daily-login/claim', requireAuth, async (req, res) => {
        try {
            const { processDailyLoginClaim } = require('./lib/dailyLoginModel');
            
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
            
            const result = await processDailyLoginClaim(userJid);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Daily login claimed successfully',
                    ...result
                });
            } else {
                res.json({
                    success: false,
                    message: result.reason === 'already_claimed_today' ? 
                        'You have already claimed today' : 
                        'Failed to claim daily login'
                });
            }
        } catch (error) {
            console.error('Error claiming daily login:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.get('/api/daily-login/status', requireAuth, async (req, res) => {
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
            
            const status = await getUserDailyLoginStatus(userJid);
            
            if (status) {
                res.json({ success: true, status });
            } else {
                res.json({ success: false, message: 'Failed to get status' });
            }
        } catch (error) {
            console.error('Error getting daily login status:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    // Daily Login Admin API endpoints (Owner only)
    
    // Mines Game Routes
    app.get('/games/mines', requireAuth, (req, res) => {
        res.sendFile('mines.html', { root: './public' });
    });
    
    // API endpoint to get user chips
    app.get('/api/user/chips', requireAuth, async (req, res) => {
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
            const userJid = userPhone.replace('+', '') + '@s.whatsapp.net';
            
            const user = await User.findOne({ jid: userJid });
            if (!user) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            res.json({ 
                success: true, 
                chips: user.chips || 0,
                balance: user.balance || 0 
            });
            
        } catch (error) {
            console.error('Error fetching user chips:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });
    
    // API endpoint to update user chips
    app.post('/api/user/update-chips', requireAuth, async (req, res) => {
        try {
            const { amount } = req.body;
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
            const userJid = userPhone.replace('+', '') + '@s.whatsapp.net';
            
            const user = await User.findOne({ jid: userJid });
            if (!user) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            // Update chips
            user.chips = (user.chips || 0) + amount;
            if (user.chips < 0) user.chips = 0; // Prevent negative chips
            
            await user.save();
            
            res.json({ 
                success: true, 
                newChips: user.chips,
                message: amount > 0 ? `Won ${amount} chips!` : `Lost ${Math.abs(amount)} chips!`
            });
            
        } catch (error) {
            console.error('Error updating user chips:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    // Reset Daily Login API endpoint
    app.post('/api/reset-daily-login', requireOwner, async (req, res) => {
        try {
            const { userJid } = req.body;
            
            if (!userJid) {
                return res.json({ success: false, reason: 'missing_jid' });
            }
            
            const { resetUserDailyLogin } = require('./lib/dailyLoginModel');
            const { User } = require('./lib/database');
            
            // Check if user exists
            const user = await User.findOne({ jid: userJid });
            if (!user) {
                return res.json({ success: false, reason: 'user_not_found' });
            }
            
            // Reset user's daily login
            await resetUserDailyLogin(userJid);
            
            res.json({ 
                success: true, 
                message: 'Daily login berhasil direset',
                userJid: userJid 
            });
            
        } catch (error) {
            console.error('Error resetting daily login:', error);
            res.json({ success: false, reason: 'server_error' });
        }
    });
    
    app.get('/api/daily-login/config', requireOwner, async (req, res) => {
        try {
            const { DailyLoginConfig } = require('./lib/dailyLoginModel');
            const configs = await DailyLoginConfig.find().sort({ day: 1 });
            res.json({ success: true, configs });
        } catch (error) {
            console.error('Error getting daily login config:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.put('/api/daily-login/config/:day', requireOwner, async (req, res) => {
        try {
            const { DailyLoginConfig } = require('./lib/dailyLoginModel');
            const { day } = req.params;
            const { rewardType, rewardAmount, premiumDuration, isActive } = req.body;
            
            const config = await DailyLoginConfig.findOneAndUpdate(
                { day: parseInt(day) },
                {
                    rewardType,
                    rewardAmount: parseInt(rewardAmount),
                    premiumDuration: rewardType === 'premium' ? parseInt(premiumDuration) : null,
                    isActive: isActive !== false
                },
                { new: true, upsert: true }
            );
            
            res.json({ success: true, config });
        } catch (error) {
            console.error('Error updating daily login config:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    // News API endpoints
    app.get('/api/news/:id', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.findById(req.params.id);
            if (!news) {
                return res.json({ success: false, message: 'News not found' });
            }
            res.json({ success: true, news });
        } catch (error) {
            console.error('Error fetching news:', error);
            res.json({ success: false, message: 'Error fetching news' });
        }
    });

    app.post('/api/news', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const { title, content, category, priority, isActive, author } = req.body;
            
            const news = new News({
                title,
                content,
                category,
                priority,
                isActive,
                author
            });
            
            await news.save();
            res.json({ success: true, message: 'News created successfully', news });
        } catch (error) {
            console.error('Error creating news:', error);
            res.json({ success: false, message: 'Error creating news' });
        }
    });

    app.put('/api/news/:id', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const { title, content, category, priority, isActive, author } = req.body;
            
            const news = await News.findByIdAndUpdate(req.params.id, {
                title,
                content,
                category,
                priority,
                isActive,
                author,
                updatedAt: Date.now()
            }, { new: true });
            
            if (!news) {
                return res.json({ success: false, message: 'News not found' });
            }
            
            res.json({ success: true, message: 'News updated successfully', news });
        } catch (error) {
            console.error('Error updating news:', error);
            res.json({ success: false, message: 'Error updating news' });
        }
    });

    app.delete('/api/news/:id', requireOwner, async (req, res) => {
        try {
            const { News } = require('./lib/newsModel');
            const news = await News.findByIdAndDelete(req.params.id);
            
            if (!news) {
                return res.json({ success: false, message: 'News not found' });
            }
            
            res.json({ success: true, message: 'News deleted successfully' });
        } catch (error) {
            console.error('Error deleting news:', error);
            res.json({ success: false, message: 'Error deleting news' });
        }
    });

    // Admin users management
    app.get('/admin/users', requireOwner, async (req, res) => {
        try {
            const { User } = require('./lib/database');
            const users = await User.find().sort({ memberSince: -1 }).limit(50);
            
            const userRows = users.map(user => `
                <tr>
                    <td>${user.name || 'Unknown'}</td>
                    <td>${user.jid}</td>
                    <td>${user.balance || 0}</td>
                    <td>${user.chips || 0}</td>
                    <td>
                        <span class="status-badge ${user.status === 'premium' ? 'premium' : 'basic'}">
                            ${user.status || 'basic'}
                        </span>
                    </td>
                    <td>${new Date(user.memberSince).toLocaleDateString('id-ID')}</td>
                </tr>
            `).join('');
            
            const content = `
                <div class="card">
                    <h1>👥 User Management</h1>
                    <p>Kelola user, premium status, dan statistik pengguna.</p>
                </div>
                
                <div class="card">
                    <h3>User Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${users.length}</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${users.filter(u => u.status === 'premium').length}</div>
                            <div class="stat-label">Premium Users</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${users.filter(u => u.status === 'basic').length}</div>
                            <div class="stat-label">Basic Users</div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Recent Users</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>JID</th>
                                    <th>Balance</th>
                                    <th>Chips</th>
                                    <th>Status</th>
                                    <th>Member Since</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userRows || '<tr><td colspan="6">No users found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <style>
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 1rem;
                        margin: 1rem 0;
                    }
                    .stat-item {
                        background: rgba(255, 255, 255, 0.05);
                        padding: 1.5rem;
                        border-radius: 10px;
                        text-align: center;
                    }
                    .stat-number {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #6366f1;
                        margin-bottom: 0.5rem;
                    }
                    .stat-label {
                        color: #cccccc;
                        font-size: 0.9rem;
                    }
                    .status-badge.premium {
                        background: #f59e0b;
                        color: white;
                    }
                    .status-badge.basic {
                        background: #6b7280;
                        color: white;
                    }
                </style>
            `;
            
            res.send(getBaseTemplate('User Management', content, 'admin'));
        } catch (error) {
            console.error('Error in admin users:', error);
            res.status(500).send('Error loading user management');
        }
    });

    // Admin daily login management
    app.get('/admin/daily-login', requireOwner, async (req, res) => {
        try {
            const { DailyLoginConfig } = require('./lib/dailyLoginModel');
            const configs = await DailyLoginConfig.find().sort({ day: 1 });
            
            const configRows = configs.map(config => `
                <tr>
                    <td>Day ${config.day}</td>
                    <td>
                        <span class="reward-type-badge ${config.rewardType}">${config.rewardType}</span>
                    </td>
                    <td>${config.rewardAmount}</td>
                    <td>${config.rewardType === 'premium' ? (config.premiumDuration || 1) + ' hari' : '-'}</td>
                    <td>
                        <span class="status-badge ${config.isActive ? 'active' : 'inactive'}">
                            ${config.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-small" onclick="editReward(${config.day})">Edit</button>
                    </td>
                </tr>
            `).join('');
            
            const content = `
                <div class="card">
                    <h1>🗓️ Daily Login Rewards Management</h1>
                    <p>Kelola reward daily login untuk setiap hari (Day 1-7). Sistem akan mengulang setelah Day 7.</p>
                </div>
                
                <!-- Edit Reward Form -->
                <div id="reward-form" class="card" style="display: none;">
                    <h3 id="form-title">Edit Daily Reward</h3>
                    <form id="rewardForm">
                        <input type="hidden" id="rewardDay" />
                        <div class="form-group">
                            <label>Reward Type:</label>
                            <select id="rewardType" onchange="togglePremiumDuration()">
                                <option value="balance">Balance</option>
                                <option value="chips">Chips</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Reward Amount:</label>
                            <input type="number" id="rewardAmount" required min="1" />
                            <small id="amountHelp">Untuk balance/chips: jumlah yang diberikan. Untuk premium: tidak digunakan.</small>
                        </div>
                        <div class="form-group" id="premiumDurationGroup" style="display: none;">
                            <label>Premium Duration (hari):</label>
                            <input type="number" id="premiumDuration" min="1" value="1" />
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="rewardActive" checked />
                                Active
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Save Reward</button>
                            <button type="button" class="btn btn-secondary" onclick="hideRewardForm()">Cancel</button>
                        </div>
                    </form>
                </div>
                
                <!-- Current Rewards -->
                <div class="card">
                    <h3>Current Daily Login Rewards</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Reward Type</th>
                                    <th>Amount</th>
                                    <th>Premium Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${configRows || '<tr><td colspan="6">No rewards configured</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Reward Preview -->
                <div class="card">
                    <h3>Reward Preview</h3>
                    <div class="reward-preview-grid">
                        ${configs.map(config => {
                            const rewardIcons = {
                                'balance': '💰',
                                'chips': '🎰',
                                'premium': '⭐'
                            };
                            
                            let rewardText = '';
                            if (config.rewardType === 'premium') {
                                rewardText = `Premium ${config.premiumDuration || 1} hari`;
                            } else {
                                rewardText = `${config.rewardAmount} ${config.rewardType}`;
                            }
                            
                            return `
                                <div class="preview-day ${config.isActive ? 'active' : 'inactive'}">
                                    <div class="preview-day-number">Day ${config.day}</div>
                                    <div class="preview-icon">${rewardIcons[config.rewardType]}</div>
                                    <div class="preview-reward">${rewardText}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Reset Daily Login Section -->
                <div class="card">
                    <h3>🔄 Reset Daily Login</h3>
                    <p>Reset daily login progress untuk user tertentu. User yang direset akan kembali ke Day 1 dan bisa claim lagi.</p>
                    
                    <form id="resetDailyForm">
                        <div class="form-group">
                            <label>Nomor WhatsApp (tanpa +):</label>
                            <input type="text" id="resetPhoneNumber" placeholder="contoh: 6285123456789" required />
                            <small>Masukkan nomor lengkap dengan kode negara (62 untuk Indonesia)</small>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-danger">Reset Daily Login</button>
                        </div>
                    </form>
                    
                    <div id="resetResult" style="margin-top: 1rem; display: none;"></div>
                </div>
                
                <style>
                    .reward-type-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .reward-type-badge.balance { background: #10b981; color: white; }
                    .reward-type-badge.chips { background: #f59e0b; color: white; }
                    .reward-type-badge.premium { background: #8b5cf6; color: white; }
                    
                    .reward-preview-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    .preview-day {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        padding: 1.5rem 1rem;
                        text-align: center;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        transition: all 0.3s ease;
                    }
                    
                    .preview-day.active {
                        border-color: #10b981;
                        background: rgba(16, 185, 129, 0.1);
                    }
                    
                    .preview-day.inactive {
                        opacity: 0.5;
                        border-color: #6b7280;
                    }
                    
                    .preview-day-number {
                        font-size: 0.9rem;
                        color: #cccccc;
                        margin-bottom: 0.5rem;
                    }
                    
                    .preview-icon {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .preview-reward {
                        font-size: 0.85rem;
                        color: #ffffff;
                        font-weight: 500;
                    }
                    
                    #amountHelp {
                        color: #999;
                        font-size: 0.8rem;
                        margin-top: 0.25rem;
                        display: block;
                    }
                    
                    .alert {
                        padding: 12px 16px;
                        border-radius: 8px;
                        margin: 10px 0;
                        font-size: 14px;
                        border: 1px solid;
                    }
                    
                    .alert-success {
                        background-color: rgba(16, 185, 129, 0.1);
                        border-color: #10b981;
                        color: #10b981;
                    }
                    
                    .alert-error {
                        background-color: rgba(239, 68, 68, 0.1);
                        border-color: #ef4444;
                        color: #ef4444;
                    }
                    
                    .alert-info {
                        background-color: rgba(59, 130, 246, 0.1);
                        border-color: #3b82f6;
                        color: #3b82f6;
                    }
                </style>
                
                <script>
                    function editReward(day) {
                        fetch('/api/daily-login/config')
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    const config = data.configs.find(c => c.day === day);
                                    if (config) {
                                        document.getElementById('reward-form').style.display = 'block';
                                        document.getElementById('form-title').textContent = \`Edit Day \${day} Reward\`;
                                        document.getElementById('rewardDay').value = day;
                                        document.getElementById('rewardType').value = config.rewardType;
                                        document.getElementById('rewardAmount').value = config.rewardAmount;
                                        document.getElementById('premiumDuration').value = config.premiumDuration || 1;
                                        document.getElementById('rewardActive').checked = config.isActive;
                                        togglePremiumDuration();
                                    }
                                }
                            });
                    }
                    
                    function hideRewardForm() {
                        document.getElementById('reward-form').style.display = 'none';
                    }
                    
                    function togglePremiumDuration() {
                        const rewardType = document.getElementById('rewardType').value;
                        const premiumGroup = document.getElementById('premiumDurationGroup');
                        const amountHelp = document.getElementById('amountHelp');
                        
                        if (rewardType === 'premium') {
                            premiumGroup.style.display = 'block';
                            amountHelp.textContent = 'Untuk premium: isi 1 (tidak berpengaruh, durasi diatur di bawah).';
                        } else {
                            premiumGroup.style.display = 'none';
                            amountHelp.textContent = 'Jumlah ' + rewardType + ' yang akan diberikan.';
                        }
                    }
                    
                    document.getElementById('rewardForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        const day = document.getElementById('rewardDay').value;
                        const rewardData = {
                            rewardType: document.getElementById('rewardType').value,
                            rewardAmount: document.getElementById('rewardAmount').value,
                            premiumDuration: document.getElementById('premiumDuration').value,
                            isActive: document.getElementById('rewardActive').checked
                        };
                        
                        fetch('/api/daily-login/config/' + day, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(rewardData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Reward berhasil diupdate!');
                                location.reload();
                            } else {
                                alert('Error updating reward');
                            }
                        });
                    });
                    
                    // Reset Daily Login Form Handler
                    document.getElementById('resetDailyForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        const phoneNumber = document.getElementById('resetPhoneNumber').value.trim();
                        const resultDiv = document.getElementById('resetResult');
                        
                        if (!phoneNumber) {
                            resultDiv.innerHTML = '<div class="alert alert-error">❌ Masukkan nomor WhatsApp!</div>';
                            resultDiv.style.display = 'block';
                            return;
                        }
                        
                        // Show loading
                        resultDiv.innerHTML = '<div class="alert alert-info">⏳ Memproses reset...</div>';
                        resultDiv.style.display = 'block';
                        
                        // Format phone number to JID
                        let formattedNumber = phoneNumber;
                        if (!formattedNumber.startsWith('62')) {
                            if (formattedNumber.startsWith('0')) {
                                formattedNumber = '62' + formattedNumber.substring(1);
                            } else if (formattedNumber.startsWith('8')) {
                                formattedNumber = '62' + formattedNumber;
                            }
                        }
                        const userJid = formattedNumber + '@s.whatsapp.net';
                        
                        fetch('/api/reset-daily-login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ userJid: userJid })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                resultDiv.innerHTML = \`
                                    <div class="alert alert-success">
                                        ✅ Daily login berhasil direset untuk nomor \${phoneNumber}!<br>
                                        User sekarang bisa claim dari Day 1 lagi.
                                    </div>
                                \`;
                                document.getElementById('resetPhoneNumber').value = '';
                            } else {
                                let errorMsg = 'Terjadi kesalahan saat reset daily login';
                                if (data.reason === 'user_not_found') {
                                    errorMsg = 'User tidak ditemukan. Pastikan nomor benar dan user pernah menggunakan daily login.';
                                }
                                resultDiv.innerHTML = \`<div class="alert alert-error">❌ \${errorMsg}</div>\`;
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            resultDiv.innerHTML = '<div class="alert alert-error">❌ Terjadi kesalahan koneksi</div>';
                        });
                    });
                </script>
            `;
            
            res.send(getBaseTemplate('Daily Login Management', content, 'admin'));
        } catch (error) {
            console.error('Error in admin daily login:', error);
            res.status(500).send('Error loading daily login management');
        }
    });

    // Admin settings
    app.get('/admin/settings', requireOwner, (req, res) => {
        const content = `
            <div class="card">
                <h1>🛡️ Bot Settings</h1>
                <p>Pengaturan bot dan konfigurasi sistem.</p>
            </div>
            
            <div class="card">
                <h3>Bot Configuration</h3>
                <form id="settingsForm">
                    <div class="form-group">
                        <label>Bot Name:</label>
                        <input type="text" id="botName" value="NoMercy Bot" />
                    </div>
                    <div class="form-group">
                        <label>Default Prefix:</label>
                        <input type="text" id="defaultPrefix" value="." />
                    </div>
                    <div class="form-group">
                        <label>Auto Reply:</label>
                        <label>
                            <input type="checkbox" id="autoReply" checked />
                            Enable automatic replies
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Anti View Once:</label>
                        <label>
                            <input type="checkbox" id="antiViewOnce" checked />
                            Enable anti view once protection
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Save Settings</button>
                        <button type="button" class="btn btn-secondary" onclick="resetSettings()">Reset to Default</button>
                    </div>
                </form>
            </div>
            
            <div class="card">
                <h3>Database Actions</h3>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="backupDatabase()">Backup Database</button>
                    <button class="btn btn-danger" onclick="clearSessions()">Clear Sessions</button>
                </div>
            </div>
            
            <script>
                document.getElementById('settingsForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    alert('Settings saved successfully!');
                });
                
                function resetSettings() {
                    document.getElementById('botName').value = 'NoMercy Bot';
                    document.getElementById('defaultPrefix').value = '.';
                    document.getElementById('autoReply').checked = true;
                    document.getElementById('antiViewOnce').checked = true;
                }
                
                function backupDatabase() {
                    alert('Database backup initiated');
                }
                
                function clearSessions() {
                    if (confirm('Are you sure you want to clear all sessions?')) {
                        alert('Sessions cleared');
                    }
                }
            </script>
        `;
        
        res.send(getBaseTemplate('Bot Settings', content, 'admin'));
    });

    // Mines Game API endpoints
    app.post('/api/mines/create-game', requireAuth, async (req, res) => {
        try {
            const { gridSize, mineCount, betAmount } = req.body;
            const { User } = require('./lib/database');
            const { createMinesGame } = require('./lib/minesModel');
            
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
            
            // Get user from database
            const user = await User.findOne({ jid: userJid });
            if (!user) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            // Check if user has enough chips
            if (user.chips < betAmount) {
                return res.json({ success: false, message: 'Insufficient chips' });
            }
            
            // Create game data
            const gameData = {
                userJid: userJid,
                userName: user.name || user.username || 'Player',
                gridSize: parseInt(gridSize),
                mineCount: parseInt(mineCount),
                betAmount: parseInt(betAmount),
                startTime: new Date(),
                status: 'active'
            };
            
            // Create game in database
            const game = await createMinesGame(gameData);
            
            // Deduct bet amount from user chips
            user.chips -= betAmount;
            await user.save();
            
            res.json({ 
                success: true, 
                gameId: game._id,
                remainingChips: user.chips,
                message: 'Game created successfully' 
            });
            
        } catch (error) {
            console.error('Error creating mines game:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.post('/api/mines/complete-game', requireAuth, async (req, res) => {
        try {
            const { gameId, isWin, payout, cellsRevealed } = req.body;
            const { User } = require('./lib/database');
            const { completeMinesGame } = require('./lib/minesModel');
            
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
            
            // Get user from database
            const user = await User.findOne({ jid: userJid });
            if (!user) {
                return res.json({ success: false, message: 'User not found' });
            }
            
            // Complete game in database
            const gameUpdates = {
                endTime: new Date(),
                status: isWin ? 'won' : 'lost',
                payout: isWin ? parseInt(payout) : 0,
                cellsRevealed: parseInt(cellsRevealed) || 0
            };
            
            const game = await completeMinesGame(gameId, gameUpdates);
            
            if (!game) {
                return res.json({ success: false, message: 'Game not found' });
            }
            
            // Update user chips if won
            if (isWin && payout > 0) {
                user.chips += payout;
                await user.save();
            }
            
            res.json({ 
                success: true, 
                newChips: user.chips,
                game: game,
                message: isWin ? `You won ${payout} chips!` : 'Game over' 
            });
            
        } catch (error) {
            console.error('Error completing mines game:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.get('/api/mines/stats', requireAuth, async (req, res) => {
        try {
            const { getMinesStats } = require('./lib/minesModel');
            
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
            
            const stats = await getMinesStats(userJid);
            
            if (stats) {
                res.json({ success: true, stats });
            } else {
                res.json({ 
                    success: true, 
                    stats: {
                        totalGames: 0,
                        totalWins: 0,
                        totalLosses: 0,
                        winRate: 0,
                        totalWagered: 0,
                        totalWon: 0,
                        netProfit: 0,
                        bestWin: 0,
                        currentStreak: 0,
                        bestStreak: 0
                    }
                });
            }
            
        } catch (error) {
            console.error('Error fetching mines stats:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.get('/api/mines/leaderboard', requireAuth, async (req, res) => {
        try {
            const { getMinesLeaderboard } = require('./lib/minesModel');
            const limit = req.query.limit || 50;
            
            const leaderboard = await getMinesLeaderboard(parseInt(limit));
            
            res.json({ success: true, leaderboard });
            
        } catch (error) {
            console.error('Error fetching mines leaderboard:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.get('/api/mines/recent-games', requireAuth, async (req, res) => {
        try {
            const { getUserRecentGames } = require('./lib/minesModel');
            
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
            
            const limit = req.query.limit || 10;
            const games = await getUserRecentGames(userJid, parseInt(limit));
            
            res.json({ success: true, games });
            
        } catch (error) {
            console.error('Error fetching recent games:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    app.get('/api/mines/user-rank', requireAuth, async (req, res) => {
        try {
            const { getUserRank } = require('./lib/minesModel');
            
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
            
            const rank = await getUserRank(userJid);
            
            res.json({ success: true, rank: rank || null });
            
        } catch (error) {
            console.error('Error fetching user rank:', error);
            res.json({ success: false, message: 'Server error' });
        }
    });

    // Logout endpoint
    app.get('/logout', (req, res) =>{
        req.session.destroy();
        res.redirect('/');
    });
}

module.exports = { setupDashboardRoutes };