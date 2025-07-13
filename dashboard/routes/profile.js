const { requireAuth } = require('../middleware');
const { getBaseTemplate } = require('../templates');

function setupProfileRoutes(app) {
    // Profile page
    app.get('/profile', requireAuth, async (req, res) => {
        try {
            const content = `
                <div class="profile-section">
                    <div class="card">
                        <h1>👤 User Profile</h1>
                        <p>Manage your account information and view your statistics.</p>
                    </div>
                    
                    <div class="profile-grid">
                        <div class="card profile-info">
                            <h3>📱 Account Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Phone Number</div>
                                    <div class="info-value">${req.session.user.phone}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Role</div>
                                    <div class="info-value badge badge-${req.session.user.role === 'owner' ? 'primary' : 'secondary'}">${req.session.user.role}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Status</div>
                                    <div class="info-value badge badge-success">Active</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card profile-stats">
                            <h3>📊 Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">💰</div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="profile-balance">Loading...</div>
                                        <div class="stat-label">Balance</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">🎰</div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="profile-chips">Loading...</div>
                                        <div class="stat-label">Chips</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">⭐</div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="profile-level">Loading...</div>
                                        <div class="stat-label">Level</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">🏆</div>
                                    <div class="stat-info">
                                        <div class="stat-value" id="profile-tier">Loading...</div>
                                        <div class="stat-label">Tier</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${req.session.user.role === 'owner' ? `
                    <div class="card admin-panel">
                        <h3>🛠️ Admin Panel</h3>
                        <p>Access admin features and manage the bot system.</p>
                        <div class="admin-actions">
                            <a href="/admin" class="btn btn-admin">
                                <span class="btn-icon">⚙️</span>
                                Admin Dashboard
                            </a>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="profile-grid">
                        <div class="card level-progress">
                            <h3>⚡ Level Progress</h3>
                            <div class="level-info">
                                <div class="level-current">
                                    <div class="level-number" id="current-level">Loading...</div>
                                    <div class="level-tier" id="current-tier">Loading...</div>
                                </div>
                                <div class="level-progress-bar">
                                    <div class="progress-info">
                                        <span id="current-exp">0</span> / <span id="required-exp">0</span> EXP
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar" id="exp-progress" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="level-rewards">
                                <h4>🎁 Available Rewards</h4>
                                <div id="level-rewards-list">Loading...</div>
                            </div>
                        </div>
                        
                        <div class="card daily-login">
                            <h3>🗓️ Daily Login</h3>
                            <div class="daily-info">
                                <div class="daily-stats">
                                    <div class="daily-stat">
                                        <div class="daily-stat-value" id="daily-streak">Loading...</div>
                                        <div class="daily-stat-label">Current Streak</div>
                                    </div>
                                    <div class="daily-stat">
                                        <div class="daily-stat-value" id="daily-day">Loading...</div>
                                        <div class="daily-stat-label">Day</div>
                                    </div>
                                </div>
                                <div class="daily-action">
                                    <button class="btn" id="daily-claim-btn" onclick="claimDailyReward()">
                                        Claim Daily Reward
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card game-history">
                        <h3>🎮 Recent Game History</h3>
                        <div class="history-table">
                            <div id="game-history-list">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .profile-section {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .profile-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 2rem;
                        margin-bottom: 2rem;
                    }
                    
                    .info-grid {
                        display: grid;
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    .info-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                    }
                    
                    .info-label {
                        font-weight: 600;
                        color: #cccccc;
                    }
                    
                    .info-value {
                        color: #ffffff;
                        font-weight: 600;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    .stat-card {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        transition: all 0.3s ease;
                    }
                    
                    .stat-card:hover {
                        background: rgba(99, 102, 241, 0.1);
                        transform: translateY(-2px);
                    }
                    
                    .stat-icon {
                        font-size: 1.5rem;
                    }
                    
                    .stat-info {
                        flex: 1;
                    }
                    
                    .stat-value {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #6366f1;
                    }
                    
                    .stat-label {
                        font-size: 0.8rem;
                        color: #cccccc;
                        margin-top: 0.25rem;
                    }
                    
                    .level-info {
                        display: flex;
                        align-items: center;
                        gap: 2rem;
                        margin-top: 1rem;
                    }
                    
                    .level-current {
                        text-align: center;
                        min-width: 80px;
                    }
                    
                    .level-number {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #6366f1;
                    }
                    
                    .level-tier {
                        font-size: 0.9rem;
                        color: #cccccc;
                        margin-top: 0.25rem;
                    }
                    
                    .level-progress-bar {
                        flex: 1;
                    }
                    
                    .progress-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                        color: #cccccc;
                    }
                    
                    .level-rewards {
                        margin-top: 1.5rem;
                    }
                    
                    .level-rewards h4 {
                        color: #ffffff;
                        margin-bottom: 1rem;
                    }
                    
                    .reward-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        margin-bottom: 0.5rem;
                    }
                    
                    .reward-info {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .reward-icon {
                        font-size: 1.2rem;
                    }
                    
                    .reward-text {
                        color: #cccccc;
                    }
                    
                    .daily-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 1rem;
                    }
                    
                    .daily-stats {
                        display: flex;
                        gap: 2rem;
                    }
                    
                    .daily-stat {
                        text-align: center;
                    }
                    
                    .daily-stat-value {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #6366f1;
                    }
                    
                    .daily-stat-label {
                        font-size: 0.8rem;
                        color: #cccccc;
                        margin-top: 0.25rem;
                    }
                    
                    .history-table {
                        margin-top: 1rem;
                    }
                    
                    .history-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        margin-bottom: 0.5rem;
                    }
                    
                    .history-game {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .history-icon {
                        font-size: 1.2rem;
                    }
                    
                    .history-info {
                        color: #cccccc;
                    }
                    
                    .history-result {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .history-amount {
                        font-weight: bold;
                    }
                    
                    .history-win {
                        color: #10b981;
                    }
                    
                    .history-loss {
                        color: #ef4444;
                    }
                    
                    .history-date {
                        font-size: 0.8rem;
                        color: #9ca3af;
                    }
                    
                    @media (max-width: 768px) {
                        .profile-section {
                            padding: 0 10px;
                            max-width: 100%;
                            overflow-x: hidden;
                        }
                        
                        .profile-grid {
                            grid-template-columns: 1fr;
                            gap: 1rem;
                        }
                        
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.5rem;
                        }
                        
                        .stat-card {
                            padding: 0.75rem;
                            gap: 0.5rem;
                        }
                        
                        .stat-icon {
                            font-size: 1.2rem;
                        }
                        
                        .stat-value {
                            font-size: 1rem;
                        }
                        
                        .level-info {
                            flex-direction: column;
                            gap: 1rem;
                        }
                        
                        .daily-info {
                            flex-direction: column;
                            gap: 1rem;
                        }
                        
                        .history-item {
                            flex-direction: column;
                            gap: 0.5rem;
                            text-align: center;
                        }
                        
                        .info-item {
                            padding: 0.75rem;
                            flex-direction: column;
                            gap: 0.5rem;
                            text-align: center;
                        }
                        
                        .info-label {
                            font-size: 0.8rem;
                        }
                        
                        .info-value {
                            font-size: 0.9rem;
                        }
                        
                        .admin-actions {
                            justify-content: stretch;
                        }
                        
                        .btn-admin {
                            padding: 0.75rem 1rem;
                            font-size: 0.9rem;
                        }
                        
                        .card {
                            padding: 1rem;
                            margin-bottom: 1rem;
                        }
                        
                        .card h3 {
                            font-size: 1.1rem;
                        }
                        
                        .card p {
                            font-size: 0.9rem;
                        }
                    }
                    
                    .admin-panel {
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        border: 2px solid #6366f1;
                        margin-bottom: 2rem;
                    }
                    
                    .admin-panel h3 {
                        color: #ffffff;
                        margin-bottom: 0.5rem;
                    }
                    
                    .admin-panel p {
                        color: rgba(255, 255, 255, 0.8);
                        margin-bottom: 1.5rem;
                    }
                    
                    .admin-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: center;
                    }
                    
                    .btn-admin {
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        color: #ffffff;
                        padding: 1rem 2rem;
                        border-radius: 10px;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .btn-admin:hover {
                        background: rgba(255, 255, 255, 0.3);
                        border-color: rgba(255, 255, 255, 0.5);
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    }
                    
                    .btn-icon {
                        font-size: 1.2rem;
                    }
                </style>
                
                <script>
                    // Load user profile data
                    async function loadProfileData() {
                        try {
                            const response = await fetch('/api/user-profile');
                            const data = await response.json();
                            
                            if (data.success) {
                                // Update stats
                                document.getElementById('profile-balance').textContent = data.balance || 0;
                                document.getElementById('profile-chips').textContent = data.chips || 0;
                                document.getElementById('profile-level').textContent = data.level || 1;
                                document.getElementById('profile-tier').textContent = data.tier || 'Warrior';
                                
                                // Update level progress
                                document.getElementById('current-level').textContent = data.level || 1;
                                document.getElementById('current-tier').textContent = data.tier || 'Warrior';
                                document.getElementById('current-exp').textContent = data.experience || 0;
                                document.getElementById('required-exp').textContent = data.requiredExp || 100;
                                
                                const progressPercent = ((data.experience || 0) / (data.requiredExp || 100)) * 100;
                                document.getElementById('exp-progress').style.width = progressPercent + '%';
                                
                                // Update daily login
                                document.getElementById('daily-streak').textContent = data.dailyStreak || 0;
                                document.getElementById('daily-day').textContent = (data.dailyDay || 1) + '/7';
                                
                                const claimBtn = document.getElementById('daily-claim-btn');
                                if (data.canClaimDaily) {
                                    claimBtn.textContent = 'Claim Daily Reward';
                                    claimBtn.disabled = false;
                                    claimBtn.className = 'btn';
                                } else {
                                    claimBtn.textContent = 'Already Claimed';
                                    claimBtn.disabled = true;
                                    claimBtn.className = 'btn btn-secondary';
                                }
                                
                                // Update level rewards
                                const rewardsList = document.getElementById('level-rewards-list');
                                if (data.availableRewards && data.availableRewards.length > 0) {
                                    rewardsList.innerHTML = data.availableRewards.map(reward => 
                                        '<div class="reward-item">' +
                                        '<div class="reward-info">' +
                                        '<span class="reward-icon">' + reward.icon + '</span>' +
                                        '<span class="reward-text">' + reward.text + '</span>' +
                                        '</div>' +
                                        '<button class="btn btn-secondary" onclick="claimReward(\'' + reward.id + '\')">Claim</button>' +
                                        '</div>'
                                    ).join('');
                                } else {
                                    rewardsList.innerHTML = '<div class="reward-item"><div class="reward-text">No rewards available</div></div>';
                                }
                                
                                // Update game history
                                const historyList = document.getElementById('game-history-list');
                                if (data.gameHistory && data.gameHistory.length > 0) {
                                    historyList.innerHTML = data.gameHistory.map(game => 
                                        '<div class="history-item">' +
                                        '<div class="history-game">' +
                                        '<span class="history-icon">' + game.icon + '</span>' +
                                        '<span class="history-info">' + game.name + '</span>' +
                                        '</div>' +
                                        '<div class="history-result">' +
                                        '<span class="history-amount ' + (game.won ? 'history-win' : 'history-loss') + '">' +
                                        (game.won ? '+' : '-') + game.amount +
                                        '</span>' +
                                        '</div>' +
                                        '<div class="history-date">' + game.date + '</div>' +
                                        '</div>'
                                    ).join('');
                                } else {
                                    historyList.innerHTML = '<div class="history-item"><div class="history-info">No recent games</div></div>';
                                }
                            }
                        } catch (error) {
                            console.error('Error loading profile data:', error);
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
                                loadProfileData();
                            } else {
                                alert('Failed to claim daily reward: ' + data.message);
                            }
                        } catch (error) {
                            console.error('Error claiming daily reward:', error);
                            alert('Error claiming daily reward');
                        }
                    }
                    
                    // Claim level reward
                    async function claimReward(rewardId) {
                        try {
                            const response = await fetch('/api/level-rewards/claim', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ rewardId })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                alert('Reward claimed successfully!');
                                loadProfileData();
                            } else {
                                alert('Failed to claim reward: ' + data.message);
                            }
                        } catch (error) {
                            console.error('Error claiming reward:', error);
                            alert('Error claiming reward');
                        }
                    }
                    
                    // Load profile data when page loads
                    document.addEventListener('DOMContentLoaded', loadProfileData);
                </script>
            `;
            
            res.send(getBaseTemplate('Profile', content, 'profile'));
        } catch (error) {
            console.error('Error loading profile page:', error);
            res.status(500).send('Internal Server Error');
        }
    });
}

module.exports = { setupProfileRoutes };