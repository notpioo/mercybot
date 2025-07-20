// Railway deployment specific configurations
module.exports = {
    // Enhanced QR code settings for Railway
    qrConfig: {
        width: 512,
        margin: 6,
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 1.0,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        rendererOpts: {
            quality: 1.0
        }
    },

    // WhatsApp socket settings optimized for Railway
    socketConfig: {
        printQRInTerminal: false,
        browser: ['Railway WhatsApp Bot', 'Desktop', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        qrTimeout: 40000,
        retryRequestDelayMs: 1000,
        generateHighQualityLinkPreview: true
    },

    // Session configuration for persistent storage
    sessionConfig: {
        authDir: './sessions',
        saveCreds: true,
        clearOnLogout: false
    },

    // Reconnection strategy
    reconnection: {
        maxAttempts: 5,
        delayMs: 3000,
        backoffFactor: 1.5
    },

    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        timeout: 60000
    }
};