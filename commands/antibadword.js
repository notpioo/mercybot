const config = require('../config/config');
const { getUser, getGroup, Group } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Command ini hanya dapat digunakan dalam group.'
            });
            return;
        }

        // Get group info and check if user is admin/owner
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.find(p => 
            p.id === user.jid && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!user.isOwner && !isAdmin) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Cuman admin yang bisa pake command ini😝.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Please specify on or off.\n\nUsage:\n.antibadword on - Enable anti badword\n.antibadword off - Disable anti badword'
            });
            return;
        }

        const action = args[0].toLowerCase();
        
        if (action !== 'on' && action !== 'off') {
            await sock.sendMessage(remoteJid, {
                text: '❌ Opsi tidak valid. Gunakan "on" atau "off".\n\nPenggunaan:\n.antibadword on - Mengaktifkan antibadword\n.antibadword off - Menonaktifkan antibadword'
            });
            return;
        }

        // Get or create group data
        let group = await getGroup(remoteJid);
        if (!group) {
            group = new Group({
                jid: remoteJid,
                name: groupMetadata.subject || 'Unknown Group',
                desc: groupMetadata.desc || '',
                participants: groupMetadata.participants.length,
                settings: {
                    antiBadword: false,
                    badWords: []
                }
            });
        }

        // Update anti badword setting
        const isEnabled = action === 'on';
        group.settings.antiBadword = isEnabled;
        await group.save();

        const status = isEnabled ? 'enabled' : 'disabled';
        const emoji = isEnabled ? '✅' : '❌';
        
        await sock.sendMessage(remoteJid, {
            text: `${emoji} Anti badword telah ${status} untuk group ini.`
        });

    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while updating anti badword settings.'
        });
    }
}

module.exports = { execute };