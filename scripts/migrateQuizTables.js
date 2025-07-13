const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const db = {
    execute: async (query, params) => {
        const client = await pool.connect();
        try {
            return await client.query(query, params);
        } finally {
            client.release();
        }
    }
};

async function migrateQuizTables() {
    console.log('🔄 Starting quiz tables migration...');
    
    try {
        // Create quiz tables
        await db.execute(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                time_limit INTEGER NOT NULL DEFAULT 10,
                points_per_question INTEGER NOT NULL DEFAULT 10,
                balance_reward INTEGER NOT NULL DEFAULT 1,
                chips_reward INTEGER NOT NULL DEFAULT 0,
                questions_count INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id SERIAL PRIMARY KEY,
                quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                option_a VARCHAR(255) NOT NULL,
                option_b VARCHAR(255) NOT NULL,
                option_c VARCHAR(255) NOT NULL,
                option_d VARCHAR(255) NOT NULL,
                correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
                question_order INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id SERIAL PRIMARY KEY,
                quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                user_jid VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                is_completed BOOLEAN NOT NULL DEFAULT false,
                total_score INTEGER NOT NULL DEFAULT 0,
                total_balance INTEGER NOT NULL DEFAULT 0,
                total_chips INTEGER NOT NULL DEFAULT 0,
                correct_answers INTEGER NOT NULL DEFAULT 0,
                total_questions INTEGER NOT NULL DEFAULT 0,
                UNIQUE(quiz_id, user_jid)
            )
        `);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS quiz_leaderboard (
                id SERIAL PRIMARY KEY,
                quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                user_jid VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                rank INTEGER NOT NULL DEFAULT 1,
                balance_earned INTEGER NOT NULL DEFAULT 0,
                chips_earned INTEGER NOT NULL DEFAULT 0,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(quiz_id, user_jid)
            )
        `);
        
        // Create indexes for better performance
        await db.execute('CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_jid ON quiz_attempts(user_jid)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_quiz_id ON quiz_leaderboard(quiz_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_rank ON quiz_leaderboard(rank)');
        
        console.log('✅ Quiz tables migration completed successfully!');
        console.log('📝 Created tables: quizzes, quiz_questions, quiz_attempts, quiz_leaderboard');
        
    } catch (error) {
        console.error('❌ Error during quiz tables migration:', error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateQuizTables()
        .then(() => {
            console.log('🎉 Quiz system database migration completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateQuizTables };