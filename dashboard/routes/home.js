const { requireAuth } = require('../middleware');
const { getBaseTemplate } = require('../templates');

function setupHomeRoutes(app) {
    // Dashboard redirect to home
    app.get('/dashboard', requireAuth, (req, res) => {
        res.redirect('/home');
    });

    // Home page
    app.get('/home', requireAuth, async (req, res) => {
        try {
            const { getUserDailyLoginStatus } = require('../../lib/dailyLoginModel');
            
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
                    'premium': '👑',
                    'exp': '⭐'
                };
                
                const canClaim = dailyLoginStatus.canClaim;
                const currentDay = dailyLoginStatus.currentDay;
                const currentStreak = dailyLoginStatus.currentStreak;
                const nextReward = dailyLoginStatus.nextReward;
                
                const rewardIcon = rewardIcons[nextReward?.type] || '🎁';
                const rewardText = nextReward?.type === 'premium' ? 
                    `${nextReward.amount} day${nextReward.amount > 1 ? 's' : ''}` : 
                    `${nextReward?.amount || 0}`;
                
                // Generate weekly rewards display
                let weeklyRewardsHtml = '';
                if (dailyLoginStatus.rewards && dailyLoginStatus.rewards.length > 0) {
                    weeklyRewardsHtml = dailyLoginStatus.rewards.map(reward => {
                        const icon = rewardIcons[reward.rewardType] || '🎁';
                        let rewardText = '';
                        if (reward.rewardType === 'premium') {
                            rewardText = `Premium ${reward.premiumDuration || 1} hari`;
                        } else {
                            rewardText = `${reward.rewardAmount} ${reward.rewardType}`;
                        }
                        
                        const isCurrentDay = reward.day === currentDay;
                        const isCompleted = reward.day < currentDay || (!canClaim && reward.day === currentDay);
                        
                        return `
                            <div class="reward-day ${isCurrentDay ? 'current' : ''} ${isCompleted ? 'completed' : ''}">
                                <div class="day-number">Day ${reward.day}</div>
                                <div class="reward-icon-large">${icon}</div>
                                <div class="reward-details">
                                    <div class="reward-name">${rewardText}</div>
                                    ${isCurrentDay && canClaim ? '<div class="claim-indicator">Ready to Claim!</div>' : ''}
                                    ${isCompleted ? '<div class="completed-indicator">✓ Claimed</div>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                dailyLoginSection = `
                <div class="card">
                    <h3>🗓️ Daily Login System</h3>
                    
                    <div class="daily-login-header">
                        <div class="daily-stats">
                            <div class="stat-item">
                                <div class="stat-label">Current Day</div>
                                <div class="stat-value">${currentDay}/7</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Current Streak</div>
                                <div class="stat-value">${currentStreak}</div>
                            </div>
                        </div>
                        
                        <div class="claim-section">
                            ${canClaim ? 
                                '<button class="btn btn-claim" onclick="claimDailyReward()">Claim Day ' + currentDay + ' Reward</button>' : 
                                '<button class="btn btn-secondary" disabled>Already Claimed Today</button>'
                            }
                        </div>
                    </div>
                    
                    <div class="weekly-rewards">
                        <h4>🎁 Weekly Rewards Cycle</h4>
                        <div class="rewards-grid">
                            ${weeklyRewardsHtml}
                        </div>
                    </div>
                </div>
                `;
            }
            
            const content = `
                <div class="welcome-section">
                    <div class="card">
                        <h1>Welcome to NoMercy Dashboard</h1>
                        <p>Hello ${req.session.user.phone}! Welcome to your personal dashboard.</p>
                        <p>Manage your account, view statistics, and access all bot features from here.</p>
                    </div>
                </div>
                
                ${dailyLoginSection}
                
                <div class="grid">
                    <div class="card">
                        <h3>🎯 Quick Actions</h3>
                        <div class="actions-grid">
                            <a href="/profile" class="action-item">
                                <div class="action-icon">👤</div>
                                <div class="action-text">View Profile</div>
                            </a>
                            <a href="/list/inventory" class="action-item">
                                <div class="action-icon">🎒</div>
                                <div class="action-text">Inventory</div>
                            </a>
                            <a href="/list/quiz" class="action-item">
                                <div class="action-icon">🧠</div>
                                <div class="action-text">Take Quiz</div>
                            </a>
                            <a href="/games/mines" class="action-item">
                                <div class="action-icon">💎</div>
                                <div class="action-text">Play Mines</div>
                            </a>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>📊 Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-icon">💰</div>
                                <div class="stat-info">
                                    <div class="stat-label">Balance</div>
                                    <div class="stat-value" id="balance-stat">Loading...</div>
                                </div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-icon">🎰</div>
                                <div class="stat-info">
                                    <div class="stat-label">Chips</div>
                                    <div class="stat-value" id="chips-stat">Loading...</div>
                                </div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-icon">⭐</div>
                                <div class="stat-info">
                                    <div class="stat-label">Level</div>
                                    <div class="stat-value" id="level-stat">Loading...</div>
                                </div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-icon">🏆</div>
                                <div class="stat-info">
                                    <div class="stat-label">Tier</div>
                                    <div class="stat-value" id="tier-stat">Loading...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid">
                    <div class="card">
                        <h3>🎮 Game Features</h3>
                        <div class="features-list">
                            <div class="feature-item">
                                <div class="feature-icon">💎</div>
                                <div class="feature-text">
                                    <div class="feature-title">Mines Game</div>
                                    <div class="feature-desc">Test your luck in the mines casino</div>
                                </div>
                                <a href="/games/mines" class="btn btn-secondary">Play Now</a>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">🧠</div>
                                <div class="feature-text">
                                    <div class="feature-title">Quiz System</div>
                                    <div class="feature-desc">Test your knowledge and earn rewards</div>
                                </div>
                                <a href="/list/quiz" class="btn btn-secondary">Take Quiz</a>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">🎁</div>
                                <div class="feature-text">
                                    <div class="feature-title">Daily Rewards</div>
                                    <div class="feature-desc">Claim your daily login bonuses</div>
                                </div>
                                <button class="btn btn-secondary" onclick="claimDailyReward()">Claim</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>📱 WhatsApp Bot</h3>
                        <div class="bot-info">
                            <p>Your WhatsApp bot is connected and ready to use!</p>
                            <div class="bot-commands">
                                <h4>Popular Commands:</h4>
                                <ul>
                                    <li><code>.menu</code> - Show bot menu</li>
                                    <li><code>.profile</code> - View your profile</li>
                                    <li><code>.dailylogin</code> - Claim daily reward</li>
                                    <li><code>.level</code> - Check your level</li>
                                    <li><code>.balance</code> - Check your balance</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .welcome-section {
                        margin-bottom: 2rem;
                    }
                    
                    .daily-login-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 0.75rem;
                        margin-bottom: 1rem;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    
                    .daily-stats {
                        display: flex;
                        gap: 1rem;
                    }
                    
                    .stat-item {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.03);
                        padding: 0.5rem 0.75rem;
                        border-radius: 6px;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    
                    .stat-label {
                        font-size: 0.7rem;
                        color: #aaaaaa;
                        margin-bottom: 0.25rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .stat-value {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #6366f1;
                    }
                    
                    .claim-section {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    }
                    
                    .weekly-rewards h4 {
                        color: #ffffff;
                        margin-bottom: 0.75rem;
                        font-size: 0.95rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .rewards-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                        gap: 0.5rem;
                    }
                    
                    .reward-day {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 8px;
                        padding: 0.75rem 0.5rem;
                        text-align: center;
                        transition: all 0.3s ease;
                        position: relative;
                        min-height: 90px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    
                    .reward-day.current {
                        border-color: #6366f1;
                        background: rgba(99, 102, 241, 0.1);
                        box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
                    }
                    
                    .reward-day.completed {
                        border-color: #10b981;
                        background: rgba(16, 185, 129, 0.1);
                    }
                    
                    .day-number {
                        font-size: 0.65rem;
                        color: #aaaaaa;
                        font-weight: 500;
                        margin-bottom: 0.25rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .reward-icon-large {
                        font-size: 1.5rem;
                        margin-bottom: 0.25rem;
                        line-height: 1;
                    }
                    
                    .reward-details {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        min-height: 35px;
                    }
                    
                    .reward-name {
                        font-size: 0.75rem;
                        color: #ffffff;
                        font-weight: 500;
                        margin-bottom: 0.15rem;
                        line-height: 1.2;
                    }
                    
                    .claim-indicator {
                        font-size: 0.6rem;
                        color: #6366f1;
                        font-weight: 600;
                        animation: pulse 2s infinite;
                    }
                    
                    .completed-indicator {
                        font-size: 0.6rem;
                        color: #10b981;
                        font-weight: 500;
                    }
                    
                    .btn-claim {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        animation: pulse 2s infinite;
                        padding: 0.6rem 1.2rem;
                        font-size: 0.9rem;
                        border-radius: 6px;
                    }
                    
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                    
                    .actions-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    .action-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        text-decoration: none;
                        color: #ffffff;
                        transition: all 0.3s ease;
                    }
                    
                    .action-item:hover {
                        background: rgba(99, 102, 241, 0.1);
                        transform: translateY(-2px);
                    }
                    
                    .action-icon {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .action-text {
                        text-align: center;
                        font-size: 0.9rem;
                        font-weight: 500;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    .stat-box {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                    }
                    
                    .stat-icon {
                        font-size: 1.5rem;
                    }
                    
                    .stat-info {
                        flex: 1;
                    }
                    
                    .stat-label {
                        font-size: 0.8rem;
                        color: #cccccc;
                        margin-bottom: 0.25rem;
                    }
                    
                    .stat-value {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #6366f1;
                    }
                    
                    .features-list {
                        margin-top: 1rem;
                    }
                    
                    .feature-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        margin-bottom: 1rem;
                    }
                    
                    .feature-item:last-child {
                        margin-bottom: 0;
                    }
                    
                    .feature-icon {
                        font-size: 1.5rem;
                    }
                    
                    .feature-text {
                        flex: 1;
                    }
                    
                    .feature-title {
                        font-weight: bold;
                        color: #ffffff;
                        margin-bottom: 0.25rem;
                    }
                    
                    .feature-desc {
                        font-size: 0.9rem;
                        color: #cccccc;
                    }
                    
                    .bot-info {
                        margin-top: 1rem;
                    }
                    
                    .bot-commands {
                        margin-top: 1rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                    }
                    
                    .bot-commands h4 {
                        color: #ffffff;
                        margin-bottom: 0.5rem;
                    }
                    
                    .bot-commands ul {
                        list-style: none;
                        padding: 0;
                    }
                    
                    .bot-commands li {
                        padding: 0.25rem 0;
                        color: #cccccc;
                    }
                    
                    .bot-commands code {
                        background: rgba(99, 102, 241, 0.2);
                        color: #a5b4fc;
                        padding: 0.2rem 0.4rem;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9rem;
                    }
                    
                    @media (max-width: 768px) {
                        body {
                            overflow-x: hidden;
                        }
                        
                        .welcome-section,
                        .grid,
                        .card {
                            max-width: 100%;
                            overflow-x: hidden;
                        }
                        
                        .daily-login-header {
                            flex-direction: column;
                            align-items: stretch;
                            gap: 0.5rem;
                        }
                        
                        .daily-stats {
                            justify-content: center;
                            gap: 0.75rem;
                        }
                        
                        .rewards-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 0.4rem;
                        }
                        
                        .reward-day {
                            min-height: 80px;
                            padding: 0.5rem 0.3rem;
                        }
                        
                        .reward-name {
                            font-size: 0.7rem;
                        }
                        
                        .day-number {
                            font-size: 0.6rem;
                        }
                        
                        .actions-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.5rem;
                        }
                        
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.5rem;
                        }
                        
                        .feature-item {
                            flex-direction: column;
                            text-align: center;
                            gap: 0.5rem;
                        }
                        
                        .grid {
                            gap: 1rem;
                        }
                        
                        .card {
                            padding: 1rem;
                        }
                        
                        .card h3 {
                            font-size: 1.1rem;
                        }
                        
                        .action-item {
                            padding: 0.75rem;
                        }
                        
                        .action-icon {
                            font-size: 1.5rem;
                        }
                        
                        .action-text {
                            font-size: 0.8rem;
                        }
                        
                        .stat-box {
                            padding: 0.75rem;
                            gap: 0.5rem;
                        }
                        
                        .stat-icon {
                            font-size: 1.2rem;
                        }
                        
                        .stat-value {
                            font-size: 1rem;
                        }
                        
                        .stat-label {
                            font-size: 0.7rem;
                        }
                    }
                </style>
                
                <script>
                    // Load user statistics
                    async function loadUserStats() {
                        try {
                            const response = await fetch('/api/user-stats');
                            const data = await response.json();
                            
                            if (data.success) {
                                document.getElementById('balance-stat').textContent = data.balance || 0;
                                document.getElementById('chips-stat').textContent = data.chips || 0;
                                document.getElementById('level-stat').textContent = data.level || 1;
                                document.getElementById('tier-stat').textContent = data.tier || 'Warrior';
                            }
                        } catch (error) {
                            console.error('Error loading user stats:', error);
                        }
                    }
                    
                    // Claim daily reward
                    async function claimDailyReward() {
                        try {
                            const response = await fetch('/api/daily-login/claim', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                alert('Daily reward claimed successfully!');
                                location.reload();
                            } else {
                                alert('Failed to claim daily reward: ' + data.message);
                            }
                        } catch (error) {
                            console.error('Error claiming daily reward:', error);
                            alert('Error claiming daily reward');
                        }
                    }
                    
                    // Load stats when page loads
                    document.addEventListener('DOMContentLoaded', loadUserStats);
                </script>
            `;
            
            res.send(getBaseTemplate('Home', content, 'home'));
        } catch (error) {
            console.error('Error loading home page:', error);
            res.status(500).send('Internal Server Error');
        }
    });
}

module.exports = { setupHomeRoutes };