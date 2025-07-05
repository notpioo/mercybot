
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

        // Get all premium users
        const premiumUsers = await User.find({
            $or: [
                { status: 'premium' },
                { status: 'owner' }
            ]
        }).sort({ premiumUntil: 1 });

        if (premiumUsers.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '📋 No premium users found.'
            });
            return;
        }

        let responseText = '╭─「 Premium Users List 」\n';
        let activeCount = 0;
        let expiredCount = 0;
        let ownerCount = 0;

        const now = new Date();

        premiumUsers.forEach((premUser, index) => {
            const number = premUser.jid.split('@')[0];
            const name = premUser.name || 'Unknown';
            
            responseText += `│ ${index + 1}. ${name}\n`;
            responseText += `│    📱 ${number}\n`;
            
            if (premUser.status === 'owner') {
                responseText += `│    👤 Owner (Permanent)\n`;
                ownerCount++;
            } else if (premUser.status === 'premium') {
                if (premUser.premiumUntil) {
                    const premiumUntil = new Date(premUser.premiumUntil);
                    if (premiumUntil > now) {
                        const timeLeft = premiumUntil - now;
                        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        
                        responseText += `│    👑 Active (${days}d ${hours}h left)\n`;
                        activeCount++;
                    } else {
                        responseText += `│    ⚠️ Expired\n`;
                        expiredCount++;
                    }
                } else {
                    responseText += `│    ⚠️ No expiry date\n`;
                    expiredCount++;
                }
            }
            
            if (index < premiumUsers.length - 1) {
                responseText += '│ \n';
            }
        });

        responseText += `│ \n│ 📊 Summary:\n`;
        responseText += `│ 👤 Owners: ${ownerCount}\n`;
        responseText += `│ 👑 Active Premium: ${activeCount}\n`;
        responseText += `│ ⚠️ Expired Premium: ${expiredCount}\n`;
        responseText += `│ 📈 Total: ${premiumUsers.length}\n`;
        responseText += '╰────────────────';

        await sock.sendMessage(remoteJid, {
            text: responseText
        });

        console.log(`👑 ${commandName} executed by ${senderName}`);

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
