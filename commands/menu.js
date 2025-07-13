const config = require('../config/config');

async function execute(context) {
    const { sock, remoteJid, senderName } = context;

    try {
        const menuText = createMenuText(senderName);

        await sock.sendMessage(remoteJid, {
            text: menuText
        });

        console.log('📋 Menu sent successfully');

    } catch (error) {
        console.error('❌ Failed to send menu:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

function createMenuText(userName) {
    const prefixes = config.prefixes.join(' | ');
    const owners = config.owners.join(', ');

    return `╭─「 ${config.botName} 」
│ 👋 Hello ${userName}!
│ 🤖 I'm your WhatsApp assistant
│ 
│ 📋 Available Commands:
│ 
│ 👤 Owner Commands:
│ ${config.prefixes[0]}owner - Get owner contacts
│ ${config.prefixes[0]}creator - Get owner contacts
│ 
│ 💰 Balance Management:
│ ${config.prefixes[0]}addbalance @user amount
│ ${config.prefixes[0]}delbalance @user amount
│ ${config.prefixes[0]}addchip @user amount
│ ${config.prefixes[0]}delchip @user amount
│ 
│ ⏰ Limit Management:
│ ${config.prefixes[0]}addlimit @user amount
│ ${config.prefixes[0]}dellimit @user amount
│ ${config.prefixes[0]}resetlimit - Reset all limits
│ 
│ 👑 Premium Management:
│ ${config.prefixes[0]}addprem @user duration
│ ${config.prefixes[0]}delprem @user
│ 
│ 🔨 Moderation:
│ ${config.prefixes[0]}ban @user duration
│ ${config.prefixes[0]}unban @user
│ ${config.prefixes[0]}warn @user (or reply)
│ ${config.prefixes[0]}delwarn @user amount
│ ${config.prefixes[0]}resetwarn @user
│ ${config.prefixes[0]}maxwarn number
│ ${config.prefixes[0]}resetdaily @user - Reset daily login
│ 
│ 📋 List Commands:
│ ${config.prefixes[0]}prem @user/number - Check premium
│ ${config.prefixes[0]}listprem - List premium users
│ ${config.prefixes[0]}listban - List banned users
│ ${config.prefixes[0]}listwarn - List warned users
│ ${config.prefixes[0]}listbadword - List bad words
│ 
│ 👥 Group Management:
│ ${config.prefixes[0]}add number - Add user to group
│ ${config.prefixes[0]}kick @user/reply - Remove user
│ ${config.prefixes[0]}promote @user/number - Make admin
│ ${config.prefixes[0]}demote @user/number - Remove admin
│ ${config.prefixes[0]}tagall - Mention all members
│ ${config.prefixes[0]}grouplink - Get group invite link
│ ${config.prefixes[0]}del - Delete replied message
│ ${config.prefixes[0]}opengc - Open group chat
│ ${config.prefixes[0]}closegc - Close group chat
│ ${config.prefixes[0]}setppgrup - Set group profile picture
│ 
│ 🚫 Anti-Badword System:
│ ${config.prefixes[0]}antibadword on/off - Toggle filter
│ ${config.prefixes[0]}addbadword word - Add bad word
│ 
│ 📸 Anti-ViewOnce System:
│ ${config.prefixes[0]}antivc on/off - Toggle view once detection
│ 
│ 🎨 Convert Commands:
│ ${config.prefixes[0]}stiker - Convert image/video to sticker
│ 
│ 👥 User Commands:
│ ${config.prefixes[0]}profile - Show your profile
│ ${config.prefixes[0]}profile @mention - Show someone's profile
│ ${config.prefixes[0]}me - Show your profile
│ ${config.prefixes[0]}level - View level progress
│ ${config.prefixes[0]}level @mention - View someone's level
│ ${config.prefixes[0]}dailylogin - Check daily login status
│ ${config.prefixes[0]}dailylogin claim - Claim daily reward
│ ${config.prefixes[0]}inventory - View your inventory
│ 
│ 📖 Information:
│ ${config.prefixes[0]}menu - Show this menu
│ ${config.prefixes[0]}help - Show this menu
│ ${config.prefixes[0]}commands - Show this menu
│ 
│ 
│ 🤖 Owner Commands:
│ ${config.prefixes[0]}setpp - Set bot profile picture
│ 
│ 🔧 Prefixes: ${prefixes}
│ 👤 Owners: ${owners}
│ 
│ 💡 Tips:
│ • Use any prefix before commands
│ • Bot works in both private and group chats
│ • Contact any owner for support
│ 
╰───────────────────────

🌟 Thank you for using ${config.botName}!`;
}

module.exports = {
    execute
};