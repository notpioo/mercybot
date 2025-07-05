const config = require('../config/config');
const { getUser } = require('../lib/database');
const { formatJid } = require('../utils/helpers');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName, isGroup } = context;
    
    try {
        // Check if user is owner or group admin
        let isGroupAdmin = false;
        if (isGroup && !user.isOwner) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                isGroupAdmin = groupMetadata.participants.find(p => 
                    p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
                );
            } catch (error) {
                console.error('Error checking group admin status:', error);
            }
        }

        if (!user.isOwner && !isGroupAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only bot owners and group admins can use this command.'
            });
            return;
        }

        // Only work in groups
        if (!isGroup) {
            await sock.sendMessage(remoteJid, {
                text: '❌ This command can only be used in groups.'
            });
            return;
        }

        let targetJid = null;
        
        if (commandName === 'warn') {
            // Check if it's a reply to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedParticipant = message.message.extendedTextMessage.contextInfo.participant;
                if (quotedParticipant) {
                    targetJid = quotedParticipant;
                }
            }
            // Check if there's a mention
            else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // Check if phone number provided
            else if (args.length >= 1) {
                const phoneNumber = args[0].replace(/\D/g, '');
                if (phoneNumber.length >= 10) {
                    targetJid = formatJid(phoneNumber);
                }
            }

            if (!targetJid) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Usage: Reply to a message with ${config.prefixes[0]}warn or use ${config.prefixes[0]}warn @mention`
                });
                return;
            }

            // Get target user
            const targetUser = await getUser(targetJid);
            const { User } = require('../lib/database');
            
            // Increment warnings
            const newWarnings = (targetUser.warnings || 0) + 1;
            await User.updateOne(
                { jid: targetJid },
                { $set: { warnings: newWarnings } }
            );

            // Check if warnings exceed max
            const maxWarnings = config.userSystem.maxWarnings || 3;
            if (newWarnings >= maxWarnings) {
                try {
                    // Try to remove user from group
                    await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'remove');
                    
                    // Reset warnings after kick
                    await User.updateOne(
                        { jid: targetJid },
                        { $set: { warnings: 0 } }
                    );
                    
                    await sock.sendMessage(remoteJid, {
                        text: `⚠️ User has been removed from the group due to reaching maximum warnings (${maxWarnings})`,
                        mentions: [targetJid]
                    });
                } catch (kickError) {
                    await sock.sendMessage(remoteJid, {
                        text: `⚠️ User reached maximum warnings (${maxWarnings}) but failed to remove from group. Please check bot permissions.`,
                        mentions: [targetJid]
                    });
                }
            } else {
                const remainingWarnings = maxWarnings - newWarnings;
                await sock.sendMessage(remoteJid, {
                    text: `⚠️ Warning issued!\nWarnings: ${newWarnings}/${maxWarnings}\n\n⚠️ ${remainingWarnings} more warnings until removal from group.`,
                    mentions: [targetJid]
                });
            }
            
        } else if (commandName === 'maxwarn') {
            const newMaxWarn = parseInt(args[0]);
            if (!newMaxWarn || newMaxWarn < 1) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Usage: ${config.prefixes[0]}maxwarn <number>\nCurrent max warnings: ${config.userSystem.maxWarnings || 3}`
                });
                return;
            }
            
            // Update config (note: this is runtime only, not persistent)
            config.userSystem.maxWarnings = newMaxWarn;
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Maximum warnings set to ${newMaxWarn}`
            });
        }

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