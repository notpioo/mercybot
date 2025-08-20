const { FishingUser } = require('../database/fishing');
const { getUser } = require('../utils/userUtils');
const fishingConfig = require('../config/fishingConfig');
const {
    calculateFishRarity,
    getRandomFishByRarity,
    generateFishWeight,
    calculateFishPrice,
    formatFishCatch,
    canFish,
    getRemainingCooldown,
    formatTime
} = require('../utils/fishingUtils');

async function fishCommand(sock, from, sender, args, message) {
    try {
        // Get or create user
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

        // Check cooldown
        if (!canFish(fishingUser)) {
            const remaining = getRemainingCooldown(fishingUser);
            return await sock.sendMessage(from, {
                text: `⏰ Kamu masih kelelahan!\n` +
                      `Tunggu ${formatTime(remaining)} lagi untuk memancing.`
            });
        }

        // Check if user has bait
        const currentBait = fishingUser.currentBait;
        if (!fishingUser.hasItem('bait', currentBait, 1)) {
            return await sock.sendMessage(from, {
                text: `🪱 Kamu tidak memiliki bait ${fishingConfig.baits[currentBait]?.name || currentBait}!\n` +
                      `Beli bait di .fshop atau gunakan bait lain dengan .usebait`
            });
        }

        // Consume bait
        fishingUser.removeItem('bait', currentBait, 1);

        // Get current rod configuration
        const currentRod = fishingUser.currentRod;
        const rodConfig = fishingConfig.rods[currentRod] || fishingConfig.rods.wood;

        // Fishing animation
        await sock.sendMessage(from, {
            text: `🎣 *Memancing...*\n\n` +
                  `${rodConfig.emoji} Menggunakan: ${rodConfig.name}\n` +
                  `${fishingConfig.baits[currentBait].emoji} Bait: ${fishingConfig.baits[currentBait].name}\n\n` +
                  `🌊 Menunggu ikan menggigit...`
        });

        // Simulate fishing delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Determine number of fish caught (based on rod)
        const fishCount = rodConfig.fishCount;
        const caughtFish = [];

        for (let i = 0; i < fishCount; i++) {
            // Calculate fish rarity
            const rarity = calculateFishRarity(currentRod, currentBait);
            
            // Get random fish of that rarity
            const fish = getRandomFishByRarity(rarity);
            
            // Generate weight and price
            const weight = generateFishWeight(fish);
            const price = calculateFishPrice(fish, weight);
            
            // Add to user's inventory
            fishingUser.addFish(fish.id, weight);
            
            // Add experience
            const exp = fishingConfig.experience[rarity];
            const leveledUp = fishingUser.addExp(exp);
            
            caughtFish.push({
                fish,
                weight,
                price,
                exp,
                leveledUp
            });
        }

        // Update fishing stats
        fishingUser.lastFishTime = new Date();
        
        // Calculate total earnings
        const totalEarnings = caughtFish.reduce((sum, catch_) => sum + catch_.price, 0);
        fishingUser.totalEarnings += totalEarnings;
        
        // Save user data
        await fishingUser.save();

        // Create result message
        let resultMessage = `🎣 *Hasil Memancing!*\n\n`;
        
        caughtFish.forEach((catch_, index) => {
            const { fish, weight, price, exp, leveledUp } = catch_;
            const rarity = fishingConfig.rarityColors[fish.rarity];
            
            resultMessage += `${index + 1}. ${fish.emoji} *${fish.name}* ${rarity}\n`;
            resultMessage += `   ⚖️ ${weight}kg | 💰 ${price} koin | ✨ +${exp} EXP\n`;
            
            if (leveledUp) {
                resultMessage += `   🎉 *LEVEL UP!* Level ${fishingUser.level}\n`;
            }
            resultMessage += `\n`;
        });

        resultMessage += `💰 *Total Earnings: ${totalEarnings} koin*\n`;
        resultMessage += `📊 Level: ${fishingUser.level} | EXP: ${fishingUser.totalExp}\n`;
        resultMessage += `🎣 Total Ikan: ${fishingUser.totalFish}`;

        // Check for achievements
        const achievements = [];
        if (!fishingUser.achievements.firstFish && fishingUser.totalFish >= 1) {
            fishingUser.achievements.firstFish = true;
            achievements.push('🏆 First Fish!');
        }
        if (!fishingUser.achievements.hundredFish && fishingUser.totalFish >= 100) {
            fishingUser.achievements.hundredFish = true;
            achievements.push('🏆 Century Angler!');
        }
        
        // Check for legendary fish achievement
        const hasLegendaryFish = caughtFish.some(catch_ => catch_.fish.rarity === 'legendary');
        if (!fishingUser.achievements.legendaryFish && hasLegendaryFish) {
            fishingUser.achievements.legendaryFish = true;
            achievements.push('🏆 Legendary Fisher!');
        }

        if (achievements.length > 0) {
            resultMessage += `\n\n🎖️ *Achievement Unlocked:*\n${achievements.join('\n')}`;
            await fishingUser.save();
        }

        await sock.sendMessage(from, {
            text: resultMessage
        });

        // Special messages for rare catches
        const legendaryFish = caughtFish.filter(catch_ => catch_.fish.rarity === 'legendary');
        const epicFish = caughtFish.filter(catch_ => catch_.fish.rarity === 'epic');

        if (legendaryFish.length > 0) {
            await sock.sendMessage(from, {
                text: `🌟 *LEGENDARY CATCH!* 🌟\n\n` +
                      `Kamu menangkap ikan legendary! Ini sangat langka!\n` +
                      `Screenshot dan share ke teman-temanmu! 📸`
            });
        } else if (epicFish.length > 0) {
            await sock.sendMessage(from, {
                text: `⭐ *EPIC CATCH!* ⭐\n\n` +
                      `Ikan epic sangat sulit didapat! Great job! 🎉`
            });
        }

    } catch (error) {
        console.error('Error in fish command:', error);
        await sock.sendMessage(from, {
            text: '❌ Terjadi kesalahan saat memancing. Coba lagi nanti.'
        });
    }
}

module.exports = {
    name: 'fish',
    description: 'Memancing untuk mendapatkan ikan',
    usage: '.fish',
    category: 'fishing',
    cooldown: 5,
    execute: fishCommand
};