import { users, minesGames, minesStats, minesLeaderboard, type User, type InsertUser, type MinesGame, type InsertMinesGame, type MinesStats, type InsertMinesStats, type MinesLeaderboard, type InsertMinesLeaderboard } from "../shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql } from "drizzle-orm";

// Interface for backward compatibility
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.jid, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Mines game methods
  async createMinesGame(gameData: InsertMinesGame): Promise<MinesGame> {
    const [game] = await db
      .insert(minesGames)
      .values(gameData)
      .returning();
    return game;
  }

  async updateMinesGame(gameId: number, updates: Partial<MinesGame>): Promise<MinesGame | undefined> {
    const [game] = await db
      .update(minesGames)
      .set({ ...updates, completedAt: new Date() })
      .where(eq(minesGames.id, gameId))
      .returning();
    return game;
  }

  async getMinesGame(gameId: number): Promise<MinesGame | undefined> {
    const [game] = await db.select().from(minesGames).where(eq(minesGames.id, gameId));
    return game;
  }

  async getUserMinesGames(userJid: string, limit: number = 10): Promise<MinesGame[]> {
    return await db
      .select()
      .from(minesGames)
      .where(eq(minesGames.userJid, userJid))
      .orderBy(desc(minesGames.createdAt))
      .limit(limit);
  }

  // Mines stats methods
  async getMinesStats(userJid: string): Promise<MinesStats | undefined> {
    const [stats] = await db.select().from(minesStats).where(eq(minesStats.userJid, userJid));
    return stats;
  }

  async upsertMinesStats(userJid: string, statsData: Partial<MinesStats>): Promise<MinesStats> {
    const existingStats = await this.getMinesStats(userJid);
    
    if (existingStats) {
      const [stats] = await db
        .update(minesStats)
        .set({ ...statsData, updatedAt: new Date() })
        .where(eq(minesStats.userJid, userJid))
        .returning();
      return stats;
    } else {
      const [stats] = await db
        .insert(minesStats)
        .values({ userJid, ...statsData } as InsertMinesStats)
        .returning();
      return stats;
    }
  }

  async updateMinesStatsAfterGame(userJid: string, userName: string, game: MinesGame): Promise<void> {
    const currentStats = await this.getMinesStats(userJid);
    
    const isWin = game.gameStatus === 'won' || game.gameStatus === 'cashed_out';
    const isLoss = game.gameStatus === 'lost';
    
    let newStats: Partial<MinesStats> = {
      userName,
      totalGames: (currentStats?.totalGames || 0) + 1,
      totalWagered: (currentStats?.totalWagered || 0) + game.betAmount,
      totalWinnings: (currentStats?.totalWinnings || 0) + (game.winAmount || 0),
      netProfit: (currentStats?.netProfit || 0) + (game.winAmount || 0) - game.betAmount,
      totalPlayTime: (currentStats?.totalPlayTime || 0) + (game.duration || 0),
      updatedAt: new Date()
    };

    if (isWin) {
      newStats.gamesWon = (currentStats?.gamesWon || 0) + 1;
      if (game.gameStatus === 'cashed_out') {
        newStats.gamesCashedOut = (currentStats?.gamesCashedOut || 0) + 1;
      }
    } else if (isLoss) {
      newStats.gamesLost = (currentStats?.gamesLost || 0) + 1;
    }

    // Update win/loss streaks
    const currentStreak = currentStats?.currentStreak || 0;
    const currentStreakType = currentStats?.streakType || 'none';
    
    if (isWin) {
      if (currentStreakType === 'win') {
        newStats.currentStreak = currentStreak + 1;
      } else {
        newStats.currentStreak = 1;
        newStats.streakType = 'win';
      }
      newStats.longestWinStreak = Math.max(
        currentStats?.longestWinStreak || 0,
        newStats.currentStreak
      );
    } else if (isLoss) {
      if (currentStreakType === 'loss') {
        newStats.currentStreak = currentStreak + 1;
      } else {
        newStats.currentStreak = 1;
        newStats.streakType = 'loss';
      }
      newStats.longestLossStreak = Math.max(
        currentStats?.longestLossStreak || 0,
        newStats.currentStreak
      );
    }

    // Update biggest win/loss
    if (game.winAmount && game.winAmount > (currentStats?.biggestWin || 0)) {
      newStats.biggestWin = game.winAmount;
    }
    
    const loss = game.betAmount - (game.winAmount || 0);
    if (loss > 0 && loss > (currentStats?.biggestLoss || 0)) {
      newStats.biggestLoss = loss;
    }

    // Update multipliers
    if (game.finalMultiplier) {
      const finalMultiplier = parseFloat(game.finalMultiplier.toString());
      if (finalMultiplier > parseFloat((currentStats?.bestMultiplier || '0').toString())) {
        newStats.bestMultiplier = game.finalMultiplier;
      }
      
      // Calculate average multiplier
      const totalGames = newStats.totalGames || 1;
      const currentAvg = parseFloat((currentStats?.averageMultiplier || '0').toString());
      const newAvg = ((currentAvg * (totalGames - 1)) + finalMultiplier) / totalGames;
      newStats.averageMultiplier = newAvg.toString();
    }

    // Update favorite grid size (most played)
    const gridSizeGames = await db
      .select({ count: sql<number>`count(*)` })
      .from(minesGames)
      .where(eq(minesGames.userJid, userJid))
      .groupBy(minesGames.gridSize)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    
    if (gridSizeGames.length > 0) {
      newStats.favoriteGridSize = game.gridSize;
    }

    await this.upsertMinesStats(userJid, newStats);
  }

  // Leaderboard methods
  async updateMinesLeaderboard(): Promise<void> {
    // Clear existing leaderboard
    await db.delete(minesLeaderboard);

    // Get top players by various metrics
    const topPlayers = await db
      .select({
        userJid: minesStats.userJid,
        userName: minesStats.userName,
        totalWinnings: minesStats.totalWinnings,
        netProfit: minesStats.netProfit,
        totalGames: minesStats.totalGames,
        gamesWon: minesStats.gamesWon,
        bestMultiplier: minesStats.bestMultiplier,
        longestWinStreak: minesStats.longestWinStreak
      })
      .from(minesStats)
      .where(sql`${minesStats.totalGames} > 0`)
      .orderBy(desc(minesStats.totalWinnings));

    // Insert leaderboard entries
    const leaderboardEntries = topPlayers.map((player, index) => ({
      userJid: player.userJid,
      userName: player.userName,
      rank: index + 1,
      totalWinnings: player.totalWinnings || 0,
      netProfit: player.netProfit || 0,
      winRate: player.totalGames > 0 ? 
        parseFloat(((player.gamesWon || 0) / player.totalGames * 100).toFixed(2)) : 0,
      bestMultiplier: player.bestMultiplier || '0',
      totalGames: player.totalGames || 0,
      gamesWon: player.gamesWon || 0,
      longestWinStreak: player.longestWinStreak || 0,
      updatedAt: new Date()
    }));

    if (leaderboardEntries.length > 0) {
      await db.insert(minesLeaderboard).values(leaderboardEntries);
    }
  }

  async getMinesLeaderboard(limit: number = 50): Promise<MinesLeaderboard[]> {
    return await db
      .select()
      .from(minesLeaderboard)
      .orderBy(asc(minesLeaderboard.rank))
      .limit(limit);
  }

  async getUserRank(userJid: string): Promise<number | null> {
    const [entry] = await db
      .select({ rank: minesLeaderboard.rank })
      .from(minesLeaderboard)
      .where(eq(minesLeaderboard.userJid, userJid));
    
    return entry?.rank || null;
  }
}

export const storage = new DatabaseStorage();