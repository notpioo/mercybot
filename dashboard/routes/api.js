const { requireAuth, requireOwner } = require('../middleware');
const { 
    createNews, 
    getAllNews, 
    getActiveNews, 
    getNewsById, 
    updateNews, 
    deleteNews, 
    deleteAllNews,
    toggleNewsStatus 
} = require('../../lib/newsModel');

function setupApiRoutes(app) {
    // User currency API
    app.get('/api/user-currency', requireAuth, async (req, res) => {
        try {
            const { getUser } = require('../../lib/database');
            
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
            
            const user = await getUser(userJid);
            
            res.json({
                success: true,
                balance: user?.balance || 0,
                chips: user?.chips || 0
            });
        } catch (error) {
            console.error('Error fetching user currency:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user currency'
            });
        }
    });

    // User stats API
    app.get('/api/user-stats', requireAuth, async (req, res) => {
        try {
            const { getUser } = require('../../lib/database');
            const { getUserLevelInfo } = require('../../lib/levelSystem');
            
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
            
            const user = await getUser(userJid);
            const levelInfo = await getUserLevelInfo(userJid);
            
            res.json({
                success: true,
                balance: user?.balance || 0,
                chips: user?.chips || 0,
                level: levelInfo?.level || 1,
                tier: levelInfo?.tier || 'Warrior',
                experience: levelInfo?.experience || 0,
                requiredExp: levelInfo?.requiredExp || 100
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user stats'
            });
        }
    });

    // User profile API
    app.get('/api/user-profile', requireAuth, async (req, res) => {
        try {
            const { getUser } = require('../../lib/database');
            const { getUserLevelInfo } = require('../../lib/levelSystem');
            const { getUserDailyLoginStatus } = require('../../lib/dailyLoginModel');
            const { getAvailableRewards } = require('../../lib/levelRewardSystem');
            
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
            
            const user = await getUser(userJid);
            const levelInfo = await getUserLevelInfo(userJid);
            const dailyStatus = await getUserDailyLoginStatus(userJid);
            const availableRewards = await getAvailableRewards(userJid, levelInfo?.level || 1, levelInfo?.tier || 'Warrior');
            
            // Get recent game history (mock data for now)
            const gameHistory = [
                { icon: '💎', name: 'Mines', won: true, amount: 50, date: '2 hours ago' },
                { icon: '🧠', name: 'Quiz', won: true, amount: 25, date: '5 hours ago' },
                { icon: '💎', name: 'Mines', won: false, amount: 30, date: '1 day ago' }
            ];
            
            res.json({
                success: true,
                balance: user?.balance || 0,
                chips: user?.chips || 0,
                level: levelInfo?.level || 1,
                tier: levelInfo?.tier || 'Warrior',
                experience: levelInfo?.experience || 0,
                requiredExp: levelInfo?.requiredExp || 100,
                dailyStreak: dailyStatus?.currentStreak || 0,
                dailyDay: dailyStatus?.currentDay || 1,
                canClaimDaily: dailyStatus?.canClaim || false,
                availableRewards: availableRewards || [],
                gameHistory: gameHistory
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user profile'
            });
        }
    });

    // Get daily login rewards (Admin)
    app.get('/api/admin/daily-login-rewards', requireAuth, requireOwner, async (req, res) => {
        try {
            const { DailyLoginConfig } = require('../../lib/dailyLoginModel');
            
            const rewards = await DailyLoginConfig.find().sort({ day: 1 });
            
            res.json({
                success: true,
                rewards: rewards
            });
        } catch (error) {
            console.error('Error fetching daily login rewards:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching rewards'
            });
        }
    });

    // Update daily login reward (Admin)
    app.put('/api/admin/daily-login-rewards', requireAuth, requireOwner, async (req, res) => {
        try {
            const { DailyLoginConfig } = require('../../lib/dailyLoginModel');
            const { day, rewardType, rewardAmount, premiumDuration, isActive } = req.body;
            
            const updateData = {
                rewardType,
                rewardAmount,
                isActive
            };
            
            if (rewardType === 'premium' && premiumDuration) {
                updateData.premiumDuration = premiumDuration;
            }
            
            await DailyLoginConfig.findOneAndUpdate(
                { day: day },
                updateData,
                { upsert: true }
            );
            
            res.json({
                success: true,
                message: 'Reward updated successfully'
            });
        } catch (error) {
            console.error('Error updating daily login reward:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating reward'
            });
        }
    });

    // Reset daily login rewards to default (Admin)
    app.post('/api/admin/daily-login-rewards/reset', requireAuth, requireOwner, async (req, res) => {
        try {
            const { DailyLoginConfig } = require('../../lib/dailyLoginModel');
            
            // Clear existing rewards
            await DailyLoginConfig.deleteMany({});
            
            // Insert default rewards
            const defaultRewards = [
                { day: 1, rewardType: 'balance', rewardAmount: 500 },
                { day: 2, rewardType: 'chips', rewardAmount: 100 },
                { day: 3, rewardType: 'balance', rewardAmount: 750 },
                { day: 4, rewardType: 'chips', rewardAmount: 200 },
                { day: 5, rewardType: 'balance', rewardAmount: 1000 },
                { day: 6, rewardType: 'chips', rewardAmount: 300 },
                { day: 7, rewardType: 'premium', rewardAmount: 1, premiumDuration: 1 }
            ];
            
            await DailyLoginConfig.insertMany(defaultRewards);
            
            res.json({
                success: true,
                message: 'Rewards reset to default successfully'
            });
        } catch (error) {
            console.error('Error resetting daily login rewards:', error);
            res.status(500).json({
                success: false,
                message: 'Error resetting rewards'
            });
        }
    });

    // Daily login claim API
    app.post('/api/daily-login/claim', requireAuth, async (req, res) => {
        try {
            const { processDailyLoginClaim } = require('../../lib/dailyLoginModel');
            
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
                    message: 'Daily reward claimed successfully',
                    reward: result.reward
                });
            } else {
                res.json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            res.status(500).json({
                success: false,
                message: 'Error claiming daily reward'
            });
        }
    });

    // Level rewards claim API
    app.post('/api/level-rewards/claim', requireAuth, async (req, res) => {
        try {
            const { claimReward } = require('../../lib/levelRewardSystem');
            const { rewardId } = req.body;
            
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
            
            const result = await claimReward(userJid, rewardId);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Reward claimed successfully',
                    reward: result.reward
                });
            } else {
                res.json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
            res.status(500).json({
                success: false,
                message: 'Error claiming reward'
            });
        }
    });

    // User chips API
    app.get('/api/user/chips', requireAuth, async (req, res) => {
        try {
            const { getUser } = require('../../lib/database');
            
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
            
            const user = await getUser(userJid);
            
            res.json({
                success: true,
                chips: user?.chips || 0
            });
        } catch (error) {
            console.error('Error fetching user chips:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user chips'
            });
        }
    });

    // Update user chips API
    app.post('/api/user/update-chips', requireAuth, async (req, res) => {
        try {
            const { getUser } = require('../../lib/database');
            const { User } = require('../../lib/database');
            const { amount } = req.body;
            
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
            
            const user = await getUser(userJid);
            const currentChips = user?.chips || 0;
            const newChips = currentChips + amount;
            
            // Update user chips in database
            await User.updateOne(
                { jid: userJid },
                { $set: { chips: newChips } }
            );
            
            res.json({
                success: true,
                chips: newChips
            });
        } catch (error) {
            console.error('Error updating user chips:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user chips'
            });
        }
    });

    // Admin reset daily login API - removed
    app.post('/api/admin/reset-daily-login', async (req, res) => {
        res.status(404).json({ success: false, message: 'Admin API removed' });
    });

    // News management API endpoints
    
    // Get all news (admin only)
    app.get('/api/admin/news', requireAuth, requireOwner, async (req, res) => {
        try {
            const result = await getAllNews(true); // Include inactive news for admin
            res.json(result);
        } catch (error) {
            console.error('Error fetching all news:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching news'
            });
        }
    });

    // Get active news (public)
    app.get('/api/news', requireAuth, async (req, res) => {
        try {
            const result = await getActiveNews();
            res.json(result);
        } catch (error) {
            console.error('Error fetching active news:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching news'
            });
        }
    });

    // Create news (admin only)
    app.post('/api/admin/news', requireAuth, requireOwner, async (req, res) => {
        try {
            const { title, content, category, status = 'active' } = req.body;
            
            if (!title || !content || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, content, and category are required'
                });
            }
            
            const newsData = {
                title,
                content,
                category,
                status,
                author: req.session.user.phone
            };
            
            const result = await createNews(newsData);
            res.json(result);
        } catch (error) {
            console.error('Error creating news:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating news'
            });
        }
    });

    // Update news (admin only)
    app.put('/api/admin/news/:id', requireAuth, requireOwner, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, content, category, status } = req.body;
            
            const updateData = {};
            if (title) updateData.title = title;
            if (content) updateData.content = content;
            if (category) updateData.category = category;
            if (status) updateData.status = status;
            
            const result = await updateNews(id, updateData);
            res.json(result);
        } catch (error) {
            console.error('Error updating news:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating news'
            });
        }
    });

    // Delete all news (admin only) - Must come before /:id route
    app.delete('/api/admin/news/all', requireAuth, requireOwner, async (req, res) => {
        try {
            const result = await deleteAllNews();
            res.json(result);
        } catch (error) {
            console.error('Error deleting all news:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting all news'
            });
        }
    });

    // Delete news (admin only)
    app.delete('/api/admin/news/:id', requireAuth, requireOwner, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await deleteNews(id);
            res.json(result);
        } catch (error) {
            console.error('Error deleting news:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting news'
            });
        }
    });

    // Toggle news status (admin only)
    app.patch('/api/admin/news/:id/toggle', requireAuth, requireOwner, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await toggleNewsStatus(id);
            res.json(result);
        } catch (error) {
            console.error('Error toggling news status:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling news status'
            });
        }
    });
}

module.exports = { setupApiRoutes };