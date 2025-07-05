
const config = require('../config/config');
const { User } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, commandName } = context;

    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only owners can use this command.'
            });
            return;
        }

        // Get all banned users
        const bannedUsers = await User.find({
            isBlocked: true
        }).sort({ banUntil: 1 });

        if (bannedUsers.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '📋 No banned users found.'
            });
            return;
        }

        let responseText = '╭─「 Banned Users List 」\n';
        let activeBanCount = 0;
        let expiredBanCount = 0;
        let permanentBanCount = 0;

        const now = new Date();

        bannedUsers.forEach((bannedUser, index) => {
            const number = bannedUser.jid.split('@')[0];
            const name = bannedUser.name || 'Unknown';
            
            responseText += `│ ${index + 1}. ${name}\n`;
            responseText += `│    📱 ${number}\n`;
            
            if (bannedUser.banUntil) {
                const banUntil = new Date(bannedUser.banUntil);
                if (banUntil > now) {
                    const timeLeft = banUntil - now;
                    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    
                    responseText += `│    🔒 Active (${days}d ${hours}h ${minutes}m left)\n`;
                    responseText += `│    📅 Until: ${banUntil.toLocaleString('id-ID')}\n`;
                    activeBanCount++;
                } else {
                    responseText += `│    ⚠️ Expired (should be unbanned)\n`;
                    responseText += `│    📅 Expired: ${banUntil.toLocaleString('id-ID')}\n`;
                    expiredBanCount++;
                }
            } else {
                responseText += `│    🔒 Permanent Ban\n`;
                permanentBanCount++;
            }
            
            if (index < bannedUsers.length - 1) {
                responseText += '│ \n';
            }
        });

        responseText += `│ \n│ 📊 Summary:\n`;
        responseText += `│ 🔒 Active Bans: ${activeBanCount}\n`;
        responseText += `│ ♾️ Permanent Bans: ${permanentBanCount}\n`;
        responseText += `│ ⚠️ Expired Bans: ${expiredBanCount}\n`;
        responseText += `│ 📈 Total: ${bannedUsers.length}\n`;
        responseText += '╰────────────────';

        await sock.sendMessage(remoteJid, {
            text: responseText
        });

        console.log(`🔨 ${commandName} executed by ${senderName}`);

    } catch (error) {
        console.error(`❌ Failed to execute ${commandName}:`, error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
