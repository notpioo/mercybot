
const { getUser, getGroup, Group } = require('../lib/database');
const config = require('../config/config');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Command ini hanya dapat digunakan dalam grup.'
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
                text: '❌ Hanya owner bot dan admin grup yang bisa menggunakan command ini.'
            });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Silakan tentukan on atau off.\n\nPenggunaan:\n.antivc on - Mengaktifkan anti view once\n.antivc off - Menonaktifkan anti view once'
            });
            return;
        }

        const action = args[0].toLowerCase();
        
        if (action !== 'on' && action !== 'off') {
            await sock.sendMessage(remoteJid, {
                text: '❌ Opsi tidak valid. Gunakan "on" atau "off".\n\nPenggunaan:\n.antivc on - Mengaktifkan anti view once\n.antivc off - Menonaktifkan anti view once'
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
                    badWords: [],
                    antiViewOnce: false
                }
            });
        }

        // Ensure antiViewOnce exists in settings
        if (!group.settings.antiViewOnce) {
            group.settings.antiViewOnce = false;
        }

        // Update anti view once setting
        const isEnabled = action === 'on';
        group.settings.antiViewOnce = isEnabled;
        await group.save();

        const status = isEnabled ? 'diaktifkan' : 'dinonaktifkan';
        const emoji = isEnabled ? '✅' : '❌';
        
        await sock.sendMessage(remoteJid, {
            text: `${emoji} Anti view once telah ${status} untuk grup ini.\n\n${isEnabled ? '📸 Bot akan mengirim ulang gambar/video view once yang dikirim member.' : '🔒 Bot tidak akan lagi mengirim ulang view once.'}`
        });

        console.log(`🔄 Anti view once ${status} in group ${groupMetadata.subject} by ${senderName}`);

    } catch (error) {
        console.error('Error in antivc command:', error);
        await sock.sendMessage(remoteJid, {
            text: config.messages.error
        });
    }
}

module.exports = {
    execute
};
