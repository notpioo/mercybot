const config = require('../config/config');
const { getUser, updateUserActivity } = require('../utils/userUtils');

// Import all commands
const menuCommand = require('../commands/menu');
const pingCommand = require('../commands/ping');
const profileCommand = require('../commands/profile');
const stickerCommand = require('../commands/sticker');

// Command registry
const commands = {
    'menu': menuCommand,
    'ping': pingCommand,
    'profile': profileCommand,
    'sticker': stickerCommand,
    's': stickerCommand
};

const commandHandler = async (sock, from, sender, commandName, args, message) => {
    try {
        // Check if command exists
        const command = commands[commandName];
        if (!command) {
            await sock.sendMessage(from, { 
                text: config.messages.commandNotFound 
            });
            return;
        }
        
        console.log(`🎯 Executing command: ${commandName} for user: ${sender}`);
        
        // Get user data for permission checks
        const user = await getUser(sender);
        if (!user) {
            await sock.sendMessage(from, { 
                text: config.messages.databaseError 
            });
            return;
        }
        
        // Check if command requires limits
        const isLimitCommand = config.commands.limitCommands.includes(commandName);
        if (isLimitCommand || command.requiresLimit) {
            const limitCost = command.limitCost || 1;
            
            // Owner and premium users have unlimited limits
            if (!user.hasUnlimitedLimits() && user.limit < limitCost) {
                await sock.sendMessage(from, { 
                    text: config.messages.insufficientLimit 
                });
                return;
            }
        }
        
        // Execute the command
        const success = await command.execute(sock, from, sender, args, message);
        
        if (success) {
            console.log(`✅ Command ${commandName} executed successfully`);
            
            // Update user activity and award XP
            const activityResult = await updateUserActivity(sender, 'commandUse');
            
            // Send level up notification if user leveled up
            if (activityResult && activityResult.leveledUp) {
                const rank = activityResult.currentRank;
                const levelUpMessage = `
🎉 *LEVEL UP!* 🎉

${rank.icon} **${user.username}** has reached Level **${activityResult.newLevel}**!
📈 Rank: **${rank.name}**
⚡ XP Gained: +${activityResult.xpGained}

Keep using commands to earn more XP! 🚀`;
                
                setTimeout(() => {
                    sock.sendMessage(from, { text: levelUpMessage });
                }, 1000);
            }
        } else {
            console.log(`❌ Command ${commandName} failed to execute`);
        }
        
    } catch (error) {
        console.error(`❌ Error in command handler for ${commandName}:`, error.message);
        await sock.sendMessage(from, { 
            text: config.messages.databaseError 
        });
    }
};

module.exports = commandHandler;
