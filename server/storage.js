
const Database = require('better-sqlite3');
const path = require('path');

// Initialize SQLite database
const dbPath = path.join(__dirname, '../data/quiz.db');
const db = new Database(dbPath);

// Create tables if they don't exist
function initializeTables() {
    // Quizzes table
    db.exec(`
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            timeLimit INTEGER NOT NULL,
            pointsPerQuestion INTEGER NOT NULL,
            balanceReward INTEGER DEFAULT 1,
            chipsReward INTEGER DEFAULT 0,
            questionsCount INTEGER DEFAULT 0,
            isActive BOOLEAN DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Quiz questions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quizId INTEGER NOT NULL,
            questionText TEXT NOT NULL,
            optionA TEXT NOT NULL,
            optionB TEXT NOT NULL,
            optionC TEXT NOT NULL,
            optionD TEXT NOT NULL,
            correctAnswer TEXT NOT NULL,
            questionOrder INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
        )
    `);

    // Quiz attempts table
    db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quizId INTEGER NOT NULL,
            userJid TEXT NOT NULL,
            userName TEXT NOT NULL,
            startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            completedAt DATETIME NULL,
            isCompleted BOOLEAN DEFAULT 0,
            totalScore INTEGER DEFAULT 0,
            totalBalance INTEGER DEFAULT 0,
            totalChips INTEGER DEFAULT 0,
            correctAnswers INTEGER DEFAULT 0,
            totalQuestions INTEGER DEFAULT 0,
            FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
        )
    `);

    // Quiz leaderboard table
    db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quizId INTEGER NOT NULL,
            userJid TEXT NOT NULL,
            userName TEXT NOT NULL,
            bestScore INTEGER NOT NULL,
            bestTime INTEGER NULL,
            attemptsCount INTEGER DEFAULT 1,
            rank INTEGER NULL,
            lastAttempt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
        )
    `);

    // Create indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quizId)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quizId)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_jid ON quiz_attempts(userJid)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_quiz_id ON quiz_leaderboard(quizId)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_rank ON quiz_leaderboard(rank)');
}

// Initialize tables on module load
initializeTables();

// Storage functions
const storage = {
    // Quiz management
    createQuiz(quizData) {
        const stmt = db.prepare(`
            INSERT INTO quizzes (title, description, timeLimit, pointsPerQuestion, balanceReward, chipsReward, isActive)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            quizData.title,
            quizData.description,
            quizData.timeLimit,
            quizData.pointsPerQuestion,
            quizData.balanceReward,
            quizData.chipsReward,
            quizData.isActive
        );
        
        return { id: result.lastInsertRowid, ...quizData };
    },

    getActiveQuizzes() {
        const stmt = db.prepare('SELECT * FROM quizzes WHERE isActive = 1 ORDER BY createdAt DESC');
        return stmt.all();
    },

    getAllQuizzes() {
        const stmt = db.prepare('SELECT * FROM quizzes ORDER BY createdAt DESC');
        return stmt.all();
    },

    getQuizById(id) {
        const stmt = db.prepare('SELECT * FROM quizzes WHERE id = ?');
        return stmt.get(id);
    },

    updateQuiz(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const stmt = db.prepare(`UPDATE quizzes SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(...values);
        
        return this.getQuizById(id);
    },

    // Question management
    createQuizQuestion(questionData) {
        const stmt = db.prepare(`
            INSERT INTO quiz_questions (quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, questionOrder)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            questionData.quizId,
            questionData.questionText,
            questionData.optionA,
            questionData.optionB,
            questionData.optionC,
            questionData.optionD,
            questionData.correctAnswer,
            questionData.questionOrder
        );
        
        return { id: result.lastInsertRowid, ...questionData };
    },

    getQuizQuestions(quizId) {
        const stmt = db.prepare('SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY questionOrder ASC');
        return stmt.all(quizId);
    },

    // Quiz attempts
    createQuizAttempt(attemptData) {
        const stmt = db.prepare(`
            INSERT INTO quiz_attempts (quizId, userJid, userName, startedAt, isCompleted, totalScore, totalBalance, totalChips)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            attemptData.quizId,
            attemptData.userJid,
            attemptData.userName,
            attemptData.startedAt,
            attemptData.isCompleted,
            attemptData.totalScore,
            attemptData.totalBalance,
            attemptData.totalChips
        );
        
        return { id: result.lastInsertRowid, ...attemptData };
    },

    getQuizAttempt(id) {
        const stmt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ?');
        return stmt.get(id);
    },

    getUserQuizAttempt(quizId, userJid) {
        const stmt = db.prepare('SELECT * FROM quiz_attempts WHERE quizId = ? AND userJid = ?');
        return stmt.get(quizId, userJid);
    },

    updateQuizAttempt(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const stmt = db.prepare(`UPDATE quiz_attempts SET ${fields} WHERE id = ?`);
        stmt.run(...values);
        
        return this.getQuizAttempt(id);
    },

    // Leaderboard
    updateQuizLeaderboard(quizId) {
        // This would typically update the leaderboard based on quiz attempts
        // For now, we'll just return success
        return true;
    }
};

module.exports = { storage };
