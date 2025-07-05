
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

        // Get all users with warnings
        const warnedUsers = await User.find({
            warnings: { $gt: 0 }
        }).sort({ warnings: -1 });

        if (warnedUsers.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '📋 No users with warnings found.'
            });
            return;
        }

        let responseText = '╭─「 Users with Warnings 」\n';
        let highWarningCount = 0; // 3+ warnings
        let mediumWarningCount = 0; // 2 warnings
        let lowWarningCount = 0; // 1 warning

        warnedUsers.forEach((warnedUser, index) => {
            const number = warnedUser.jid.split('@')[0];
            const name = warnedUser.name || 'Unknown';
            const warnings = warnedUser.warnings || 0;
            
            responseText += `│ ${index + 1}. ${name}\n`;
            responseText += `│    📱 ${number}\n`;
            
            // Determine warning level
            let warningIcon = '';
            let warningLevel = '';
            
            if (warnings >= 3) {
                warningIcon = '🔴';
                warningLevel = 'High Risk';
                highWarningCount++;
            } else if (warnings === 2) {
                warningIcon = '🟡';
                warningLevel = 'Medium Risk';
                mediumWarningCount++;
            } else {
                warningIcon = '🟢';
                warningLevel = 'Low Risk';
                lowWarningCount++;
            }
            
            responseText += `│    ${warningIcon} ${warnings} warning(s) - ${warningLevel}\n`;
            
            if (index < warnedUsers.length - 1) {
                responseText += '│ \n';
            }
        });

        responseText += `│ \n│ 📊 Summary:\n`;
        responseText += `│ 🔴 High Risk (3+ warns): ${highWarningCount}\n`;
        responseText += `│ 🟡 Medium Risk (2 warns): ${mediumWarningCount}\n`;
        responseText += `│ 🟢 Low Risk (1 warn): ${lowWarningCount}\n`;
        responseText += `│ 📈 Total: ${warnedUsers.length}\n`;
        responseText += '╰────────────────';

        await sock.sendMessage(remoteJid, {
            text: responseText
        });

        console.log(`⚠️ ${commandName} executed by ${senderName}`);

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
