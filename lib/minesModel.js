const mongoose = require('mongoose');

// Schema untuk game Mines individual
const minesGameSchema = new mongoose.Schema({
    userJid: { type: String, required: true },
    userName: { type: String, required: true },
    gridSize: { type: Number, required: true }, // 25, 36, 49, atau 64
    mineCount: { type: Number, required: true },
    betAmount: { type: Number, required: true },
    finalMultiplier: { type: Number, default: 0 },
    winAmount: { type: Number, default: 0 },
    cellsRevealed: { type: Number, default: 0 },
    gameStatus: { 
        type: String, 
        enum: ['playing', 'won', 'lost', 'cashed_out'], 
        default: 'playing' 
    },
    gameBoard: { type: Object }, // Posisi mine dan cell yang terbuka
    duration: { type: Number, default: 0 }, // Durasi game dalam detik
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});

// Schema untuk statistik Mines per user
const minesStatsSchema = new mongoose.Schema({
    userJid: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    totalGames: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesCashedOut: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWinnings: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    biggestLoss: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },
    longestLossStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    streakType: { type: String, enum: ['win', 'loss', 'none'], default: 'none' },
    averageMultiplier: { type: Number, default: 0 },
    bestMultiplier: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 }, // dalam detik
    favoriteGridSize: { type: Number, default: 25 },
    totalCellsRevealed: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

// Schema untuk leaderboard Mines
const minesLeaderboardSchema = new mongoose.Schema({
    userJid: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    rank: { type: Number, required: true },
    totalWinnings: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    bestMultiplier: { type: Number, default: 0 },
    totalGames: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

const MinesGame = mongoose.model('MinesGame', minesGameSchema);
const MinesStats = mongoose.model('MinesStats', minesStatsSchema);
const MinesLeaderboard = mongoose.model('MinesLeaderboard', minesLeaderboardSchema);

// Fungsi untuk menyimpan game baru
async function createMinesGame(gameData) {
    try {
        const game = new MinesGame(gameData);
        return await game.save();
    } catch (error) {
        console.error('Error creating mines game:', error);
        throw error;
    }
}

// Fungsi untuk update game yang sudah selesai
async function completeMinesGame(gameId, updates) {
    try {
        const game = await MinesGame.findByIdAndUpdate(
            gameId, 
            { ...updates, completedAt: new Date() }, 
            { new: true }
        );
        
        if (game) {
            // Update statistik user setelah game selesai
            await updateMinesStatsAfterGame(game);
        }
        
        return game;
    } catch (error) {
        console.error('Error completing mines game:', error);
        throw error;
    }
}

// Fungsi untuk mendapatkan game recent user
async function getUserRecentGames(userJid, limit = 10) {
    try {
        return await MinesGame.find({ userJid })
            .sort({ createdAt: -1 })
            .limit(limit);
    } catch (error) {
        console.error('Error getting user recent games:', error);
        return [];
    }
}

// Fungsi untuk mendapatkan statistik user
async function getMinesStats(userJid) {
    try {
        let stats = await MinesStats.findOne({ userJid });
        
        if (!stats) {
            // Buat stats baru jika belum ada
            stats = new MinesStats({ userJid, userName: 'Unknown' });
            await stats.save();
        }
        
        return stats;
    } catch (error) {
        console.error('Error getting mines stats:', error);
        return null;
    }
}

// Fungsi untuk update statistik setelah game selesai
async function updateMinesStatsAfterGame(game) {
    try {
        let stats = await getMinesStats(game.userJid);
        
        if (!stats) {
            stats = new MinesStats({ 
                userJid: game.userJid, 
                userName: game.userName 
            });
        }

        const isWin = game.gameStatus === 'won' || game.gameStatus === 'cashed_out';
        const isLoss = game.gameStatus === 'lost';
        
        // Update basic stats
        stats.userName = game.userName;
        stats.totalGames += 1;
        stats.totalWagered += game.betAmount;
        stats.totalWinnings += (game.winAmount || 0);
        stats.netProfit += (game.winAmount || 0) - game.betAmount;
        stats.totalPlayTime += (game.duration || 0);
        stats.totalCellsRevealed += (game.cellsRevealed || 0);

        if (isWin) {
            stats.gamesWon += 1;
            if (game.gameStatus === 'cashed_out') {
                stats.gamesCashedOut += 1;
            }
        } else if (isLoss) {
            stats.gamesLost += 1;
        }

        // Update win/loss streaks
        if (isWin) {
            if (stats.streakType === 'win') {
                stats.currentStreak += 1;
            } else {
                stats.currentStreak = 1;
                stats.streakType = 'win';
            }
            stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentStreak);
        } else if (isLoss) {
            if (stats.streakType === 'loss') {
                stats.currentStreak += 1;
            } else {
                stats.currentStreak = 1;
                stats.streakType = 'loss';
            }
            stats.longestLossStreak = Math.max(stats.longestLossStreak, stats.currentStreak);
        }

        // Update biggest win/loss
        if (game.winAmount && game.winAmount > stats.biggestWin) {
            stats.biggestWin = game.winAmount;
        }
        
        const loss = game.betAmount - (game.winAmount || 0);
        if (loss > 0 && loss > stats.biggestLoss) {
            stats.biggestLoss = loss;
        }

        // Update multipliers
        if (game.finalMultiplier) {
            if (game.finalMultiplier > stats.bestMultiplier) {
                stats.bestMultiplier = game.finalMultiplier;
            }
            
            // Calculate average multiplier
            const currentAvg = stats.averageMultiplier || 0;
            const newAvg = ((currentAvg * (stats.totalGames - 1)) + game.finalMultiplier) / stats.totalGames;
            stats.averageMultiplier = newAvg;
        }

        // Update favorite grid size (most played)
        const gridSizeStats = await MinesGame.aggregate([
            { $match: { userJid: game.userJid } },
            { $group: { _id: '$gridSize', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        
        if (gridSizeStats.length > 0) {
            stats.favoriteGridSize = gridSizeStats[0]._id;
        }

        stats.updatedAt = new Date();
        await stats.save();
        
        // Update leaderboard setiap kali ada perubahan stats
        await updateMinesLeaderboard();
        
        return stats;
    } catch (error) {
        console.error('Error updating mines stats:', error);
        throw error;
    }
}

// Fungsi untuk update leaderboard
async function updateMinesLeaderboard() {
    try {
        // Hapus leaderboard lama
        await MinesLeaderboard.deleteMany({});

        // Ambil top players berdasarkan total winnings
        const topPlayers = await MinesStats.find({ totalGames: { $gt: 0 } })
            .sort({ totalWinnings: -1 })
            .limit(100);

        // Buat entries leaderboard baru
        const leaderboardEntries = topPlayers.map((player, index) => ({
            userJid: player.userJid,
            userName: player.userName,
            rank: index + 1,
            totalWinnings: player.totalWinnings || 0,
            netProfit: player.netProfit || 0,
            winRate: player.totalGames > 0 ? 
                parseFloat(((player.gamesWon || 0) / player.totalGames * 100).toFixed(2)) : 0,
            bestMultiplier: player.bestMultiplier || 0,
            totalGames: player.totalGames || 0,
            gamesWon: player.gamesWon || 0,
            longestWinStreak: player.longestWinStreak || 0,
            updatedAt: new Date()
        }));

        if (leaderboardEntries.length > 0) {
            await MinesLeaderboard.insertMany(leaderboardEntries);
        }

        console.log(`✅ Mines leaderboard updated with ${leaderboardEntries.length} players`);
    } catch (error) {
        console.error('Error updating mines leaderboard:', error);
    }
}

// Fungsi untuk mendapatkan leaderboard
async function getMinesLeaderboard(limit = 50) {
    try {
        return await MinesLeaderboard.find()
            .sort({ rank: 1 })
            .limit(limit);
    } catch (error) {
        console.error('Error getting mines leaderboard:', error);
        return [];
    }
}

// Fungsi untuk mendapatkan rank user
async function getUserRank(userJid) {
    try {
        const entry = await MinesLeaderboard.findOne({ userJid });
        return entry ? entry.rank : null;
    } catch (error) {
        console.error('Error getting user rank:', error);
        return null;
    }
}

module.exports = {
    MinesGame,
    MinesStats,
    MinesLeaderboard,
    createMinesGame,
    completeMinesGame,
    getUserRecentGames,
    getMinesStats,
    updateMinesStatsAfterGame,
    updateMinesLeaderboard,
    getMinesLeaderboard,
    getUserRank
};