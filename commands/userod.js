const { FishingUser } = require('../database/fishing');
const fishingConfig = require('../config/fishingConfig');

async function userodCommand(sock, from, sender, args, message) {
    try {
        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: '❌ Gunakan: .userod <nama rod>\n\n' +
                      'Contoh: .userod bamboo\n' +
                      'Lihat rod yang kamu miliki di .fbag'
            });
        }

        const rodName = args.join(' ').toLowerCase();

        // Get or create fishing user
        let fishingUser = await FishingUser.findOne({ userId: sender });
        if (!fishingUser) {
            fishingUser = new FishingUser({ userId: sender });
            await fishingUser.save();
        }

        // Find rod by name or ID
        let targetRod = null;
        for (const [rodId, rodConfig] of Object.entries(fishingConfig.rods)) {
            if (rodConfig.name.toLowerCase().includes(rodName) || 
                rodId.toLowerCase() === rodName) {
                targetRod = { id: rodId, config: rodConfig };
                break;
            }
        }

        if (!targetRod) {
            return await sock.sendMessage(from, {
                text: `❌ Rod "${rodName}" tidak ditemukan.\n\n` +
                      'Lihat rod yang tersedia di .fshop atau .fbag'
            });
        }

        // Check if user owns the rod
        if (!fishingUser.hasItem('rod', targetRod.id, 1)) {
            return await sock.sendMessage(from, {
                text: `❌ Kamu tidak memiliki ${targetRod.config.name}!\n\n` +
                      'Beli rod ini di .fshop terlebih dahulu.'
            });
        }

        // Check if already equipped
        if (fishingUser.currentRod === targetRod.id) {
            return await sock.sendMessage(from, {
                text: `✅ ${targetRod.config.emoji} ${targetRod.config.name} sudah menjadi rod aktif kamu!`
            });
        }

        // Equip the rod
        const previousRod = fishingConfig.rods[fishingUser.currentRod];
        fishingUser.currentRod = targetRod.id;
        await fishingUser.save();

        const rarity = fishingConfig.rarityColors[targetRod.config.rarity];
        
        await sock.sendMessage(from, {
            text: `🎯 *Rod Equipped!*\n\n` +
                  `${targetRod.config.emoji} *${targetRod.config.name}* ${rarity}\n` +
                  `🎣 Ikan per cast: ${targetRod.config.fishCount}\n` +
                  `⭐ Rare bonus: +${targetRod.config.rarityBonus}%\n\n` +
                  `Previous: ${previousRod?.emoji} ${previousRod?.name || 'Unknown'}\n` +
                  `Sekarang kamu siap memancing dengan rod yang lebih baik! 🎉`
        });

    } catch (error) {
        console.error('Error in userod command:', error);
        await sock.sendMessage(from, {
            text: '❌ Terjadi kesalahan saat mengganti rod. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'userod',
    description: 'Mengganti rod yang digunakan untuk memancing',
    usage: '.userod <nama rod>',
    category: 'fishing',
    execute: userodCommand
};