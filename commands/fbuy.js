const { FishingUser } = require('../database/fishing');
const { getUser, updateUser } = require('../utils/userUtils');
const fishingConfig = require('../config/fishingConfig');

async function fbuyCommand(sock, from, sender, args, message) {
    try {
        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: '❌ Gunakan: .fbuy <nama item>\n\n' +
                      'Contoh: .fbuy bamboo\n' +
                      'Lihat item di .fshop'
            });
        }

        const itemName = args.join(' ').toLowerCase();
        
        // Get user data
        const user = await getUser(sender);
        if (!user) {
            return await sock.sendMessage(from, {
                text: '❌ Gagal mengambil data user.'
            });
        }

        // Get or create fishing user
        let fishingUser = await FishingUser.findOne({ userId: sender });
        if (!fishingUser) {
            fishingUser = new FishingUser({ userId: sender });
            await fishingUser.save();
        }

        // Find item in shop (check both rods and baits)
        let item = null;
        let itemType = null;
        
        // Check rods
        for (const [rodId, rodConfig] of Object.entries(fishingConfig.rods)) {
            if (rodConfig.name.toLowerCase().includes(itemName) || 
                rodId.toLowerCase() === itemName) {
                if (rodConfig.price > 0) { // Only sellable items
                    item = rodConfig;
                    itemType = 'rod';
                    break;
                }
            }
        }
        
        // Check baits if not found in rods
        if (!item) {
            for (const [baitId, baitConfig] of Object.entries(fishingConfig.baits)) {
                if (baitConfig.name.toLowerCase().includes(itemName) || 
                    baitId.toLowerCase() === itemName) {
                    if (baitConfig.price > 0) { // Only sellable items
                        item = baitConfig;
                        itemType = 'bait';
                        break;
                    }
                }
            }
        }

        if (!item) {
            return await sock.sendMessage(from, {
                text: `❌ Item "${itemName}" tidak ditemukan di shop.\n\n` +
                      'Lihat item yang tersedia dengan .fshop'
            });
        }

        // Check if user has enough ReelCoin
        if (user.reelCoin < item.price) {
            return await sock.sendMessage(from, {
                text: `💰 ReelCoin tidak cukup!\n\n` +
                      `${item.emoji} *${item.name}*\n` +
                      `Harga: ${item.price} RC\n` +
                      `ReelCoin kamu: ${user.reelCoin || 0} RC\n` +
                      `Kurang: ${item.price - (user.reelCoin || 0)} RC`
            });
        }

        // Check if user already has the item (for rods)
        if (itemType === 'rod' && fishingUser.hasItem('rod', item.id, 1)) {
            return await sock.sendMessage(from, {
                text: `❌ Kamu sudah memiliki ${item.name}!\n\n` +
                      'Rod hanya bisa dibeli satu kali.'
            });
        }

        // Process purchase
        // Deduct ReelCoin
        user.reelCoin = (user.reelCoin || 0) - item.price;
        await user.save();

        // Add item to inventory
        if (itemType === 'rod') {
            fishingUser.addItem('rod', item.id, 1);
        } else if (itemType === 'bait') {
            const quantity = item.quantity || 10; // Use configured quantity
            fishingUser.addItem('bait', item.id, quantity);
        }

        await fishingUser.save();

        // Success message
        const quantity = itemType === 'bait' && item.quantity > 1 ? ` x${item.quantity}` : '';
        const rarity = fishingConfig.rarityColors[item.rarity];
        
        await sock.sendMessage(from, {
            text: `✅ *Pembelian Berhasil!*\n\n` +
                  `${item.emoji} *${item.name}*${quantity} ${rarity}\n` +
                  `💰 Harga: ${item.price} RC\n` +
                  `🪙 ReelCoin tersisa: ${user.reelCoin} RC\n\n` +
                  `${itemType === 'rod' ? 
                    `Gunakan .userod ${item.id} untuk equipped` : 
                    `Gunakan .usebait ${item.id} untuk equipped`}`
        });

        // Auto-equip if it's the first rod/bait (better than default)
        if (itemType === 'rod' && item.id !== 'wood') {
            const currentRod = fishingConfig.rods[fishingUser.currentRod];
            if (!currentRod || item.rarityBonus > currentRod.rarityBonus) {
                fishingUser.currentRod = item.id;
                await fishingUser.save();
                
                await sock.sendMessage(from, {
                    text: `🎯 *Auto-equipped!*\n${item.emoji} ${item.name} sekarang menjadi rod aktif kamu.`
                });
            }
        }

        if (itemType === 'bait' && item.id !== 'worm') {
            const currentBait = fishingConfig.baits[fishingUser.currentBait];
            if (!currentBait || item.rarityBonus > currentBait.rarityBonus) {
                fishingUser.currentBait = item.id;
                await fishingUser.save();
                
                await sock.sendMessage(from, {
                    text: `🎯 *Auto-equipped!*\n${item.emoji} ${item.name} sekarang menjadi bait aktif kamu.`
                });
            }
        }

    } catch (error) {
        console.error('Error in fbuy command:', error);
        await sock.sendMessage(from, {
            text: '❌ Terjadi kesalahan saat membeli item. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'fbuy',
    description: 'Membeli item dari fishing shop',
    usage: '.fbuy <nama item>',
    category: 'fishing',
    execute: fbuyCommand
};