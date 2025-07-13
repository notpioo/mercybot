const { User } = require('./database');

// Level tiers and their ranges
const LEVEL_TIERS = {
    warrior: { min: 1, max: 10, name: 'Warrior' },
    elite: { min: 11, max: 25, name: 'Elite' },
    master: { min: 26, max: 40, name: 'Master' },
    grandmaster: { min: 41, max: 55, name: 'Grandmaster' },
    epic: { min: 56, max: 75, name: 'Epic' },
    legend: { min: 76, max: 100, name: 'Legend' },
    mythic: { min: 101, max: 125, name: 'Mythic' },
    honor: { min: 126, max: 150, name: 'Honor' },
    immortal: { min: 151, max: 999, name: 'Immortal' }
};

// Experience required for each level (medium grinding)
function calculateExperienceForLevel(level) {
    if (level <= 1) return 0;
    
    // Base experience increases progressively
    const baseExp = 100;
    const multiplier = Math.pow(1.15, level - 1); // 15% increase per level
    const tierBonus = getTierBonus(level);
    
    return Math.floor(baseExp * multiplier + tierBonus);
}

// Additional experience bonus for higher tiers
function getTierBonus(level) {
    if (level >= 151) return 500; // Immortal
    if (level >= 126) return 400; // Honor
    if (level >= 101) return 300; // Mythic
    if (level >= 76) return 200; // Legend
    if (level >= 56) return 150; // Epic
    if (level >= 41) return 100; // Grandmaster
    if (level >= 26) return 75; // Master
    if (level >= 11) return 50; // Elite
    return 0; // Warrior
}

// Get tier name for a level
function getTierForLevel(level) {
    for (const [tierKey, tierData] of Object.entries(LEVEL_TIERS)) {
        if (level >= tierData.min && level <= tierData.max) {
            return tierKey;
        }
    }
    return 'immortal'; // Default for very high levels
}

// Get tier display name
function getTierDisplayName(tier) {
    return LEVEL_TIERS[tier]?.name || 'Unknown';
}

// Calculate total experience needed to reach a level
function getTotalExperienceForLevel(targetLevel) {
    let totalExp = 0;
    for (let level = 2; level <= targetLevel; level++) {
        totalExp += calculateExperienceForLevel(level);
    }
    return totalExp;
}

// Add experience to user
async function addExperience(userJid, expAmount, reason = 'Unknown') {
    try {
        const user = await User.findOne({ jid: userJid });
        if (!user) {
            console.error('User not found for EXP:', userJid);
            return false;
        }

        const oldLevel = user.level;
        const oldTier = user.levelTier;
        
        // Add experience
        user.experience += expAmount;
        
        // Check for level up
        let currentLevel = user.level;
        let currentExp = user.experience;
        
        while (currentExp >= calculateExperienceForLevel(currentLevel + 1)) {
            currentExp -= calculateExperienceForLevel(currentLevel + 1);
            currentLevel++;
        }
        
        // Update user data
        user.level = currentLevel;
        user.experience = currentExp;
        user.experienceToNext = calculateExperienceForLevel(currentLevel + 1) - currentExp;
        user.levelTier = getTierForLevel(currentLevel);
        
        await user.save();
        
        // Log experience gain
        console.log(`📈 EXP: ${user.name} (+${expAmount} EXP from ${reason}) - Level ${currentLevel} (${user.levelTier})`);
        
        // Check if user leveled up or changed tier
        const leveledUp = currentLevel > oldLevel;
        const tierChanged = user.levelTier !== oldTier;
        
        return {
            success: true,
            leveledUp,
            tierChanged,
            oldLevel,
            newLevel: currentLevel,
            oldTier,
            newTier: user.levelTier,
            expGained: expAmount,
            reason
        };
        
    } catch (error) {
        console.error('Error adding experience:', error);
        return false;
    }
}

// Get user level info
async function getUserLevelInfo(userJid) {
    try {
        const user = await User.findOne({ jid: userJid });
        if (!user) return null;
        
        const nextLevelExp = calculateExperienceForLevel(user.level + 1);
        const totalExpForCurrentLevel = getTotalExperienceForLevel(user.level);
        const totalExpForNextLevel = getTotalExperienceForLevel(user.level + 1);
        
        return {
            level: user.level,
            experience: user.experience,
            experienceToNext: nextLevelExp - user.experience,
            experienceForNextLevel: nextLevelExp,
            totalExperience: totalExpForCurrentLevel + user.experience,
            tier: user.levelTier,
            tierName: getTierDisplayName(user.levelTier),
            progressPercentage: Math.floor((user.experience / nextLevelExp) * 100)
        };
        
    } catch (error) {
        console.error('Error getting user level info:', error);
        return null;
    }
}

// Get tier progression info
function getTierProgression() {
    return Object.entries(LEVEL_TIERS).map(([key, data]) => ({
        key,
        name: data.name,
        minLevel: data.min,
        maxLevel: data.max,
        levels: data.max - data.min + 1
    }));
}

// Get leaderboard by level
async function getLevelLeaderboard(limit = 50) {
    try {
        const users = await User.find({})
            .sort({ level: -1, experience: -1 })
            .limit(limit)
            .select('name jid level experience levelTier');
        
        return users.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            jid: user.jid,
            level: user.level,
            experience: user.experience,
            tier: user.levelTier,
            tierName: getTierDisplayName(user.levelTier)
        }));
        
    } catch (error) {
        console.error('Error getting level leaderboard:', error);
        return [];
    }
}

module.exports = {
    LEVEL_TIERS,
    calculateExperienceForLevel,
    getTierForLevel,
    getTierDisplayName,
    getTotalExperienceForLevel,
    addExperience,
    getUserLevelInfo,
    getTierProgression,
    getLevelLeaderboard
};