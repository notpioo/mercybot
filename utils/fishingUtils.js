const fishingConfig = require('../config/fishingConfig');

// Calculate fish rarity based on rod, bait, and random chance
function calculateFishRarity(rodId, baitId) {
    const rod = fishingConfig.rods[rodId] || fishingConfig.rods.wood;
    const bait = fishingConfig.baits[baitId] || fishingConfig.baits.worm;

    // Base chances
    const baseChances = { ...fishingConfig.rarityChances };

    // Apply rod and bait bonuses
    const totalBonus = rod.rarityBonus + bait.rarityBonus;

    // Redistribute chances based on bonus
    if (totalBonus > 0) {
        // Reduce common chance, increase others
        const commonReduction = Math.min(totalBonus, 40); // Max 40% reduction
        baseChances.common -= commonReduction;

        // Distribute the reduction to higher rarities
        baseChances.uncommon += commonReduction * 0.4;
        baseChances.rare += commonReduction * 0.3;
        baseChances.epic += commonReduction * 0.2;
        baseChances.legendary += commonReduction * 0.1;
    }

    // Generate random number and determine rarity
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const [rarity, chance] of Object.entries(baseChances)) {
        cumulative += chance;
        if (rand <= cumulative) {
            return rarity;
        }
    }

    return 'common'; // Fallback
}

// Get random fish of specific rarity
function getRandomFishByRarity(rarity) {
    const fishOfRarity = Object.values(fishingConfig.fish)
        .filter(fish => fish.rarity === rarity);

    if (fishOfRarity.length === 0) {
        return fishingConfig.fish.sardine; // Fallback
    }

    const randomIndex = Math.floor(Math.random() * fishOfRarity.length);
    return fishOfRarity[randomIndex];
}

// Generate random weight for fish
function generateFishWeight(fish) {
    const { min, max } = fish.weight;
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Calculate fish price based on weight and rarity
function calculateFishPrice(fish, weight) {
    const basePrice = fish.basePrice;
    const weightMultiplier = 1 + (weight * 0.1); // +10% per kg

    let rarityMultiplier = 1;
    switch (fish.rarity) {
        case 'uncommon': rarityMultiplier = 1.5; break;
        case 'rare': rarityMultiplier = 2.5; break;
        case 'epic': rarityMultiplier = 5; break;
        case 'legendary': rarityMultiplier = 10; break;
    }

    return Math.round(basePrice * weightMultiplier * rarityMultiplier);
}

// Format fishing display messages
function formatFishCatch(fish, weight, price) {
    const rarity = fishingConfig.rarityColors[fish.rarity] || '⚪';

    return `🎣 *Ikan Tertangkap!*\n\n` +
           `${fish.emoji} *${fish.name}*\n` +
           `${rarity} Rarity: ${fish.rarity.toUpperCase()}\n` +
           `⚖️ Berat: ${weight} kg\n` +
           `💰 Harga: ${price} koin`;
}

// Format inventory display
function formatInventory(fishingUser) {
    let message = `🎒 *Inventory Fishing*\n\n`;

    // Current equipment
    const currentRod = fishingConfig.rods[fishingUser.currentRod];
    const currentBait = fishingConfig.baits[fishingUser.currentBait];

    message += `🎯 *Equipment Saat Ini:*\n`;
    message += `${currentRod.emoji} Rod: ${currentRod.name}\n`;
    message += `${currentBait.emoji} Bait: ${currentBait.name}\n\n`;

    // Rods
    message += `🎣 *Rods (${fishingUser.inventory.rods.length}):*\n`;
    fishingUser.inventory.rods.forEach(rod => {
        const rodConfig = fishingConfig.rods[rod.rodId];
        if (rodConfig) {
            const equipped = rod.rodId === fishingUser.currentRod ? ' ✅' : '';
            message += `${rodConfig.emoji} ${rodConfig.name} x${rod.quantity}${equipped}\n`;
        }
    });

    message += `\n🪱 *Baits (${fishingUser.inventory.baits.length}):*\n`;
    fishingUser.inventory.baits.forEach(bait => {
        const baitConfig = fishingConfig.baits[bait.baitId];
        if (baitConfig) {
            const equipped = bait.baitId === fishingUser.currentBait ? ' ✅' : '';
            message += `${baitConfig.emoji} ${baitConfig.name} x${bait.quantity}${equipped}\n`;
        }
    });

    // Fish
    if (fishingUser.inventory.fish.length > 0) {
        message += `\n🐟 *Ikan Tertangkap (${fishingUser.inventory.fish.length} jenis):*\n`;
        fishingUser.inventory.fish
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10) // Show top 10
            .forEach(fish => {
                const fishConfig = fishingConfig.fish[fish.fishId];
                if (fishConfig) {
                    const rarity = fishingConfig.rarityColors[fishConfig.rarity];
                    message += `${fishConfig.emoji} ${fishConfig.name} x${fish.quantity} ${rarity}\n`;
                    message += `   📏 Terberat: ${fish.bestWeight}kg\n`;
                }
            });
    }

    return message;
}

// Format shop display
function formatShop() {
    let message = `🛒 *Fish Shop*\n\n`;

    // Rods section
    message += `🎣 *RODS:*\n`;
    Object.values(fishingConfig.rods).forEach(rod => {
        if (rod.price > 0) { // Don't show free items
            const rarity = fishingConfig.rarityColors[rod.rarity];
            message += `${rod.emoji} *${rod.name}* ${rarity}\n`;
            message += `   💰 ${rod.price} RC\n`;
            message += `   🎯 ${rod.fishCount} ikan per casting\n`;
            message += `   ⭐ +${rod.rarityBonus}% rare bonus\n\n`;
        }
    });

    // Baits section
    message += `🪱 *BAITS:*\n`;
    Object.values(fishingConfig.baits).forEach(bait => {
        if (bait.price > 0) { // Don't show free items
            const rarity = fishingConfig.rarityColors[bait.rarity];
            const quantity = bait.quantity > 1 ? ` (x${bait.quantity})` : '';
            message += `${bait.emoji} *${bait.name}${quantity}* ${rarity}\n`;
            message += `   💰 ${bait.price} RC\n`;
            message += `   ⭐ +${bait.rarityBonus}% rare bonus\n\n`;
        }
    });

    message += `_Ketik .fbuy <nama item> untuk membeli_\n`;
    message += `🪙 Currency: ReelCoin (RC)`;

    return message;
}

// Format fishing stats
function formatFishingStats(fishingUser, username = null) {
    const displayName = username || `User${fishingUser.userId.split('@')[0].slice(-4)}`;
    const config = fishingConfig;
    const nextLevelExp = config.levelRequirements[fishingUser.level] || 'MAX';
    const currentExp = fishingUser.totalExp - (config.levelRequirements[fishingUser.level - 1] || 0);
    const neededExp = nextLevelExp === 'MAX' ? 'MAX' : nextLevelExp - fishingUser.totalExp;

    let message = `📊 *Dashboard Fishing*\n\n`;
    message += `👤 *${displayName}*\n`;
    message += `Level: ${fishingUser.level}\n`;
    message += `✨ EXP: ${fishingUser.totalExp}\n`;
    message += `📈 Next Level: ${neededExp === 'MAX' ? 'MAX LEVEL' : neededExp + ' EXP'}\n\n`;

    message += `🎣 Total Ikan: ${fishingUser.totalFish}\n`;
    message += `💰 Total Earnings: ${fishingUser.totalEarnings} koin\n`;
    message += `📦 Jenis Ikan: ${fishingUser.inventory.fish.length}\n\n`;

    // Equipment stats
    const rod = config.rods[fishingUser.currentRod];
    const bait = config.baits[fishingUser.currentBait];

    message += `🎯 *Equipment:*\n`;
    message += `${rod.emoji} ${rod.name} (+${rod.rarityBonus}%)\n`;
    message += `${bait.emoji} ${bait.name} (+${bait.rarityBonus}%)\n\n`;

    // Rare fish count
    const rareFishCount = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0
    };

    fishingUser.inventory.fish.forEach(fish => {
        const fishConfig = config.fish[fish.fishId];
        if (fishConfig) {
            rareFishCount[fishConfig.rarity] += fish.quantity;
        }
    });

    message += `🏆 *Koleksi by Rarity:*\n`;
    Object.entries(rareFishCount).forEach(([rarity, count]) => {
        if (count > 0) {
            const color = config.rarityColors[rarity];
            message += `${color} ${rarity}: ${count}\n`;
        }
    });

    return message;
}

// Check if user can fish (cooldown)
function canFish(fishingUser) {
    if (!fishingUser.lastFishTime) return true;

    const now = new Date();
    const timeDiff = (now - fishingUser.lastFishTime) / 1000; // seconds
    const cooldown = fishingConfig.fishingCooldown;

    return timeDiff >= cooldown;
}

// Get remaining cooldown time
function getRemainingCooldown(fishingUser) {
    if (!fishingUser.lastFishTime) return 0;

    const now = new Date();
    const timeDiff = (now - fishingUser.lastFishTime) / 1000; // seconds
    const cooldown = fishingConfig.fishingCooldown;

    return Math.max(0, cooldown - timeDiff);
}

// Format time (seconds to minutes:seconds)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    calculateFishRarity,
    getRandomFishByRarity,
    generateFishWeight,
    calculateFishPrice,
    formatFishCatch,
    formatInventory,
    formatShop,
    formatFishingStats,
    canFish,
    getRemainingCooldown,
    formatTime
};