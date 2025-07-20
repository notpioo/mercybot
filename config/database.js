// Database Configuration
module.exports = {
    mongodb: {
        uri: process.env.MONGODB_URI || 
            "mongodb+srv://pioo:Avionika27@cluster0.feboa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        options: {
            // Modern MongoDB connection options
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        },
        database: process.env.DB_NAME || "test"
    },
    
    // Connection retry settings
    retry: {
        attempts: 3,
        delay: 1000
    },
    
    // Default values for new documents
    defaults: {
        user: {
            status: "basic",
            limit: 30,
            balance: 0,
            chips: 0,
            warnings: 0,
            isBlocked: false,
            premiumUntil: null,
            banUntil: null,
            lastUsed: null,
            memberSince: () => new Date()
        },
        group: {
            name: "",
            description: "",
            participants: [],
            settings: {
                antibadword: false,
                antiViewOnce: false,
                welcome: false,
                antilink: false
            },
            badWords: []
        }
    }
};