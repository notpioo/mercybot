const mongoose = require('mongoose');
const config = require('../config/config');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('📦 Using existing MongoDB connection');
        return;
    }

    try {
        console.log('🔗 Connecting to MongoDB...');
        
        const conn = await mongoose.connect(config.mongoURI, {
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
            bufferCommands: false
        });

        isConnected = true;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error.message);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
            isConnected = true;
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
