const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const QRCode = require('qrcode');
const config = require('./config/config');
const { getUser, createUser, updateUser } = require('./utils/userUtils');
const { 
    initAnnouncementsTable, 
    getRecentAnnouncements, 
    getAllAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('./database/announcements');

const {
    initPostsTable,
    getRecentPosts,
    getPostsByUser,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment
} = require('./database/posts');

// Global variable to store bot instance
let botInstance = null;
let currentQRCode = null;

// Function to set bot instance from index.js
const setBotInstance = (bot) => {
    botInstance = bot;
};

// Function to set current QR code
const setQRCode = (qrCode) => {
    currentQRCode = qrCode;
    console.log('🔄 QR Code updated for web display');
};

// Function to send verification code via WhatsApp
const sendVerificationCode = async (phone, code) => {
    console.log(`🔄 Attempting to send verification code to ${phone}`);
    console.log(`🔍 Bot instance exists: ${!!botInstance}`);
    console.log(`🔍 Bot connected: ${botInstance ? botInstance.isConnected : 'N/A'}`);
    console.log(`🔍 Bot socket exists: ${botInstance && botInstance.sock ? 'YES' : 'NO'}`);

    if (!botInstance || !botInstance.isConnected || !botInstance.sock) {
        console.log('⚠️ Bot not properly connected, cannot send verification code');
        console.log(`⚠️ Bot instance: ${!!botInstance}, isConnected: ${botInstance ? botInstance.isConnected : 'N/A'}, socket: ${botInstance && botInstance.sock ? 'exists' : 'missing'}`);
        return false;
    }

    try {
        const whatsappId = phone + '@s.whatsapp.net';
        const message = `🔐 *Kode Verifikasi NoMercy*\n\nKode verifikasi Anda: *${code}*\n\nMasukkan kode ini di website untuk login.\nKode berlaku selama 5 menit.\n\n_Jangan bagikan kode ini kepada siapapun!_`;

        console.log(`📤 Sending message to ${whatsappId}`);
        console.log(`📝 Message content: ${message}`);

        // Use the socket directly to send message
        await botInstance.sock.sendMessage(whatsappId, { text: message });
        console.log(`✅ Verification code successfully sent to ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send verification code:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return false;
    }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'seanabot-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Store verification codes temporarily
const verificationCodes = new Map();

// Routes
app.get('/', (req, res) => {
    if (req.session.isAuthenticated || req.session.isOwner) {
        // If user is authenticated, redirect to home dashboard
        return res.redirect('/home');
    }
    res.render('index');
});

// Test route for dashboard-owner (temporary)
app.get('/test-dashboard', (req, res) => {
    res.render('dashboard-owner', { user: null });
});

// Initialize database after MongoDB connection is established
const connectDB = require('./database/connection');
(async () => {
    try {
        // Wait for MongoDB connection first
        await connectDB();

        // Then initialize announcements and posts
        await initAnnouncementsTable();
        await initPostsTable();
        console.log('✅ Announcements and Posts system initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize announcements system:', error);
    }
})();

// Main Navigation Routes
app.get('/home', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    let announcements = [];

    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    try {
        announcements = await getRecentAnnouncements(3);
    } catch (error) {
        console.error('Error fetching announcements:', error);
    }

    res.render('home', { user: userData, announcements, isOwner: req.session.isOwner });
});

app.get('/social', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    let posts = [];

    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    try {
        posts = await getRecentPosts(20);
    } catch (error) {
        console.error('Error fetching posts:', error);
    }

    res.render('social', { user: userData, posts, isOwner: req.session.isOwner });
});

// News route - shows all announcements
app.get('/news', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    let announcements = [];

    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    try {
        announcements = await getAllAnnouncements();
    } catch (error) {
        console.error('Error fetching announcements:', error);
    }

    res.render('news', { user: userData, announcements, isOwner: req.session.isOwner });
});

app.get('/profile', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('profile', { user: userData });
});

// List Menu Routes
app.get('/shop', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('shop', { user: userData });
});

app.get('/redeem', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('redeem', { user: userData });
});

app.get('/member', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('member', { user: userData });
});

app.get('/quest', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('quest', { user: userData });
});

app.get('/tournament', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('tournament', { user: userData });
});

app.get('/mine', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('mine', { user: userData });
});

app.get('/tower', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('tower', { user: userData });
});

app.get('/coinflip', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('coinflip', { user: userData });
});

app.get('/dashboard-owner', async (req, res) => {
    console.log('🔍 Dashboard owner access attempt');
    console.log('🔍 Session isOwner:', req.session.isOwner);
    console.log('🔍 Session isAuthenticated:', req.session.isAuthenticated);

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
            console.log('🔍 User data status:', userData ? userData.status : 'no user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Check if user is owner either by session or by user status in database
    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    // Temporarily remove authentication for testing - will be restored later
    if (!isOwner && false) { // Note: temporarily disabled with && false
        console.log('❌ Access denied to dashboard-owner - not owner');
        return res.redirect('/');
    }

    console.log('✅ Access granted to dashboard-owner');
    res.render('dashboard-owner', { user: userData });
});

// User Manager Route
app.get('/owner/user-manager', async (req, res) => {
    console.log('🔍 User Manager access attempt');
    console.log('🔍 Session isOwner:', req.session.isOwner);

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Check if user is owner
    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner && false) { // Temporarily disabled
        console.log('❌ Access denied to user-manager - not owner');
        return res.redirect('/');
    }

    // Get all users from database
    let allUsers = [];
    try {
        const User = require('./database/models/User');
        allUsers = await User.find({}).sort({ createdAt: -1 });
    } catch (error) {
        console.error('Error fetching users:', error);
    }

    console.log('✅ Access granted to user-manager');
    res.render('user-manager', { user: userData, users: allUsers, isOwner: true });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/owner', (req, res) => {
    res.render('owner');
});

app.post('/owner-auth', (req, res) => {
    const { password } = req.body;

    if (password === 'Faratama') {
        req.session.isOwner = true;
        res.render('qr-scanner');
    } else {
        res.render('owner', { error: 'Password salah!' });
    }
});

app.post('/verify-phone', async (req, res) => {
    const { phone } = req.body;

    console.log(`📞 Verification request for phone: ${phone}`);

    // Generate 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated verification code: ${verificationCode}`);

    // Store code with phone number
    verificationCodes.set(phone, {
        code: verificationCode,
        timestamp: Date.now(),
        attempts: 0
    });

    // Send verification code via WhatsApp bot
    console.log(`📤 Attempting to send verification code...`);
    const codeSent = await sendVerificationCode(phone, verificationCode);

    if (!codeSent) {
        console.log(`⚠️ Could not send code via WhatsApp, logging code for manual testing: ${verificationCode}`);
        console.log(`🔍 Please check if bot is properly connected and phone number is correct`);
    } else {
        console.log(`✅ Verification code sent successfully to ${phone}`);
    }

    // Auto-delete code after 5 minutes
    setTimeout(() => {
        verificationCodes.delete(phone);
        console.log(`🗑️ Verification code for ${phone} expired and deleted`);
    }, 5 * 60 * 1000);

    res.render('verify-code', { phone, codeSent });
});

app.post('/verify-code', async (req, res) => {
    const { phone, code } = req.body;

    const storedData = verificationCodes.get(phone);

    if (!storedData) {
        return res.render('verify-code', { 
            phone, 
            error: 'Kode verifikasi sudah kedaluwarsa. Silakan coba lagi.' 
        });
    }

    if (storedData.attempts >= 3) {
        verificationCodes.delete(phone);
        return res.render('login', { 
            error: 'Terlalu banyak percobaan. Silakan kirim ulang kode verifikasi.' 
        });
    }

    if (storedData.code === code) {
        // Code is correct
        verificationCodes.delete(phone);
        req.session.userPhone = phone;
        req.session.isAuthenticated = true;

        // Create or get user from database
        try {
            await createUser(phone + '@s.whatsapp.net', {});
            res.redirect('/home');
        } catch (error) {
            console.error('Error creating user:', error);
            res.render('login', { error: 'Terjadi kesalahan. Silakan coba lagi.' });
        }
    } else {
        // Incorrect code
        storedData.attempts++;
        res.render('verify-code', { 
            phone, 
            error: 'Kode verifikasi salah. Silakan coba lagi.' 
        });
    }
});

app.get('/dashboard', async (req, res) => {
    // Redirect dashboard to home page
    res.redirect('/home');
});

app.post('/resend-code', async (req, res) => {
    const { phone } = req.body;

    console.log(`🔄 Resend verification request for phone: ${phone}`);

    // Generate new 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Generated new verification code: ${verificationCode}`);

    // Store new code with phone number
    verificationCodes.set(phone, {
        code: verificationCode,
        timestamp: Date.now(),
        attempts: 0
    });

    // Send verification code via WhatsApp bot
    console.log(`📤 Attempting to resend verification code...`);
    const codeSent = await sendVerificationCode(phone, verificationCode);

    if (!codeSent) {
        console.log(`⚠️ Could not resend code via WhatsApp, logging code for manual testing: ${verificationCode}`);
        console.log(`🔍 Please check if bot is properly connected and phone number is correct`);
    } else {
        console.log(`✅ Verification code resent successfully to ${phone}`);
    }

    // Auto-delete code after 5 minutes
    setTimeout(() => {
        verificationCodes.delete(phone);
        console.log(`🗑️ Resent verification code for ${phone} expired and deleted`);
    }, 5 * 60 * 1000);

    res.render('verify-code', { 
        phone, 
        codeSent,
        message: codeSent ? 'Kode verifikasi baru telah dikirim!' : 'Bot tidak terhubung. Kode verifikasi di-log ke console.' 
    });
});

app.get('/api/bot-status', (req, res) => {
    const isConnected = botInstance && botInstance.isConnected && botInstance.sock;
    console.log(`🔍 Bot status check: ${isConnected ? 'CONNECTED' : 'NOT CONNECTED'}`);
    console.log(`🔍 Bot instance exists: ${!!botInstance}`);
    console.log(`🔍 Bot isConnected flag: ${botInstance ? botInstance.isConnected : 'N/A'}`);
    console.log(`🔍 Bot socket exists: ${botInstance && botInstance.sock ? 'YES' : 'NO'}`);

    if (isConnected) {
        res.json({ 
            connected: true, 
            message: 'Bot WhatsApp sudah terhubung!',
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({ 
            connected: false, 
            message: 'Bot belum terhubung, silakan scan QR code',
            hasQR: !!currentQRCode,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/qr-code', async (req, res) => {
    try {
        console.log('📱 QR code requested. Current QR available:', !!currentQRCode);

        if (currentQRCode) {
            console.log('✅ Generating QR code data URL...');
            // Generate QR code as data URL with high quality
            const qrCodeDataURL = await QRCode.toDataURL(currentQRCode, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            console.log('✅ QR code generated successfully');
            res.json({ 
                success: true, 
                qrCode: qrCodeDataURL,
                message: 'QR code ready'
            });
        } else {
            console.log('⚠️ QR code not available yet');
            res.json({ 
                success: false, 
                message: 'QR code not available yet. Bot may be starting or already connected.' 
            });
        }
    } catch (error) {
        console.error('❌ Error generating QR code:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating QR code: ' + error.message 
        });
    }
});

// News Manager Routes (Owner only)
app.get('/news-manager', async (req, res) => {
    console.log('🔍 News Manager access attempt');
    console.log('🔍 Session isOwner:', req.session.isOwner);
    console.log('🔍 Session isAuthenticated:', req.session.isAuthenticated);

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
            console.log('🔍 User data status:', userData ? userData.status : 'no user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Check if user is owner either by session or by user status in database
    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        console.log('❌ Access denied to news-manager - not owner');
        return res.redirect('/');
    }

    let announcements = [];

    try {
        announcements = await getAllAnnouncements();
    } catch (error) {
        console.error('Error fetching announcements:', error);
    }

    console.log('✅ Access granted to news-manager');
    res.render('news-manager', { announcements, user: userData, isOwner: true });
});

// API Routes for News Management
app.post('/api/news/add', async (req, res) => {
    console.log('🔍 API news/add access attempt');
    console.log('🔍 Session isOwner:', req.session.isOwner);
    console.log('🔍 Session isAuthenticated:', req.session.isAuthenticated);

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
            console.log('🔍 User data status:', userData ? userData.status : 'no user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Check if user is owner either by session or by user status in database
    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        console.log('❌ Access denied to news/add API - not owner');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { title, content, author, icon, category } = req.body;

        if (!title || !content || !author) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, content, and author are required' 
            });
        }

        console.log('✅ Adding news with data:', { title, author, icon, category });
        const newAnnouncement = await addAnnouncement(title, content, author, icon, category);
        res.json({ 
            success: true, 
            message: 'News added successfully',
            announcement: newAnnouncement
        });
    } catch (error) {
        console.error('Error adding news:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add news: ' + error.message 
        });
    }
});

app.post('/api/news/update', async (req, res) => {
    console.log('🔍 API news/update access attempt');
    console.log('🔍 Session isOwner:', req.session.isOwner);
    console.log('🔍 Session isAuthenticated:', req.session.isAuthenticated);

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
            console.log('🔍 User data status:', userData ? userData.status : 'no user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Check if user is owner either by session or by user status in database
    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        console.log('❌ Access denied to news/update API - not owner');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { newsId, title, content, author, icon, category } = req.body;

        if (!newsId || !title || !content || !author) {
            return res.status(400).json({ 
                success: false, 
                message: 'NewsId, title, content, and author are required' 
            });
        }

        console.log('✅ Updating news with ID:', newsId);
        const updatedAnnouncement = await updateAnnouncement(newsId, {
            title,
            content,
            author,
            icon,
            category
        });

        if (!updatedAnnouncement) {
            return res.status(404).json({ 
                success: false, 
                message: 'News not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'News updated successfully',
            announcement: updatedAnnouncement
        });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update news: ' + error.message 
        });
    }
});

app.delete('/api/news/delete', async (req, res) => {
    console.log('🔍 API news/delete access attempt');
    console.log('🔍 Session isOwner:', req.session.isOwner);
    console.log('🔍 Session isAuthenticated:', req.session.isAuthenticated);

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
            console.log('🔍 User data status:', userData ? userData.status : 'no user data');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Check if user is owner either by session or by user status in database
    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        console.log('❌ Access denied to news/delete API - not owner');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { newsId } = req.body;

        if (!newsId) {
            return res.status(400).json({ 
                success: false, 
                message: 'NewsId is required' 
            });
        }

        console.log('✅ Deleting news with ID:', newsId);
        const result = await deleteAnnouncement(newsId);

        if (!result) {
            return res.status(404).json({ 
                success: false, 
                message: 'News not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'News deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete news: ' + error.message 
        });
    }
});

// File upload middleware
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        // Create directory if it doesn't exist
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    }
});

// File upload API
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        success: true, 
        fileUrl: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
    });
});

// Get all posts API
app.get('/api/posts/all', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const posts = await getRecentPosts(50); // Get more posts for better UX
        res.json({ 
            success: true, 
            posts: posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch posts: ' + error.message 
        });
    }
});

// Delete post API
app.delete('/api/posts/delete', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // Get the post first to check ownership
        const Post = require('./database/models/Post');
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        // Check if user owns the post
        const currentUserId = req.session.userPhone + '@s.whatsapp.net';
        if (post.userId !== currentUserId && !req.session.isOwner) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only delete your own posts' 
            });
        }

        // Delete associated media file if exists
        if (post.mediaUrl) {
            const fs = require('fs');
            const filePath = path.join(__dirname, 'public', post.mediaUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const deleted = await deletePost(postId);
        if (deleted) {
            res.json({ 
                success: true, 
                message: 'Post deleted successfully'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete post' 
            });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete post: ' + error.message 
        });
    }
});

// Profile Update API
app.post('/api/profile/update', upload.single('profilePhoto'), async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { username } = req.body;
        const userPhone = req.session.userPhone;

        if (!userPhone) {
            return res.status(400).json({ 
                success: false, 
                message: 'User session not found' 
            });
        }

        // Check if at least one field is provided
        if ((!username || username.trim().length === 0) && !req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide either a username or profile photo to update' 
            });
        }

        const userId = userPhone + '@s.whatsapp.net';
        
        // Prepare update data
        const updateData = {};

        // Handle username update (only if provided and not empty)
        if (username && username.trim().length > 0) {
            updateData.username = username.trim();
        }

        // Handle profile photo upload
        if (req.file) {
            const photoUrl = `/uploads/${req.file.filename}`;
            updateData.profilePhoto = photoUrl;
            console.log(`📷 Profile photo uploaded: ${photoUrl}`);
        }

        // Update user in database
        const updatedUser = await updateUser(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log(`✅ Profile updated for user: ${userId}`);
        console.log(`📝 New username: ${updateData.username}`);
        if (updateData.profilePhoto) {
            console.log(`📷 New profile photo: ${updateData.profilePhoto}`);
        }

        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: {
                username: updatedUser.username,
                profilePhoto: updatedUser.profilePhoto
            }
        });

    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile: ' + error.message 
        });
    }
});

// Social Posts API Routes
app.post('/api/posts/create', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { type, content, mediaUrl } = req.body;

        if (!content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Content is required' 
            });
        }

        let userData = null;
        let author = 'Anonymous';
        let userId = 'unknown';

        if (req.session.userPhone) {
            userId = req.session.userPhone + '@s.whatsapp.net';
            try {
                userData = await getUser(userId);
                author = userData ? userData.username : req.session.userPhone;
            } catch (error) {
                console.error('Error fetching user data:', error);
                author = req.session.userPhone;
            }
        }

        const newPost = await createPost(userId, author, type || 'text', content, mediaUrl || '');
        res.json({ 
            success: true, 
            message: 'Post created successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create post: ' + error.message 
        });
    }
});

app.post('/api/posts/like', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        const userId = req.session.userPhone ? req.session.userPhone + '@s.whatsapp.net' : 'unknown';
        const result = await likePost(postId, userId);

        res.json(result);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to like post: ' + error.message 
        });
    }
});

app.post('/api/posts/unlike', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        const userId = req.session.userPhone ? req.session.userPhone + '@s.whatsapp.net' : 'unknown';
        const result = await unlikePost(postId, userId);

        res.json(result);
    } catch (error) {
        console.error('Error unliking post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to unlike post: ' + error.message 
        });
    }
});

app.post('/api/posts/comment', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { postId, content } = req.body;

        if (!postId || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID and content are required' 
            });
        }

        let userData = null;
        let author = 'Anonymous';
        const userId = req.session.userPhone ? req.session.userPhone + '@s.whatsapp.net' : 'unknown';

        if (req.session.userPhone) {
            try {
                userData = await getUser(userId);
                author = userData ? userData.username : req.session.userPhone;
            } catch (error) {
                console.error('Error fetching user data:', error);
                author = req.session.userPhone;
            }
        }

        const result = await addComment(postId, userId, author, content);
        res.json(result);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add comment: ' + error.message 
        });
    }
});

app.delete('/api/posts/delete', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }

        // TODO: Add authorization check to ensure user can only delete their own posts
        const result = await deletePost(postId);

        if (!result) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete post: ' + error.message 
        });
    }
});

// User Management API Routes
app.get('/api/users/all', async (req, res) => {
    console.log('🔍 API users/all access attempt');

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner && false) { // Temporarily disabled
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const User = require('./database/models/User');
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch users: ' + error.message 
        });
    }
});

app.put('/api/users/update', async (req, res) => {
    console.log('🔍 API users/update access attempt');

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner && false) { // Temporarily disabled
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { userId, updateData } = req.body;

        if (!userId || !updateData) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and update data are required' 
            });
        }

        const User = require('./database/models/User');
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user: ' + error.message 
        });
    }
});

app.delete('/api/users/delete', async (req, res) => {
    console.log('🔍 API users/delete access attempt');

    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner && false) { // Temporarily disabled
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required' 
            });
        }

        const User = require('./database/models/User');
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user: ' + error.message 
        });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        console.log('✅ User logged out successfully');
        res.redirect('/login');
    });
});

// Handle GET request for logout as well (in case someone accesses it directly)
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        console.log('✅ User logged out successfully');
        res.redirect('/login');
    });
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { balance, chips, xp, level, status } = req.body;

        const User = require('./database/models/User');
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user data
        if (balance !== undefined) user.balance = balance;
        if (chips !== undefined) user.chips = chips;
        if (xp !== undefined) user.xp = xp;
        if (level !== undefined) user.level = level;
        if (status !== undefined) user.status = status;

        await user.save();

        // Get updated user with rank information
        const updatedUser = await User.findById(req.params.id);
        const currentRank = updatedUser.getCurrentRank();

        res.json({ 
            success: true, 
            message: 'User updated successfully',
            user: {
                ...updatedUser.toObject(),
                rank: currentRank
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('🌐 Web server running on http://0.0.0.0:' + PORT);
});

module.exports = { app, setBotInstance, setQRCode };