
const config = require('../config/config');
const { formatJid } = require('../utils/helpers');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName, isGroup } = context;

    try {
        // Check if user is owner
        if (!user.isOwner) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only owners can use this command.'
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

        if (commandName === 'add') {
            if (args.length < 1) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Usage: ${config.prefixes[0]}add nomor\n\nContoh: ${config.prefixes[0]}add 6285709557572`
                });
                return;
            }

            const phoneNumber = args[0].replace(/\D/g, '');
            if (phoneNumber.length < 10) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Invalid phone number format.'
                });
                return;
            }

            const targetJid = formatJid(phoneNumber);

            try {
                await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'add');
                
                await sock.sendMessage(remoteJid, {
                    text: `✅ Successfully added user to group.`,
                    mentions: [targetJid]
                });

                console.log(`➕ User ${phoneNumber} added to group by ${senderName}`);

            } catch (addError) {
                console.error('Failed to add user to group:', addError);
                
                let errorMessage = '❌ Failed to add user to group.';
                
                if (addError.output?.statusCode === 403) {
                    errorMessage = '❌ User privacy settings prevent being added to groups.';
                } else if (addError.output?.statusCode === 409) {
                    errorMessage = '❌ User is already in the group.';
                }
                
                await sock.sendMessage(remoteJid, {
                    text: errorMessage
                });
            }

        } else if (commandName === 'kick') {
            let targetJid = null;

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

            if (!targetJid) {
                await sock.sendMessage(remoteJid, {
                    text: `❌ Usage: ${config.prefixes[0]}kick @mention atau reply pesan\n\nContoh: ${config.prefixes[0]}kick @user\nAtau reply pesan user dengan ${config.prefixes[0]}kick`
                });
                return;
            }

            // Check if trying to kick owner
            const targetNumber = targetJid.split('@')[0];
            const isTargetOwner = config.owners.some(owner => targetJid === owner.replace('+', '') + '@s.whatsapp.net');
            
            if (isTargetOwner) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Cannot kick bot owner.'
                });
                return;
            }

            // Check if trying to kick bot itself
            const botNumber = sock.user?.id?.split(':')[0];
            if (targetNumber === botNumber) {
                await sock.sendMessage(remoteJid, {
                    text: '❌ Cannot kick myself from group.'
                });
                return;
            }

            try {
                await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'remove');
                
                await sock.sendMessage(remoteJid, {
                    text: `✅ Successfully removed user from group.`
                });

                console.log(`➖ User ${targetNumber} kicked from group by ${senderName}`);

            } catch (kickError) {
                console.error('Failed to kick user from group:', kickError);
                
                let errorMessage = '❌ Failed to remove user from group.';
                
                if (kickError.output?.statusCode === 403) {
                    errorMessage = '❌ Bot does not have admin permissions.';
                } else if (kickError.output?.statusCode === 404) {
                    errorMessage = '❌ User is not in the group.';
                }
                
                await sock.sendMessage(remoteJid, {
                    text: errorMessage
                });
            }
        }

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
