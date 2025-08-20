const { FishingUser } = require('../database/fishing');
const { getUser, updateUser } = require('../utils/userUtils');
const fishingConfig = require('../config/fishingConfig');
const { calculateFishPrice } = require('../utils/fishingUtils');

async function sellfishCommand(sock, from, sender, args, message) {
    try {
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

        // Check if user has any fish
        if (!fishingUser.inventory.fish || fishingUser.inventory.fish.length === 0) {
            return await sock.sendMessage(from, {
                text: '🐟 Kamu tidak memiliki ikan untuk dijual!\n\n' +
                      'Pergi memancing dulu dengan .fish'
            });
        }

        // Calculate total earnings
        let totalEarnings = 0;
        let soldFishDetails = [];
        let totalFishSold = 0;

        fishingUser.inventory.fish.forEach(fishData => {
            const fishConfig = fishingConfig.fish[fishData.fishId];
            if (fishConfig && fishData.quantity > 0) {
                // Calculate average weight for this fish type
                const avgWeight = fishData.totalWeight / fishData.quantity;
                
                // Calculate total price for all fish of this type
                const pricePerFish = calculateFishPrice(fishConfig, avgWeight);
                const totalPrice = pricePerFish * fishData.quantity;
                
                totalEarnings += totalPrice;
                totalFishSold += fishData.quantity;
                
                soldFishDetails.push({
                    fish: fishConfig,
                    quantity: fishData.quantity,
                    avgWeight: avgWeight,
                    totalPrice: totalPrice,
                    pricePerFish: pricePerFish
                });
            }
        });

        if (totalEarnings === 0) {
            return await sock.sendMessage(from, {
                text: '🐟 Tidak ada ikan yang bisa dijual!'
            });
        }

        // Confirmation message
        if (!args[0] || args[0].toLowerCase() !== 'confirm') {
            let confirmMessage = `💰 *Konfirmasi Penjualan Ikan*\n\n`;
            confirmMessage += `🐟 Total ikan: ${totalFishSold}\n`;
            confirmMessage += `💰 Total earnings: ${totalEarnings} RC\n\n`;
            
            confirmMessage += `📋 *Detail:*\n`;
            soldFishDetails
                .sort((a, b) => b.totalPrice - a.totalPrice) // Sort by total price desc
                .slice(0, 10) // Show top 10
                .forEach(detail => {
                    const rarity = fishingConfig.rarityColors[detail.fish.rarity];
                    confirmMessage += `${detail.fish.emoji} ${detail.fish.name} ${rarity}\n`;
                    confirmMessage += `   ${detail.quantity} x ${detail.pricePerFish} = ${detail.totalPrice} RC\n`;
                });
            
            if (soldFishDetails.length > 10) {
                confirmMessage += `... dan ${soldFishDetails.length - 10} jenis ikan lainnya\n`;
            }
            
            confirmMessage += `\n⚠️ *Semua ikan akan terjual!*\n`;
            confirmMessage += `Ketik .sellfish confirm untuk melanjutkan`;
            
            return await sock.sendMessage(from, {
                text: confirmMessage
            });
        }

        // Process the sale  
        // Add earnings to user ReelCoin
        user.reelCoin = (user.reelCoin || 0) + totalEarnings;
        await user.save();

        // Clear fish inventory
        fishingUser.inventory.fish = [];
        await fishingUser.save();

        // Success message
        let resultMessage = `✅ *Penjualan Berhasil!*\n\n`;
        resultMessage += `🐟 Ikan terjual: ${totalFishSold}\n`;
        resultMessage += `💰 Earnings: ${totalEarnings} RC\n`;
        resultMessage += `🪙 ReelCoin sekarang: ${user.reelCoin} RC\n\n`;
        
        resultMessage += `🏆 *Top Sales:*\n`;
        soldFishDetails
            .sort((a, b) => b.totalPrice - a.totalPrice)
            .slice(0, 5)
            .forEach((detail, index) => {
                const rarity = fishingConfig.rarityColors[detail.fish.rarity];
                resultMessage += `${index + 1}. ${detail.fish.emoji} ${detail.fish.name} ${rarity}\n`;
                resultMessage += `   ${detail.quantity} ikan = ${detail.totalPrice} RC\n`;
            });

        await sock.sendMessage(from, {
            text: resultMessage
        });

        // Bonus message for big sales
        if (totalEarnings >= 10000) {
            await sock.sendMessage(from, {
                text: `🎉 *BIG SALE BONUS!*\n\n` +
                      `Kamu mendapat bonus 10% karena penjualan besar!\n` +
                      `Bonus: ${Math.floor(totalEarnings * 0.1)} RC`
            });
            
            // Add bonus
            const bonus = Math.floor(totalEarnings * 0.1);
            user.reelCoin = (user.reelCoin || 0) + bonus;
            await user.save();
        }

    } catch (error) {
        console.error('Error in sellfish command:', error);
        await sock.sendMessage(from, {
            text: '❌ Terjadi kesalahan saat menjual ikan. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'sellfish',
    description: 'Menjual semua ikan yang ada di inventory',
    usage: '.sellfish [confirm]',
    category: 'fishing',
    execute: sellfishCommand
};