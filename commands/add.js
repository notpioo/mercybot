const config = require('../config/config');
const { getUser, getGroup } = require('../lib/database');
const { formatJid } = require('../utils/helpers');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ This command can only be used in groups.'
            });
            return;
        }

        // Get group info and check if user is admin/owner
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(p => 
            p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
        );
        
        // Get bot number and find in participants
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.jid?.split('@')[0] || sock.user?.number;
        console.log('Bot Number:', botNumber);
        console.log('Participants:', groupMetadata.participants.map(p => ({ id: p.id, admin: p.admin })));
        
        const isBotAdmin = groupMetadata.participants.find(p => {
            const participantNumber = p.id.split('@')[0];
            return participantNumber === botNumber && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        if (!user.isOwner && !isAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Only group admins can use this command.'
            });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Bot needs to be admin to add members.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please provide a phone number.\n\nUsage: .add 628123456789'
            });
            return;
        }

        // Format phone number
        let phoneNumber = args[0].replace(/[^0-9]/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('62')) {
            phoneNumber = '62' + phoneNumber;
        }

        const targetJid = phoneNumber + '@s.whatsapp.net';

        // Check if user is already in group
        const existingMember = groupMetadata.participants.find(p => p.id === targetJid);
        if (existingMember) {
            await sock.sendMessage(remoteJid, {
                text: `❌ +${phoneNumber} is already in the group.`
            });
            return;
        }

        console.log(`Attempting to add ${targetJid} to group ${remoteJid}`);

        // Try multiple methods to add the user
        try {
            // Method 1: Standard add
            let result = await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'add');
            console.log('Standard add result:', result);
            
            // If first method failed with 403, try invite method
            if (result && result[0] && result[0].status === '403') {
                console.log('Standard add failed, trying invite method...');
                
                // Method 2: Generate invite and send it
                try {
                    const inviteCode = await sock.groupInviteCode(remoteJid);
                    const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                    
                    // Send invite link with proper clickable format
                    await sock.sendMessage(targetJid, {
                        text: `🎉 *Group Invitation*\n\n` +
                              `You've been invited to join:\n` +
                              `📱 *${groupMetadata.subject}*\n` +
                              `👥 ${groupMetadata.participants.length} members\n\n` +
                              `Tap the link below to join:`,
                        linkPreview: false
                    });
                    
                    // Send the link as a separate message for better clickability
                    await sock.sendMessage(targetJid, {
                        text: inviteLink,
                        linkPreview: true
                    });
                    
                    await sock.sendMessage(remoteJid, {
                        text: `✅ Invite sent directly to +${phoneNumber}\n` +
                              `📨 They will receive a private message with the group invite link.`
                    });
                    return;
                    
                } catch (inviteError) {
                    console.log('Invite method also failed:', inviteError);
                    // Continue with original error handling
                }
            }
            
            // Handle the result - result is an array of objects
            if (result && result.length > 0) {
                const participantResult = result.find(r => r.jid === targetJid);
                
                if (participantResult) {
                    const status = participantResult.status;
                    
                    if (status === '200') {
                        await sock.sendMessage(remoteJid, {
                            text: `✅ Successfully added +${phoneNumber} to the group.`
                        });
                    } else if (status === '403') {
                        await sock.sendMessage(remoteJid, {
                            text: `❌ Cannot add +${phoneNumber}.\n\nPossible reasons:\n• User's privacy settings prevent being added\n• User has blocked the group/bot\n• User needs to be invited manually`
                        });
                    } else if (status === '409') {
                        await sock.sendMessage(remoteJid, {
                            text: `❌ +${phoneNumber} is already in the group.`
                        });
                    } else if (status === '404') {
                        await sock.sendMessage(remoteJid, {
                            text: `❌ Phone number +${phoneNumber} not found on WhatsApp.`
                        });
                    } else {
                        await sock.sendMessage(remoteJid, {
                            text: `❌ Failed to add +${phoneNumber}.\nStatus: ${status}\n\nTry inviting them manually or ask them to join using group link.`
                        });
                    }
                } else {
                    await sock.sendMessage(remoteJid, {
                        text: `⚠️ Add request processed for +${phoneNumber}, but status unclear. Check if they joined the group.`
                    });
                }
            } else {
                await sock.sendMessage(remoteJid, {
                    text: `⚠️ Add request sent for +${phoneNumber}. If they don't appear, they may need to accept manually.`
                });
            }
        } catch (error) {
            console.error('Error adding member:', error);
            let errorMessage = '❌ Failed to add member. ';
            
            if (error.output?.payload?.error === 403) {
                errorMessage += 'User privacy settings prevent adding them.';
            } else if (error.output?.payload?.error === 409) {
                errorMessage += 'User is already in the group.';
            } else if (error.message?.includes('not found')) {
                errorMessage += 'Phone number not found on WhatsApp.';
            } else {
                errorMessage += `Error: ${error.message || 'Unknown error'}`;
            }
            
            await sock.sendMessage(remoteJid, {
                text: errorMessage
            });
        }

    } catch (error) {
        console.error('Error in add command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while adding member.'
        });
    }
}

module.exports = { execute };