const config = require('../config/config');
const { getUser } = require('../lib/database');
const { formatJid } = require('../utils/helpers');

function parseDuration(durationStr) {
    const match = durationStr.match(/^(\d+)([dhms])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const now = new Date();
    
    switch(unit) {
        case 's': // seconds
            return new Date(now.getTime() + (value * 1000));
        case 'm': // minutes
            return new Date(now.getTime() + (value * 60 * 1000));
        case 'h': // hours
            return new Date(now.getTime() + (value * 60 * 60 * 1000));
        case 'd': // days
            return new Date(now.getTime() + (value * 24 * 60 * 60 * 1000));
        default:
            return null;
    }
}

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;
    
    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Cuman owner yang bisa pake command ini😝..'
            });
            return;
        }

        // Get target user (from mention or phone number)
        let targetJid = null;
        let duration = null;

        // Check if there's a mention
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            // For mentions, get the duration from the text after removing mention
            const fullText = message.message.extendedTextMessage.text || '';
            const textParts = fullText.trim().split(/\s+/);
            // Find the duration part (should be after the command and mention)
            duration = textParts.find(part => /^(\d+)([dhms])$/.test(part));
        } else if (args.length >= 2) {
            // Format phone number
            const phoneNumber = args[0].replace(/\D/g, '');
            if (phoneNumber.length >= 10) {
                targetJid = formatJid(phoneNumber);
                duration = args[1];
            }
        }

        if (!targetJid) {
            await sock.sendMessage(remoteJid, {
                text: `❌ Gunakan: ${config.prefixes[0]}${commandName} @mention/number durasi(1d/5h/6s)`
            });
            return;
        }

        // Get target user
        const targetUser = await getUser(targetJid);
        const { User } = require('../lib/database');
        
        if (commandName === 'ban') {
            if (!duration) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Gunakan: ${config.prefixes[0]}${commandName} @mention/number durasi(1d/5h/6s)`
                });
                return;
            }
            
            const banUntil = parseDuration(duration);
            if (!banUntil) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Format durasi tidak valid. Gunakan: 1d (day), 5h (hour), 6s (second)'
                });
                return;
            }
            
            await User.updateOne(
                { jid: targetJid },
                { 
                    $set: { 
                        isBlocked: true,
                        banUntil: banUntil
                    }
                }
            );
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Berhasil banned pengguna hingga${banUntil.toLocaleString('id-ID')}`,
                mentions: [targetJid]
            });
            
        } else if (commandName === 'unban') {
            await User.updateOne(
                { jid: targetJid },
                { 
                    $set: { 
                        isBlocked: false,
                        banUntil: null
                    }
                }
            );
            
            await sock.sendMessage(remoteJid, {
                text: `✅ Berhasil unbanned pengguna`,
                mentions: [targetJid]
            });
        }

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