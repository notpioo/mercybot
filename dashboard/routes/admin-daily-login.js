
const { requireAuth, requireOwner } = require('../middleware');
const { getBaseTemplate } = require('../templates');

function setupAdminDailyLoginRoutes(app) {
    // Daily Login Management Page
    app.get('/admin/daily-login', requireAuth, requireOwner, async (req, res) => {
        try {
            const content = `
                <div class="admin-section">
                    <div class="card">
                        <h1>🗓️ Daily Login Rewards Management</h1>
                        <p>Configure rewards for each day of the weekly login cycle.</p>
                    </div>
                    
                    <div class="rewards-management">
                        <div class="management-actions">
                            <button class="btn btn-primary" onclick="loadCurrentRewards()">Refresh Rewards</button>
                            <button class="btn btn-secondary" onclick="resetToDefault()">Reset to Default</button>
                        </div>
                        
                        <div class="rewards-grid-admin">
                            <div id="rewards-list">
                                <div class="loading">Loading rewards...</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Edit Reward Modal -->
                    <div id="edit-reward-modal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 id="modal-title">Edit Day 1 Reward</h3>
                                <button class="close-btn" onclick="closeEditModal()">&times;</button>
                            </div>
                            
                            <form id="edit-reward-form">
                                <input type="hidden" id="edit-day" name="day">
                                
                                <div class="form-group">
                                    <label for="reward-type">Reward Type</label>
                                    <select id="reward-type" name="rewardType" required onchange="togglePremiumDuration()">
                                        <option value="balance">💰 Balance</option>
                                        <option value="chips">🎰 Chips</option>
                                        <option value="premium">👑 Premium</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="reward-amount">Reward Amount</label>
                                    <input type="number" id="reward-amount" name="rewardAmount" min="1" required>
                                </div>
                                
                                <div class="form-group" id="premium-duration-group" style="display: none;">
                                    <label for="premium-duration">Premium Duration (days)</label>
                                    <input type="number" id="premium-duration" name="premiumDuration" min="1" value="1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="reward-active">Status</label>
                                    <div class="toggle-container">
                                        <input type="checkbox" id="reward-active" name="isActive" checked>
                                        <label for="reward-active" class="toggle-label">
                                            <span class="toggle-switch"></span>
                                            <span class="toggle-text">Active</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Update Reward</button>
                                    <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <style>
                    .admin-section {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .rewards-management {
                        margin-top: 2rem;
                    }
                    
                    .management-actions {
                        display: flex;
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }
                    
                    .rewards-grid-admin {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 1.5rem;
                    }
                    
                    .reward-card {
                        background: rgba(255, 255, 255, 0.05);
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        padding: 1.5rem;
                        transition: all 0.3s ease;
                    }
                    
                    .reward-card:hover {
                        border-color: #6366f1;
                        transform: translateY(-2px);
                    }
                    
                    .reward-card.inactive {
                        opacity: 0.6;
                        border-color: #6b7280;
                    }
                    
                    .reward-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    }
                    
                    .day-title {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #6366f1;
                    }
                    
                    .reward-status {
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    
                    .reward-status.active {
                        background: #10b981;
                        color: white;
                    }
                    
                    .reward-status.inactive {
                        background: #6b7280;
                        color: white;
                    }
                    
                    .reward-info {
                        text-align: center;
                        margin-bottom: 1.5rem;
                    }
                    
                    .reward-icon-display {
                        font-size: 3rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .reward-type {
                        font-size: 1rem;
                        color: #ffffff;
                        font-weight: 600;
                        margin-bottom: 0.25rem;
                    }
                    
                    .reward-value {
                        font-size: 1.2rem;
                        color: #6366f1;
                        font-weight: bold;
                    }
                    
                    .reward-actions {
                        text-align: center;
                    }
                    
                    .btn-edit {
                        background: #6366f1;
                        color: white;
                        width: 100%;
                    }
                    
                    .btn-edit:hover {
                        background: #5b56eb;
                    }
                    
                    .modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .modal-content {
                        background: #1a1a1a;
                        border-radius: 15px;
                        padding: 2rem;
                        width: 90%;
                        max-width: 500px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 2rem;
                    }
                    
                    .modal-header h3 {
                        color: #ffffff;
                        margin: 0;
                    }
                    
                    .close-btn {
                        background: none;
                        border: none;
                        color: #cccccc;
                        font-size: 2rem;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .close-btn:hover {
                        color: #ffffff;
                    }
                    
                    .form-group {
                        margin-bottom: 1.5rem;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        color: #ffffff;
                        font-weight: 600;
                    }
                    
                    .form-group input,
                    .form-group select {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.05);
                        color: #ffffff;
                        font-size: 1rem;
                    }
                    
                    .form-group input:focus,
                    .form-group select:focus {
                        outline: none;
                        border-color: #6366f1;
                        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                    }
                    
                    .form-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                    }
                    
                    .loading {
                        text-align: center;
                        padding: 2rem;
                        color: #cccccc;
                        grid-column: 1 / -1;
                    }
                    
                    .toggle-container {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .toggle-label {
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        cursor: pointer;
                        color: #ffffff;
                        font-weight: 600;
                    }
                    
                    .toggle-switch {
                        width: 50px;
                        height: 24px;
                        background: #374151;
                        border-radius: 12px;
                        position: relative;
                        transition: background 0.3s ease;
                    }
                    
                    .toggle-switch::before {
                        content: '';
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        background: white;
                        border-radius: 50%;
                        top: 2px;
                        left: 2px;
                        transition: transform 0.3s ease;
                    }
                    
                    input[type="checkbox"] {
                        display: none;
                    }
                    
                    input[type="checkbox"]:checked + .toggle-label .toggle-switch {
                        background: #10b981;
                    }
                    
                    input[type="checkbox"]:checked + .toggle-label .toggle-switch::before {
                        transform: translateX(26px);
                    }
                    
                    @media (max-width: 768px) {
                        .rewards-grid-admin {
                            grid-template-columns: 1fr;
                        }
                        
                        .modal-content {
                            margin: 1rem;
                            width: calc(100% - 2rem);
                        }
                        
                        .form-actions {
                            flex-direction: column;
                        }
                    }
                </style>
                
                <script>
                    // Load current rewards
                    async function loadCurrentRewards() {
                        try {
                            const response = await fetch('/api/admin/daily-login-rewards');
                            const result = await response.json();
                            
                            if (result.success) {
                                const rewardsList = document.getElementById('rewards-list');
                                
                                if (result.rewards && result.rewards.length > 0) {
                                    rewardsList.innerHTML = result.rewards.map(reward => {
                                        const icon = getRewardIcon(reward.rewardType);
                                        let displayValue = '';
                                        
                                        if (reward.rewardType === 'premium') {
                                            displayValue = 'Premium ' + (reward.premiumDuration || 1) + ' hari';
                                        } else {
                                            displayValue = reward.rewardAmount + ' ' + reward.rewardType;
                                        }
                                        
                                        return '<div class="reward-card' + (reward.isActive ? '' : ' inactive') + '">' +
                                               '<div class="reward-header">' +
                                               '<div class="day-title">Day ' + reward.day + '</div>' +
                                               '<div class="reward-status ' + (reward.isActive ? 'active' : 'inactive') + '">' +
                                               (reward.isActive ? 'Active' : 'Inactive') + '</div>' +
                                               '</div>' +
                                               '<div class="reward-info">' +
                                               '<div class="reward-icon-display">' + icon + '</div>' +
                                               '<div class="reward-type">' + reward.rewardType.charAt(0).toUpperCase() + reward.rewardType.slice(1) + '</div>' +
                                               '<div class="reward-value">' + displayValue + '</div>' +
                                               '</div>' +
                                               '<div class="reward-actions">' +
                                               '<button class="btn btn-edit" onclick="editReward(' + reward.day + ', \\'' + reward.rewardType + '\\', ' + reward.rewardAmount + ', ' + (reward.premiumDuration || 1) + ', ' + reward.isActive + ')">Edit Reward</button>' +
                                               '</div>' +
                                               '</div>';
                                    }).join('');
                                } else {
                                    rewardsList.innerHTML = '<div class="loading">No rewards configured</div>';
                                }
                            } else {
                                document.getElementById('rewards-list').innerHTML = '<div class="loading">Error loading rewards</div>';
                            }
                        } catch (error) {
                            console.error('Error loading rewards:', error);
                            document.getElementById('rewards-list').innerHTML = '<div class="loading">Error loading rewards</div>';
                        }
                    }
                    
                    // Get reward icon
                    function getRewardIcon(type) {
                        switch(type) {
                            case 'balance': return '💰';
                            case 'chips': return '🎰';
                            case 'premium': return '👑';
                            default: return '🎁';
                        }
                    }
                    
                    // Edit reward
                    function editReward(day, type, amount, premiumDuration, isActive) {
                        document.getElementById('modal-title').textContent = 'Edit Day ' + day + ' Reward';
                        document.getElementById('edit-day').value = day;
                        document.getElementById('reward-type').value = type;
                        document.getElementById('reward-amount').value = amount;
                        document.getElementById('premium-duration').value = premiumDuration;
                        document.getElementById('reward-active').checked = isActive;
                        
                        togglePremiumDuration();
                        updateToggleText('reward-active', isActive);
                        
                        document.getElementById('edit-reward-modal').style.display = 'flex';
                    }
                    
                    // Close edit modal
                    function closeEditModal() {
                        document.getElementById('edit-reward-modal').style.display = 'none';
                    }
                    
                    // Toggle premium duration field
                    function togglePremiumDuration() {
                        const rewardType = document.getElementById('reward-type').value;
                        const premiumGroup = document.getElementById('premium-duration-group');
                        
                        if (rewardType === 'premium') {
                            premiumGroup.style.display = 'block';
                        } else {
                            premiumGroup.style.display = 'none';
                        }
                    }
                    
                    // Update toggle text
                    function updateToggleText(toggleId, isChecked) {
                        const toggleText = document.querySelector('#' + toggleId + ' + .toggle-label .toggle-text');
                        if (toggleText) {
                            toggleText.textContent = isChecked ? 'Active' : 'Inactive';
                        }
                    }
                    
                    // Reset to default rewards
                    async function resetToDefault() {
                        if (!confirm('Are you sure you want to reset all rewards to default values? This action cannot be undone!')) {
                            return;
                        }
                        
                        try {
                            const response = await fetch('/api/admin/daily-login-rewards/reset', {
                                method: 'POST'
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('Rewards reset to default successfully!');
                                loadCurrentRewards();
                            } else {
                                alert('Error resetting rewards: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error resetting rewards:', error);
                            alert('Error resetting rewards');
                        }
                    }
                    
                    // Edit reward form submission
                    document.getElementById('edit-reward-form').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const formData = new FormData(this);
                        const rewardData = {
                            day: parseInt(formData.get('day')),
                            rewardType: formData.get('rewardType'),
                            rewardAmount: parseInt(formData.get('rewardAmount')),
                            premiumDuration: formData.get('rewardType') === 'premium' ? parseInt(formData.get('premiumDuration')) : null,
                            isActive: formData.get('isActive') === 'on'
                        };
                        
                        try {
                            const response = await fetch('/api/admin/daily-login-rewards', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(rewardData)
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('Reward updated successfully!');
                                closeEditModal();
                                loadCurrentRewards();
                            } else {
                                alert('Error updating reward: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error updating reward:', error);
                            alert('Error updating reward');
                        }
                    });
                    
                    // Toggle status change handler
                    document.getElementById('reward-active').addEventListener('change', function() {
                        updateToggleText('reward-active', this.checked);
                    });
                    
                    // Load rewards when page loads
                    document.addEventListener('DOMContentLoaded', loadCurrentRewards);
                </script>
            `;
            
            res.send(getBaseTemplate('Daily Login Management', content, 'admin'));
        } catch (error) {
            console.error('Error loading daily login admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    });
}

module.exports = { setupAdminDailyLoginRoutes };
