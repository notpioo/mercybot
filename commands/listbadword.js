const config = require('../config/config');
const { getGroup } = require('../lib/database');

async function execute(context) {
    const { sock, remoteJid, user, senderName, message, args, commandName } = context;

    try {
        // Anyone can use this command in groups

        // Check if it's a group chat
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, {
                text: '❌ Command ini hanya dapat digunakan dalam grup.'
            });
            return;
        }

        // Get group data
        const group = await getGroup(remoteJid);
        if (!group || !group.settings || !group.settings.badWords || group.settings.badWords.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '📝 Tidak ada kata kasar yang dikonfigurasi untuk grup ini.\n\nGunakan .addbadword untuk menambahkan kata ke filter.'
            });
            return;
        }

        // Create list of bad words
        let badWordsList = '🚫 **Daftar Kata Kasar**\n\n';
        badWordsList += `📊 Total: ${group.settings.badWords.length} kata\n\n`;
        
        group.settings.badWords.forEach((word, index) => {
            badWordsList += `${index + 1}. ${word}\n`;
        });

        badWordsList += '\n💡 Gunakan .addbadword untuk menambah kata';
        badWordsList += '\n🗑️ Hubungi owner untuk menghapus kata';

        await sock.sendMessage(remoteJid, {
            text: badWordsList
        });

    } catch (error) {
        console.error('Error in listbadword command:', error);
        await sock.sendMessage(remoteJid, {
            text: '❌ An error occurred while fetching bad words list.'
        });
    }
}

module.exports = { execute };