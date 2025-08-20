const { FishingUser } = require('../database/fishing');
const fishingConfig = require('../config/fishingConfig');

async function usebaitCommand(sock, from, sender, args, message) {
    try {
        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: '❌ Gunakan: .usebait <nama bait>\n\n' +
                      'Contoh: .usebait cricket\n' +
                      'Lihat bait yang kamu miliki di .fbag'
            });
        }

        const baitName = args.join(' ').toLowerCase();

        // Get or create fishing user
        let fishingUser = await FishingUser.findOne({ userId: sender });
        if (!fishingUser) {
            fishingUser = new FishingUser({ userId: sender });
            await fishingUser.save();
        }

        // Find bait by name or ID
        let targetBait = null;
        for (const [baitId, baitConfig] of Object.entries(fishingConfig.baits)) {
            if (baitConfig.name.toLowerCase().includes(baitName) || 
                baitId.toLowerCase() === baitName) {
                targetBait = { id: baitId, config: baitConfig };
                break;
            }
        }

        if (!targetBait) {
            return await sock.sendMessage(from, {
                text: `❌ Bait "${baitName}" tidak ditemukan.\n\n` +
                      'Lihat bait yang tersedia di .fshop atau .fbag'
            });
        }

        // Check if user owns the bait
        if (!fishingUser.hasItem('bait', targetBait.id, 1)) {
            return await sock.sendMessage(from, {
                text: `❌ Kamu tidak memiliki ${targetBait.config.name}!\n\n` +
                      'Beli bait ini di .fshop terlebih dahulu.'
            });
        }

        // Check if already equipped
        if (fishingUser.currentBait === targetBait.id) {
            return await sock.sendMessage(from, {
                text: `✅ ${targetBait.config.emoji} ${targetBait.config.name} sudah menjadi bait aktif kamu!`
            });
        }

        // Equip the bait
        const previousBait = fishingConfig.baits[fishingUser.currentBait];
        fishingUser.currentBait = targetBait.id;
        await fishingUser.save();

        // Get current bait quantity
        const baitItem = fishingUser.inventory.baits.find(b => b.baitId === targetBait.id);
        const quantity = baitItem ? baitItem.quantity : 0;
        
        const rarity = fishingConfig.rarityColors[targetBait.config.rarity];
        
        await sock.sendMessage(from, {
            text: `🎯 *Bait Equipped!*\n\n` +
                  `${targetBait.config.emoji} *${targetBait.config.name}* ${rarity}\n` +
                  `📦 Quantity: ${quantity}\n` +
                  `⭐ Rare bonus: +${targetBait.config.rarityBonus}%\n\n` +
                  `Previous: ${previousBait?.emoji} ${previousBait?.name || 'Unknown'}\n` +
                  `Sekarang kamu siap memancing dengan bait yang lebih baik! 🎉`
        });

    } catch (error) {
        console.error('Error in usebait command:', error);
        await sock.sendMessage(from, {
            text: '❌ Terjadi kesalahan saat mengganti bait. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'usebait',
    description: 'Mengganti bait yang digunakan untuk memancing',
    usage: '.usebait <nama bait>',
    category: 'fishing',
    execute: usebaitCommand
};