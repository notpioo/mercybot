const config = require('../config/config');
const { getUser, getGroup, logCommandUsage, updateUserInfo, updateGroupInfo } = require('./database');
const { getCommandInfo } = require('../utils/helpers');

// Import commands
const ownerCommand = require('../commands/owner');
const menuCommand = require('../commands/menu');
const profileCommand = require('../commands/profile');
const balanceCommand = require('../commands/balance');
const chipsCommand = require('../commands/chips');
const limitCommand = require('../commands/limit');
const premiumCommand = require('../commands/premium');
const banCommand = require('../commands/ban');
const resetlimitCommand = require('../commands/resetlimit');
const warnCommand = require('../commands/warn');

const commands = {
    owner: ownerCommand,
    creator: ownerCommand,
    menu: menuCommand,
    help: menuCommand,
    commands: menuCommand,
    profile: profileCommand,
    me: profileCommand,
    my: profileCommand,
    addbalance: balanceCommand,
    addbal: balanceCommand,
    delbalance: balanceCommand,
    delbal: balanceCommand,
    addchip: chipsCommand,
    addchips: chipsCommand,
    delchip: chipsCommand,
    delchips: chipsCommand,
    addlimit: limitCommand,
    dellimit: limitCommand,
    addprem: premiumCommand,
    addpremium: premiumCommand,
    delprem: premiumCommand,
    delpremium: premiumCommand,
    ban: banCommand,
    unban: banCommand,
    resetlimit: resetlimitCommand,
    warn: warnCommand,
    maxwarn: warnCommand
};

async function handleMessage(sock, message) {
    try {
        const { key, message: msg } = message;
        const { remoteJid, fromMe, participant } = key;

        // Skip if message is from bot
        if (fromMe) return;

        // Get message text
        const text = getMessageText(msg);
        if (!text) return;

        // Get sender info
        const senderJid = participant || remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');

        // Get or create user
        const user = await getUser(senderJid);
        if (!user) return;

        // Update user info
        const senderName = message.pushName || 'Unknown';
        await updateUserInfo(senderJid, senderName);

        // Check if user is banned
        if (user.isBlocked) {
            // Check if ban has expired
            if (user.banUntil && new Date() > user.banUntil) {
                // Unban user automatically
                const { User } = require('./database');
                await User.updateOne(
                    { jid: senderJid },
                    { $set: { isBlocked: false, banUntil: null } }
                );
                user.isBlocked = false;
                user.banUntil = null;
            } else {
                // User is still banned
                const banText = user.banUntil 
                    ? `You are banned until ${user.banUntil.toLocaleString('id-ID')}`
                    : 'You are permanently banned';
                await sock.sendMessage(remoteJid, {
                    text: `❌ ${banText}`
                });
                return;
            }
        }

        // Check and update premium status
        if (user.status === 'premium' && user.premiumUntil && new Date() > user.premiumUntil) {
            const { User } = require('./database');
            await User.updateOne(
                { jid: senderJid },
                { 
                    $set: { 
                        status: 'basic',
                        premiumUntil: null,
                        limit: config.userSystem.defaultLimit
                    }
                }
            );
            user.status = 'basic';
            user.premiumUntil = null;
            user.limit = config.userSystem.defaultLimit;
        }

        // Handle group info update
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                await updateGroupInfo(
                    remoteJid,
                    groupMetadata.subject,
                    groupMetadata.desc,
                    groupMetadata.participants
                );
            } catch (error) {
                console.error('❌ Failed to get group metadata:', error);
            }
        }

        // Check if message starts with any prefix
        const prefix = config.prefixes.find(p => text.startsWith(p));
        if (!prefix) return;

        // Parse command
        const commandText = text.slice(prefix.length).trim();
        const [commandName, ...args] = commandText.split(' ');

        if (!commandName) return;

        // Find command
        const command = commands[commandName.toLowerCase()];
        if (!command) {
            await sock.sendMessage(remoteJid, {
                text: config.messages.commandNotFound
            });
            return;
        }

        // Check command permission
        const commandConfig = config.commands[commandName.toLowerCase()];
        if (commandConfig && commandConfig.permission) {
            const hasPermission = checkUserPermission(user, commandConfig.permission);
            if (!hasPermission) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ You need ${commandConfig.permission} status to use this command.`
                });
                return;
            }
        }

        // Check and consume limit
        if (commandConfig && commandConfig.useLimit !== false) {
            const canUseCommand = await checkAndConsumeLimit(user);
            if (!canUseCommand) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ You have reached your daily limit. Upgrade to Premium for unlimited usage!`
                });
                return;
            }
        }

        // Log command usage
        await logCommandUsage(commandName, senderJid, isGroup ? remoteJid : null);

        // Log command execution
        console.log(`📨 Command: ${commandName} | User: ${senderName} | ${isGroup ? 'Group' : 'Private'}`);

        // Execute command
        const context = {
            sock,
            message,
            args,
            user,
            isGroup,
            remoteJid,
            senderJid,
            senderName,
            prefix,
            commandName
        };

        await command.execute(context);

    } catch (error) {
        console.error('❌ Error in message handler:', error);

        try {
            await sock.sendMessage(message.key.remoteJid, {
                text: config.messages.error
            });
        } catch (sendError) {
            console.error('❌ Failed to send error message:', sendError);
        }
    }
}

function checkUserPermission(user, requiredPermission) {
    const userStatus = user.status || 'basic';
    const userPermissions = config.userSystem.statuses[userStatus]?.permissions || ['basic'];

    // Owner has all permissions
    if (user.isOwner || userStatus === 'owner') {
        return true;
    }

    return userPermissions.includes(requiredPermission);
}

async function checkAndConsumeLimit(user) {
    const { User } = require('./database');

    // If user has unlimited limit (premium/owner)
    if (user.limit === 'unlimited' || user.status === 'premium' || user.status === 'owner') {
        return true;
    }

    // Check if user has remaining limit
    if (user.limit <= 0) {
        return false;
    }

    // Consume 1 limit
    try {
        await User.updateOne(
            { jid: user.jid },
            { $inc: { limit: -1 } }
        );
        return true;
    } catch (error) {
        console.error('❌ Failed to update user limit:', error);
        return false;
    }
}

function getMessageText(message) {
    if (message.conversation) {
        return message.conversation;
    }

    if (message.extendedTextMessage?.text) {
        return message.extendedTextMessage.text;
    }

    if (message.imageMessage?.caption) {
        return message.imageMessage.caption;
    }

    if (message.videoMessage?.caption) {
        return message.videoMessage.caption;
    }

    if (message.documentMessage?.caption) {
        return message.documentMessage.caption;
    }

    return null;
}

module.exports = {
    handleMessage
};