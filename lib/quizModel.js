
const mongoose = require('mongoose');

// Quiz Schema
const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    timeLimit: {
        type: Number,
        required: true,
        min: 1,
        max: 60
    },
    pointsPerQuestion: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    questionsCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Question Schema
const questionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    optionA: {
        type: String,
        required: true,
        trim: true
    },
    optionB: {
        type: String,
        required: true,
        trim: true
    },
    optionC: {
        type: String,
        required: true,
        trim: true
    },
    optionD: {
        type: String,
        required: true,
        trim: true
    },
    correctAnswer: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    questionOrder: {
        type: Number,
        default: 1
    },
    balanceReward: {
        type: Number,
        default: 10,
        min: 0
    },
    chipsReward: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Quiz Attempt Schema
const quizAttemptSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    userJid: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        selectedAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D']
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        balanceEarned: {
            type: Number,
            default: 0
        },
        chipsEarned: {
            type: Number,
            default: 0
        }
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    totalBalance: {
        type: Number,
        default: 0
    },
    totalChips: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Quiz Leaderboard Schema
const quizLeaderboardSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    userJid: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    bestScore: {
        type: Number,
        required: true
    },
    bestTime: {
        type: Number,
        default: null
    },
    attemptsCount: {
        type: Number,
        default: 1
    },
    rank: {
        type: Number,
        default: null
    },
    lastAttempt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create models
const Quiz = mongoose.model('Quiz', quizSchema);
const Question = mongoose.model('Question', questionSchema);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
const QuizLeaderboard = mongoose.model('QuizLeaderboard', quizLeaderboardSchema);

// Storage functions
const quizStorage = {
    // Quiz management
    async createQuiz(quizData) {
        const quiz = new Quiz(quizData);
        return await quiz.save();
    },

    async getActiveQuizzes() {
        return await Quiz.find({ isActive: true }).sort({ createdAt: -1 });
    },

    async getAllQuizzes() {
        return await Quiz.find().sort({ createdAt: -1 });
    },

    async getQuizById(id) {
        return await Quiz.findById(id);
    },

    async updateQuiz(id, updates) {
        return await Quiz.findByIdAndUpdate(id, updates, { new: true });
    },

    async deleteQuiz(id) {
        // Delete quiz and all related data
        await Question.deleteMany({ quizId: id });
        await QuizAttempt.deleteMany({ quizId: id });
        await QuizLeaderboard.deleteMany({ quizId: id });
        return await Quiz.findByIdAndDelete(id);
    },

    // Question management
    async createQuizQuestion(questionData) {
        const question = new Question(questionData);
        const savedQuestion = await question.save();
        
        // Update questions count in quiz
        await Quiz.findByIdAndUpdate(
            questionData.quizId,
            { $inc: { questionsCount: 1 } }
        );
        
        return savedQuestion;
    },

    async getQuizQuestions(quizId) {
        return await Question.find({ quizId }).sort({ questionOrder: 1 });
    },

    async updateQuestion(id, updates) {
        return await Question.findByIdAndUpdate(id, updates, { new: true });
    },

    async deleteQuestion(id) {
        const question = await Question.findById(id);
        if (question) {
            await Question.findByIdAndDelete(id);
            // Update questions count in quiz
            await Quiz.findByIdAndUpdate(
                question.quizId,
                { $inc: { questionsCount: -1 } }
            );
        }
        return question;
    },

    // Quiz attempts
    async createQuizAttempt(attemptData) {
        const attempt = new QuizAttempt(attemptData);
        return await attempt.save();
    },

    async getQuizAttempt(id) {
        return await QuizAttempt.findById(id);
    },

    async getUserQuizAttempt(quizId, userJid) {
        return await QuizAttempt.findOne({ quizId, userJid });
    },

    async updateQuizAttempt(id, updates) {
        return await QuizAttempt.findByIdAndUpdate(id, updates, { new: true });
    },

    async getQuizAttempts(quizId) {
        return await QuizAttempt.find({ quizId }).sort({ createdAt: -1 });
    },

    async getUserAttempts(userJid) {
        return await QuizAttempt.find({ userJid }).populate('quizId').sort({ createdAt: -1 });
    },

    // Leaderboard
    async updateQuizLeaderboard(quizId) {
        const topAttempts = await QuizAttempt.find({ 
            quizId, 
            isCompleted: true 
        })
        .sort({ totalScore: -1, timeTaken: 1 })
        .limit(100);

        // Clear existing leaderboard
        await QuizLeaderboard.deleteMany({ quizId });

        // Create new leaderboard entries
        for (let i = 0; i < topAttempts.length; i++) {
            const attempt = topAttempts[i];
            await QuizLeaderboard.create({
                quizId: quizId,
                userJid: attempt.userJid,
                userName: attempt.userName,
                bestScore: attempt.totalScore,
                bestTime: attempt.timeTaken,
                attemptsCount: 1,
                rank: i + 1,
                lastAttempt: attempt.completedAt
            });
        }

        return true;
    },

    async getQuizLeaderboard(quizId, limit = 50) {
        return await QuizLeaderboard.find({ quizId })
            .sort({ rank: 1 })
            .limit(limit);
    },

    async getUserQuizStats(userJid) {
        const totalAttempts = await QuizAttempt.countDocuments({ userJid, isCompleted: true });
        const totalScore = await QuizAttempt.aggregate([
            { $match: { userJid, isCompleted: true } },
            { $group: { _id: null, total: { $sum: '$totalScore' } } }
        ]);

        return {
            totalAttempts,
            totalScore: totalScore[0]?.total || 0,
            averageScore: totalAttempts > 0 ? (totalScore[0]?.total || 0) / totalAttempts : 0
        };
    }
};

module.exports = {
    Quiz,
    Question,
    QuizAttempt,
    QuizLeaderboard,
    quizStorage
};
