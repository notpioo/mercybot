import { pgTable, serial, text, integer, timestamp, boolean, varchar, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  jid: text('jid').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  balance: integer('balance').default(0),
  chips: integer('chips').default(0),
  limit: integer('limit').default(30),
  status: text('status').default('basic'),
  warnings: integer('warnings').default(0),
  commandCount: integer('command_count').default(0),
  lastSeen: timestamp('last_seen'),
  memberSince: timestamp('member_since').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const minesGames = pgTable('mines_games', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  userJid: text('user_jid').notNull(),
  userName: text('user_name').notNull(),
  gridSize: integer('grid_size').notNull(), // 25, 36, 49, or 64
  mineCount: integer('mine_count').notNull(),
  betAmount: integer('bet_amount').notNull(),
  finalMultiplier: decimal('final_multiplier', { precision: 10, scale: 2 }).default('0'),
  winAmount: integer('win_amount').default(0),
  cellsRevealed: integer('cells_revealed').default(0),
  gameStatus: text('game_status').notNull().default('playing'), // playing, won, lost, cashed_out
  gameBoard: jsonb('game_board'), // Store the mine positions and revealed cells
  duration: integer('duration').default(0), // Game duration in seconds
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

export const minesStats = pgTable('mines_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  userJid: text('user_jid').notNull().unique(),
  userName: text('user_name').notNull(),
  totalGames: integer('total_games').default(0),
  gamesWon: integer('games_won').default(0),
  gamesLost: integer('games_lost').default(0),
  gamesCashedOut: integer('games_cashed_out').default(0),
  totalWagered: integer('total_wagered').default(0),
  totalWinnings: integer('total_winnings').default(0),
  netProfit: integer('net_profit').default(0),
  biggestWin: integer('biggest_win').default(0),
  biggestLoss: integer('biggest_loss').default(0),
  longestWinStreak: integer('longest_win_streak').default(0),
  longestLossStreak: integer('longest_loss_streak').default(0),
  currentStreak: integer('current_streak').default(0),
  streakType: text('streak_type').default('none'), // win, loss, none
  averageMultiplier: decimal('average_multiplier', { precision: 10, scale: 2 }).default('0'),
  bestMultiplier: decimal('best_multiplier', { precision: 10, scale: 2 }).default('0'),
  totalPlayTime: integer('total_play_time').default(0), // in seconds
  favoriteGridSize: integer('favorite_grid_size').default(25),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const minesLeaderboard = pgTable('mines_leaderboard', {
  id: serial('id').primaryKey(),
  userJid: text('user_jid').notNull().unique(),
  userName: text('user_name').notNull(),
  rank: integer('rank').notNull(),
  totalWinnings: integer('total_winnings').default(0),
  netProfit: integer('net_profit').default(0),
  winRate: decimal('win_rate', { precision: 5, scale: 2 }).default('0'),
  bestMultiplier: decimal('best_multiplier', { precision: 10, scale: 2 }).default('0'),
  totalGames: integer('total_games').default(0),
  gamesWon: integer('games_won').default(0),
  longestWinStreak: integer('longest_win_streak').default(0),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  endsAt: timestamp('ends_at')
});

export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id),
  question: text('question').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctAnswer: text('correct_answer').notNull(), // A, B, C, or D
  points: integer('points').default(10),
  balanceReward: integer('balance_reward').default(0),
  chipsReward: integer('chips_reward').default(0),
  questionOrder: integer('question_order').default(1)
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id),
  userJid: text('user_jid').notNull(),
  userName: text('user_name').notNull(),
  totalScore: integer('total_score').default(0),
  totalBalance: integer('total_balance').default(0),
  totalChips: integer('total_chips').default(0),
  answers: jsonb('answers'), // Store user answers
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

export const quizLeaderboard = pgTable('quiz_leaderboard', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => quizzes.id),
  userJid: text('user_jid').notNull(),
  userName: text('user_name').notNull(),
  score: integer('score').default(0),
  rank: integer('rank').default(1),
  balanceEarned: integer('balance_earned').default(0),
  chipsEarned: integer('chips_earned').default(0),
  completedAt: timestamp('completed_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  minesGames: many(minesGames),
  minesStats: many(minesStats),
  minesLeaderboard: many(minesLeaderboard),
  quizAttempts: many(quizAttempts),
  quizLeaderboard: many(quizLeaderboard)
}));

export const minesGamesRelations = relations(minesGames, ({ one }) => ({
  user: one(users, {
    fields: [minesGames.userId],
    references: [users.id]
  })
}));

export const minesStatsRelations = relations(minesStats, ({ one }) => ({
  user: one(users, {
    fields: [minesStats.userId],
    references: [users.id]
  })
}));

export const minesLeaderboardRelations = relations(minesLeaderboard, ({ one }) => ({
  user: one(users, {
    fields: [minesLeaderboard.userJid],
    references: [users.jid]
  })
}));

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
  leaderboard: many(quizLeaderboard)
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id]
  })
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id]
  })
}));

export const quizLeaderboardRelations = relations(quizLeaderboard, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizLeaderboard.quizId],
    references: [quizzes.id]
  })
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MinesGame = typeof minesGames.$inferSelect;
export type InsertMinesGame = typeof minesGames.$inferInsert;
export type MinesStats = typeof minesStats.$inferSelect;
export type InsertMinesStats = typeof minesStats.$inferInsert;
export type MinesLeaderboard = typeof minesLeaderboard.$inferSelect;
export type InsertMinesLeaderboard = typeof minesLeaderboard.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizLeaderboard = typeof quizLeaderboard.$inferSelect;
export type InsertQuizLeaderboard = typeof quizLeaderboard.$inferInsert;