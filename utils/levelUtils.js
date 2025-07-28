const config = require('../config/config');

/**
 * Calculate XP required for a specific level
 * @param {number} level - Target level
 * @returns {number} XP required
 */
function getXpForLevel(level) {
    return config.levelSystem.xpPerLevel(level);
}

/**
 * Get rank information for a given level
 * @param {number} level - User level
 * @returns {object} Rank information
 */
function getRankByLevel(level) {
    const ranks = config.levelSystem.ranks;
    for (const rank of ranks) {
        if (level >= rank.minLevel && level <= rank.maxLevel) {
            return rank;
        }
    }
    return ranks[ranks.length - 1]; // Return highest rank if level exceeds all
}

/**
 * Get the next rank for a given level
 * @param {number} level - Current level
 * @returns {object|null} Next rank information or null if at max rank
 */
function getNextRank(level) {
    const currentRank = getRankByLevel(level);
    const ranks = config.levelSystem.ranks;
    const currentRankIndex = ranks.findIndex(rank => rank.name === currentRank.name);
    
    if (currentRankIndex < ranks.length - 1) {
        return ranks[currentRankIndex + 1];
    }
    return null; // Already at highest rank
}

/**
 * Calculate XP progress for current level
 * @param {number} currentXp - Current XP
 * @param {number} level - Current level
 * @returns {object} Progress information
 */
function getXpProgress(currentXp, level) {
    const requiredXp = getXpForLevel(level);
    const percentage = Math.floor((currentXp / requiredXp) * 100);
    
    return {
        current: currentXp,
        required: requiredXp,
        percentage: Math.min(percentage, 100),
        remaining: Math.max(requiredXp - currentXp, 0)
    };
}

/**
 * Get all available ranks
 * @returns {array} All ranks configuration
 */
function getAllRanks() {
    return config.levelSystem.ranks;
}

/**
 * Award XP to user for specific actions
 * @param {string} action - Action type (commandUse, dailyLogin, etc.)
 * @returns {number} XP amount
 */
function getXpReward(action) {
    return config.levelSystem.rewards[action] || 0;
}

module.exports = {
    getXpForLevel,
    getRankByLevel,
    getNextRank,
    getXpProgress,
    getAllRanks,
    getXpReward
};