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
const checkpremCommand = require('../commands/checkprem');
const listpremCommand = require('../commands/listprem');
const listwarnCommand = require('../commands/listwarn');
const listbanCommand = require('../commands/listban');
const groupmanageCommand = require('../commands/groupmanage');
const addCommand = require('../commands/add');
const kickCommand = require('../commands/kick');
const tagallCommand = require('../commands/tagall');
const antibadwordCommand = require('../commands/antibadword');
const addbadwordCommand = require('../commands/addbadword');
const grouplinkCommand = require('../commands/grouplink');
const forceaddCommand = require('../commands/forceadd');
const directinviteCommand = require('../commands/directinvite');
const manualinviteCommand = require('../commands/manualinvite');
const delwarnCommand = require('../commands/delwarn');
const resetwarnCommand = require('../commands/resetwarn');
const listbadwordCommand = require('../commands/listbadword');
const promoteCommand = require('../commands/promote');
const demoteCommand = require('../commands/demote');
const antivcCommand = require('../commands/antivc');
const { handleAutoAntiViewOnce } = require('../commands/antivc');
const stikerCommand = require('../commands/stiker');
const delCommand = require('../commands/del');
const opengcCommand = require('../commands/opengc');
const closegcCommand = require('../commands/closegc');
const setppgrupCommand = require('../commands/setppgrup');
const setppCommand = require('../commands/setpp');
const dailyloginCommand = require('../commands/dailylogin');
const resetdailyCommand = require('../commands/resetdaily');

// Build commands object from config
const commandModules = {
    owner: ownerCommand,
    menu: menuCommand,
    profile: profileCommand,
    addbalance: balanceCommand,
    delbalance: balanceCommand,
    addchip: chipsCommand,
    delchip: chipsCommand,
    addlimit: limitCommand,
    dellimit: limitCommand,
    addprem: premiumCommand,
    delprem: premiumCommand,
    ban: banCommand,
    unban: banCommand,
    resetlimit: resetlimitCommand,
    warn: warnCommand,
    maxwarn: warnCommand,
    prem: checkpremCommand,
    listprem: listpremCommand,
    listban: listbanCommand,
    listwarn: listwarnCommand,
    add: addCommand,
    kick: kickCommand,
    tagall: tagallCommand,
    antibadword: antibadwordCommand,
    addbadword: addbadwordCommand,
    delbadword: require('../commands/delbadword'),
    listbadword: listbadwordCommand,
    grouplink: grouplinkCommand,
    forceadd: forceaddCommand,
    directinvite: directinviteCommand,
    manualinvite: manualinviteCommand,
    delwarn: delwarnCommand,
    resetwarn: resetwarnCommand,
    promote: promoteCommand,
    demote: demoteCommand,
    groupmanage: groupmanageCommand,
    antivc: antivcCommand,
    stiker: stikerCommand,
    del: delCommand,
    opengc: opengcCommand,
    closegc: closegcCommand,
    setppgrup: setppgrupCommand,
    setpp: setppCommand,
    dailylogin: dailyloginCommand,
    resetdaily: resetdailyCommand
};

// Build commands with aliases from config
const commands = {};
Object.keys(config.commands).forEach(commandName => {
    const commandConfig = config.commands[commandName];
    const commandModule = commandModules[commandName];
    
    if (commandModule) {
        // Add all aliases for this command
        commandConfig.aliases.forEach(alias => {
            commands[alias] = commandModule;
        });
    }
});

async function handleMessage(sock, message) {
    try {
        const { key, message: msg } = message;
        const { remoteJid, fromMe, participant } = key;

        // Skip if message is from bot
        if (fromMe) return;

        // Get message text
        const text = getMessageText(msg);

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

        // Handle group info update and anti-badword check
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                await updateGroupInfo(
                    remoteJid,
                    groupMetadata.subject,
                    groupMetadata.desc,
                    groupMetadata.participants
                );

                // Get group settings
                const group = await getGroup(remoteJid);
                


                // Check for badwords in group
                if (group && group.settings.antiBadword && group.settings.badWords.length > 0) {
                    const badwordDetected = await checkBadWords(text, group.settings.badWords, sock, remoteJid, senderJid, senderName, message);
                    if (badwordDetected) {
                        return; // Stop processing if badword was detected
                    }
                }

                // Auto anti-view-once detection
                if (group && group.settings.antiViewOnce) {
                    const viewOnceHandled = await handleAutoAntiViewOnce(sock, message, remoteJid, senderJid, senderName);
                    if (viewOnceHandled) {
                        return; // Stop processing if view once was handled
                    }
                }
            } catch (error) {
                console.error('❌ Failed to get group metadata:', error);
            }
        }

        // Check if message starts with any prefix (only for text messages)
        if (!text) return; // No text, no command to process
        
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

        // Find the actual command name from config
        let actualCommandName = null;
        let commandConfig = null;
        
        for (const [configCommandName, configData] of Object.entries(config.commands)) {
            if (configData.aliases.includes(commandName.toLowerCase())) {
                actualCommandName = configCommandName;
                commandConfig = configData;
                break;
            }
        }

        // Check command permission
        if (commandConfig && commandConfig.permission) {
            const hasPermission = await checkUserPermission(user, commandConfig.permission, sock, remoteJid);
            if (!hasPermission) {
                const permissionText = commandConfig.permission === 'admin' 
                    ? 'status admin atau menjadi admin grup' 
                    : `status ${commandConfig.permission}`;
                await sock.sendMessage(remoteJid, {
                    text: `❌ Anda membutuhkan ${permissionText} untuk menggunakan command ini.`
                });
                return;
            }
        }

        // Check and consume limit
        if (commandConfig && commandConfig.useLimit !== false) {
            const canUseCommand = await checkAndConsumeLimit(user);
            if (!canUseCommand) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Anda telah mencapai batas harian. Upgrade ke Premium untuk penggunaan tidak terbatas!`
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

async function checkUserPermission(user, requiredPermission, sock, remoteJid) {
    const userStatus = user.status || 'basic';
    const userPermissions = config.userSystem.statuses[userStatus]?.permissions || ['basic'];

    // Owner has all permissions
    if (user.isOwner || userStatus === 'owner') {
        return true;
    }

    // Check if permission requires admin and user is group admin
    if (requiredPermission === 'admin' && remoteJid && remoteJid.endsWith('@g.us')) {
        try {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const isGroupAdmin = groupMetadata.participants.find(p => 
                p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
            );
            
            if (isGroupAdmin) {
                return true;
            }
        } catch (error) {
            console.error('Error checking group admin status:', error);
        }
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

    // Handle view once messages (viewOnceMessage)
    if (message.viewOnceMessage) {
        const viewOnceContent = message.viewOnceMessage.message;
        if (viewOnceContent.imageMessage?.caption) {
            return viewOnceContent.imageMessage.caption;
        }
        if (viewOnceContent.videoMessage?.caption) {
            return viewOnceContent.videoMessage.caption;
        }
    }

    // Handle view once messages V2 (viewOnceMessageV2)
    if (message.viewOnceMessageV2) {
        const viewOnceContent = message.viewOnceMessageV2.message;
        if (viewOnceContent.imageMessage?.caption) {
            return viewOnceContent.imageMessage.caption;
        }
        if (viewOnceContent.videoMessage?.caption) {
            return viewOnceContent.videoMessage.caption;
        }
    }

    // Handle ephemeral messages (alternative view once format)
    if (message.ephemeralMessage) {
        return getMessageText(message.ephemeralMessage.message);
    }

    return null;
}

async function checkBadWords(text, badWords, sock, remoteJid, senderJid, senderName, message) {
    try {
        // Check if text is null or undefined
        if (!text || typeof text !== 'string') {
            return false; // No text to check
        }
        
        // Check if badWords array is valid
        if (!badWords || !Array.isArray(badWords) || badWords.length === 0) {
            return false; // No badwords to check
        }
        
        // Convert text to lowercase for checking
        const textLower = text.toLowerCase();
        
        // Split text into words and check each word individually
        const words = textLower.split(/\s+/); // Split by whitespace
        
        // Check if any badword matches exactly with any word in the message
        const foundBadwords = badWords.filter(badword => {
            if (!badword || typeof badword !== 'string') return false;
            
            const badwordLower = badword.toLowerCase().trim();
            return words.some(word => {
                // Remove common punctuation from word for comparison
                const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '');
                return cleanWord === badwordLower;
            });
        });
        
        if (foundBadwords.length === 0) {
            return false; // No badwords found
        }

        // Get user to add warning
        const { User } = require('./database');
        const user = await User.findOne({ jid: senderJid });
        
        if (!user) {
            return false;
        }

        // Skip only if user is bot owner (based on config)
        const { isOwner } = require('../utils/helpers');
        const isUserBotOwner = isOwner(senderJid);
        
        if (isUserBotOwner) {
            return false; // Bot owner tidak kena deteksi badword
        }

        // Group admins now also get warnings, only bot owners are exempt

        // AUTO-DELETE MESSAGE WITH BADWORD
        try {
            if (message && message.key) {
                await sock.sendMessage(remoteJid, { delete: message.key });
                console.log(`🗑️ Auto-deleted message from ${senderName} containing badword: ${foundBadwords.join(', ')}`);
            }
        } catch (deleteError) {
            console.error('Failed to delete message:', deleteError);
        }

        // Add warning to user
        const newWarningCount = (user.warnings || 0) + 1;
        await User.updateOne(
            { jid: senderJid },
            { $set: { warnings: newWarningCount } }
        );

        // Get group settings for maxWarnings
        const { getGroup } = require('./database');
        const group = await getGroup(remoteJid);
        const maxWarnings = group?.settings?.maxWarnings || 3;

        // Send warning message
        const warningMessage = `⚠️ *BADWORD DETECTED*\n\n` +
            `👤 User: @${senderJid.split('@')[0]}\n` +
            `🚫 Detected: ${foundBadwords.join(', ')}\n` +
            `⚠️ Warning: ${newWarningCount}/${maxWarnings}\n\n` +
            `❌ Please keep the conversation clean and respectful.`;

        await sock.sendMessage(remoteJid, {
            text: warningMessage,
            mentions: [senderJid]
        });

        // Check if user reached max warnings
        if (newWarningCount >= maxWarnings) {
            try {
                // Get group metadata to check if bot is admin and user is group admin
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const botNumber = sock.user?.id?.split(':')[0] || sock.user?.jid?.split('@')[0] || sock.user?.number;
                const isBotAdmin = groupMetadata.participants.find(p => {
                    const participantNumber = p.id.split('@')[0];
                    return participantNumber === botNumber && (p.admin === 'admin' || p.admin === 'superadmin');
                });

                // Check if user is group admin
                const isUserGroupAdmin = groupMetadata.participants.find(p => 
                    p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin')
                );

                if (isBotAdmin) {
                    if (isUserGroupAdmin) {
                        // Don't kick group admin, just send warning
                        await sock.sendMessage(remoteJid, {
                            text: `🚨 *MAX WARNINGS REACHED*\n\n@${senderJid.split('@')[0]} has reached maximum warnings (${maxWarnings}) but won't be kicked due to admin status.\n\n⚠️ Please be more careful with your language.`,
                            mentions: [senderJid]
                        });
                    } else {
                        // Remove regular user from group
                        await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                        
                        // Reset warnings after kick
                        await User.updateOne(
                            { jid: senderJid },
                            { $set: { warnings: 0 } }
                        );

                        await sock.sendMessage(remoteJid, {
                            text: `🚨 *AUTO KICK*\n\n@${senderJid.split('@')[0]} has been removed from the group for reaching maximum warnings (${maxWarnings}).`,
                            mentions: [senderJid]
                        });
                    }
                } else {
                    await sock.sendMessage(remoteJid, {
                        text: `🚨 *MAX WARNINGS REACHED*\n\n@${senderJid.split('@')[0]} has reached maximum warnings but cannot be removed (bot is not admin).`,
                        mentions: [senderJid]
                    });
                }
            } catch (error) {
                console.error('❌ Failed to kick user for max warnings:', error);
                await sock.sendMessage(remoteJid, {
                    text: `🚨 *MAX WARNINGS REACHED*\n\n@${senderJid.split('@')[0]} has reached maximum warnings but removal failed.`,
                    mentions: [senderJid]
                });
            }
        }

        return true; // Badword was detected and processed
    } catch (error) {
        console.error('❌ Error in badword detection:', error);
        return false;
    }
}



module.exports = {
    handleMessage
};