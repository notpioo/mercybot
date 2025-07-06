
const { processDailyLoginClaim, getUserDailyLoginStatus } = require('../lib/dailyLoginModel');

async function execute(context) {
    const { sock, remoteJid, user, senderName, args } = context;
    
    try {
        if (args[0] === 'claim') {
            // Process claim
            const result = await processDailyLoginClaim(user.jid);
            
            if (result.success) {
                await sock.sendMessage(remoteJid, {
                    text: `🎉 *DAILY LOGIN CLAIMED!*\n\n` +
                          `🏆 *Streak:* ${result.streak} hari\n` +
                          `📅 *Day:* ${result.day}\n` +
                          `🎁 *Reward:* ${result.reward}\n` +
                          `📊 *Total Login:* ${result.totalLogins}\n\n` +
                          `✨ Besok datang lagi untuk reward Day ${result.nextDay}!\n` +
                          `💡 Jangan lupa claim setiap hari agar streak tidak putus!`
                });
            } else {
                let errorMessage = '❌ *GAGAL CLAIM DAILY LOGIN*\n\n';
                
                if (result.reason === 'already_claimed_today') {
                    errorMessage += '⏰ Kamu sudah claim hari ini!\n' +
                                  'Kembali besok untuk melanjutkan streak.';
                } else if (result.reason === 'no_reward_configured') {
                    errorMessage += '🔧 Reward belum dikonfigurasi.\n' +
                                  'Hubungi owner untuk mengatur reward.';
                } else {
                    errorMessage += '🔧 Terjadi kesalahan sistem.\n' +
                                  'Coba lagi nanti atau hubungi owner.';
                }
                
                await sock.sendMessage(remoteJid, { text: errorMessage });
            }
        } else {
            // Show status
            const status = await getUserDailyLoginStatus(user.jid);
            
            if (!status) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Gagal mendapatkan status daily login.'
                });
                return;
            }
            
            const rewardIcons = {
                'balance': '💰',
                'chips': '🎰',
                'premium': '⭐'
            };
            
            let nextRewardText = 'Tidak ada reward';
            if (status.nextReward) {
                if (status.nextReward.rewardType === 'premium') {
                    nextRewardText = `${rewardIcons[status.nextReward.rewardType]} Premium ${status.nextReward.premiumDuration || 1} hari`;
                } else {
                    nextRewardText = `${rewardIcons[status.nextReward.rewardType]} ${status.nextReward.rewardAmount} ${status.nextReward.rewardType}`;
                }
            }
            
            let statusMessage = `🗓️ *DAILY LOGIN STATUS*\n\n` +
                              `🏆 *Current Streak:* ${status.currentStreak} hari\n` +
                              `📅 *Next Day:* Day ${status.currentDay}\n` +
                              `🎁 *Next Reward:* ${nextRewardText}\n` +
                              `📊 *Total Login:* ${status.totalLogins || 0}\n\n`;
            
            if (status.canClaim) {
                statusMessage += `✅ *Kamu bisa claim sekarang!*\n` +
                               `Ketik: \`.dailylogin claim\` untuk claim reward\n\n`;
            } else {
                if (status.reason === 'already_claimed_today') {
                    statusMessage += `⏰ *Sudah claim hari ini*\n` +
                                   `Kembali besok untuk melanjutkan streak!\n\n`;
                } else {
                    statusMessage += `⏰ *Belum bisa claim*\n` +
                                   `Tunggu sampai besok untuk claim lagi.\n\n`;
                }
            }
            
            // Show weekly rewards
            statusMessage += `📋 *WEEKLY REWARDS CYCLE:*\n`;
            status.rewards.forEach(reward => {
                const icon = rewardIcons[reward.rewardType];
                let rewardText = '';
                if (reward.rewardType === 'premium') {
                    rewardText = `Premium ${reward.premiumDuration || 1} hari`;
                } else {
                    rewardText = `${reward.rewardAmount} ${reward.rewardType}`;
                }
                
                const isCurrentDay = reward.day === status.currentDay;
                statusMessage += `${isCurrentDay ? '👉 ' : '   '}Day ${reward.day}: ${icon} ${rewardText}\n`;
            });
            
            statusMessage += `\n💡 *Tips:* Login setiap hari untuk menjaga streak!\n` +
                           `Jika tidak login 1 hari penuh, streak akan reset ke 0.`;
            
            await sock.sendMessage(remoteJid, { text: statusMessage });
        }
        
    } catch (error) {
        console.error('❌ Failed to execute daily login command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ Terjadi kesalahan saat memproses daily login. Coba lagi nanti.'
        });
    }
}

module.exports = {
    execute,
    description: 'Daily login untuk mendapatkan reward harian',
    usage: 'dailylogin [claim]',
    category: 'economy'
};
