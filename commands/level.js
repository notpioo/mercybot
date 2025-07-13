const { getUserLevelInfo, getTierDisplayName } = require('../lib/levelSystem');
const { getAvailableRewards, claimReward } = require('../lib/levelRewardSystem');
const config = require('../config/config');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args } = context;
    
    try {
        const userJid = user.jid;
        
        // Check if user is viewing someone else's level
        let targetJid = userJid;
        let targetName = senderName;
        
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            try {
                const contactInfo = await sock.onWhatsApp(targetJid);
                if (contactInfo && contactInfo[0]?.name) {
                    targetName = contactInfo[0].name;
                } else {
                    targetName = targetJid.split('@')[0];
                }
            } catch (error) {
                targetName = targetJid.split('@')[0];
            }
        }
        
        // Get level information
        const levelInfo = await getUserLevelInfo(targetJid);
        const availableRewards = await getAvailableRewards(targetJid, levelInfo?.level || 1, levelInfo?.tier || 'warrior');
        
        // Check if user wants to claim a reward
        const command = args[0]?.toLowerCase();
        if (command === 'claim' && targetJid === userJid) {
            const rewardType = args[1]?.toLowerCase(); // 'level' or 'tier'
            const levelOrTier = args[2];
            
            if (!rewardType || !levelOrTier) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Invalid claim command!\n\nUsage:\n📊 .level claim level [number]\n🏆 .level claim tier [tier_name]\n\nExample:\n.level claim level 5\n.level claim tier elite`
                });
                return;
            }
            
            const result = await claimReward(targetJid, rewardType, rewardType === 'level' ? parseInt(levelOrTier) : levelOrTier);
            
            if (result.success) {
                let rewardText = '🎉 Reward Claimed Successfully!\n\n';
                rewardText += `🎁 You claimed ${rewardType === 'level' ? 'Level ' + levelOrTier : levelOrTier.charAt(0).toUpperCase() + levelOrTier.slice(1) + ' Tier'} reward!\n\n`;
                rewardText += '💰 Rewards received:\n';
                
                if (result.rewards.balance) {
                    rewardText += `💵 Balance: +${result.rewards.balance}\n`;
                }
                if (result.rewards.chips) {
                    rewardText += `🎰 Chips: +${result.rewards.chips}\n`;
                }
                if (result.rewards.premium) {
                    rewardText += `⭐ Premium: +${result.rewards.premium} days\n`;
                }
                if (result.rewards.special) {
                    rewardText += `🎁 Special: ${result.rewards.special}\n`;
                }
                
                await sock.sendMessage(remoteJid, {
                    text: rewardText,
                    mentions: [targetJid]
                });
            } else {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Failed to claim reward!\n\n📋 Error: ${result.message}\n\n💡 Make sure you have reached the required level or tier before claiming rewards.`
                });
            }
            return;
        }
        
        // Create level display
        const levelText = `╭─「 🎯 LEVEL SYSTEM 」
│ 👤 User: ${targetName}
│ 🏷️ Tag: @${targetJid.split('@')[0]}
│ 
│ 🎯 Level: ${levelInfo?.level || 1}
│ 🏆 Tier: ${levelInfo?.tierName || 'Warrior'}
│ ⚡ Experience: ${levelInfo?.experience || 0}
│ 📊 Progress: ${levelInfo?.progressPercentage || 0}%
│ 🎊 To Next Level: ${levelInfo?.experienceToNext || 100} EXP
│ 
│ 🎁 Available Rewards: ${availableRewards.totalAvailable}
│ 📊 Level Rewards: ${availableRewards.levelRewards.length}
│ 🏆 Tier Rewards: ${availableRewards.tierRewards.length}
│ 
╰─「 📈 TIER PROGRESSION 」
│ 🥉 Warrior (1-10)
│ 🥈 Elite (11-25)
│ 🥇 Master (26-40)
│ 🏆 Grandmaster (41-55)
│ 🌟 Epic (56-75)
│ 💫 Legend (76-100)
│ 🔥 Mythic (101-125)
│ 👑 Honor (126-150)
│ ⚡ Immortal (150+)
╰───────────────────────

📋 Commands:
• .level - View your level info
• .level @user - View someone's level
• .level claim level [number] - Claim level reward
• .level claim tier [tier_name] - Claim tier reward

🎯 Earn EXP by:
• Daily login rewards
• Playing games
• Completing quizzes
• Using bot commands`;

        await sock.sendMessage(remoteJid, {
            text: levelText,
            mentions: [targetJid]
        });
        
        console.log(`🎯 Level info sent for ${targetName}`);
        
    } catch (error) {
        console.error('❌ Failed to send level info:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};