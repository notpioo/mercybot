const { Pool } = require('pg');
const { eq, desc, asc, sql } = require('drizzle-orm');

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

// Simple storage methods for quiz operations
const storage = {
    async createQuiz(quizData) {
        const result = await db.execute(
            `INSERT INTO quizzes (title, description, time_limit, points_per_question, balance_reward, chips_reward, is_active, questions_count, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                quizData.title,
                quizData.description,
                quizData.timeLimit,
                quizData.pointsPerQuestion,
                quizData.balanceReward,
                quizData.chipsReward,
                quizData.isActive,
                quizData.questionsCount,
                quizData.createdAt,
                quizData.updatedAt
            ]
        );
        return result.rows[0];
    },
    
    async createQuizQuestion(questionData) {
        const result = await db.execute(
            `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                questionData.quizId,
                questionData.questionText,
                questionData.optionA,
                questionData.optionB,
                questionData.optionC,
                questionData.optionD,
                questionData.correctAnswer,
                questionData.questionOrder
            ]
        );
        return result.rows[0];
    },
    
    async updateQuiz(quizId, updates) {
        const result = await db.execute(
            `UPDATE quizzes SET questions_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [quizId, updates.questionsCount]
        );
        return result.rows[0];
    }
};

async function addSampleQuiz() {
    console.log('🔄 Adding sample quiz...');
    
    try {
        // Create a sample quiz
        const quizData = {
            title: 'General Knowledge Quiz',
            description: 'Test your general knowledge with these fun questions!',
            timeLimit: 5,
            pointsPerQuestion: 10,
            balanceReward: 2,
            chipsReward: 1,
            isActive: true,
            questionsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const quiz = await storage.createQuiz(quizData);
        console.log('✅ Sample quiz created with ID:', quiz.id);
        
        // Add sample questions
        const questions = [
            {
                quizId: quiz.id,
                questionText: 'What is the capital of France?',
                optionA: 'London',
                optionB: 'Berlin',
                optionC: 'Paris',
                optionD: 'Madrid',
                correctAnswer: 'C',
                questionOrder: 1
            },
            {
                quizId: quiz.id,
                questionText: 'Which planet is known as the Red Planet?',
                optionA: 'Venus',
                optionB: 'Mars',
                optionC: 'Jupiter',
                optionD: 'Saturn',
                correctAnswer: 'B',
                questionOrder: 2
            },
            {
                quizId: quiz.id,
                questionText: 'What is 2 + 2?',
                optionA: '3',
                optionB: '4',
                optionC: '5',
                optionD: '6',
                correctAnswer: 'B',
                questionOrder: 3
            },
            {
                quizId: quiz.id,
                questionText: 'Who painted the Mona Lisa?',
                optionA: 'Pablo Picasso',
                optionB: 'Vincent van Gogh',
                optionC: 'Leonardo da Vinci',
                optionD: 'Michelangelo',
                correctAnswer: 'C',
                questionOrder: 4
            },
            {
                quizId: quiz.id,
                questionText: 'What is the largest ocean on Earth?',
                optionA: 'Atlantic Ocean',
                optionB: 'Indian Ocean',
                optionC: 'Arctic Ocean',
                optionD: 'Pacific Ocean',
                correctAnswer: 'D',
                questionOrder: 5
            }
        ];
        
        let questionCount = 0;
        for (const questionData of questions) {
            await storage.createQuizQuestion(questionData);
            questionCount++;
            console.log(`📝 Added question ${questionCount}: ${questionData.questionText}`);
        }
        
        // Update quiz with correct question count
        await storage.updateQuiz(quiz.id, { questionsCount: questionCount });
        
        console.log('✅ Sample quiz setup completed!');
        console.log(`📊 Quiz: "${quiz.title}" with ${questionCount} questions`);
        console.log(`🎯 Points: ${quiz.pointsPerQuestion} per question`);
        console.log(`💰 Rewards: ${quiz.balanceReward} balance + ${quiz.chipsReward} chips per point`);
        console.log(`⏱️ Time limit: ${quiz.timeLimit} minutes`);
        
    } catch (error) {
        console.error('❌ Error adding sample quiz:', error);
        throw error;
    }
}

// Run if this file is executed directly
if (require.main === module) {
    addSampleQuiz()
        .then(() => {
            console.log('🎉 Sample quiz added successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Failed to add sample quiz:', error);
            process.exit(1);
        });
}

module.exports = { addSampleQuiz };