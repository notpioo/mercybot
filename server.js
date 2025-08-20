const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const QRCode = require('qrcode');
const multer = require('multer');
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

const {
    initBordersTable,
    getAllBorders,
    getBorderById,
    createBorder,
    updateBorder,
    deleteBorder,
    getUserBorders,
    addBorderToUser,
    equipBorder,
    getUserEquippedBorder
} = require('./database/borders');

const {
    initShopTable,
    getAllShopItems,
    getShopItemById,
    createShopItem,
    updateShopItem,
    deleteShopItem,
    purchaseItem,
    getUserPurchaseHistory
} = require('./database/shop');

const {
    initBannersTable,
    getAllBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    getUserBanners,
    addBannerToUser,
    equipBanner,
    getUserEquippedBanner
} = require('./database/banners');

const {
    initFriendsTable,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getUserFriends,
    getPendingRequests,
    getSentRequests,
    getFriendshipStatus,
    searchUsersByUsername,
    removeFriend
} = require('./database/friends');

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

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'borderImage') {
            cb(null, 'public/borders/');
        } else {
            cb(null, 'public/uploads/');
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        if (file.fieldname === 'borderImage') {
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        } else {
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images including GIF for borders and banners
        if (!file.originalname.match(/\.(jpg|jpeg|png|svg|webp|gif)$/i)) {
            req.fileValidationError = 'Only image files are allowed (jpg, jpeg, png, svg, webp, gif)!';
            return cb(new Error('Only image files are allowed (jpg, jpeg, png, svg, webp, gif)!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Increase to 10MB for GIF support
    }
});

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

        // Then initialize announcements, posts, borders, and shop
        await initAnnouncementsTable();
        await initPostsTable();
        await initBordersTable();
        await initShopTable();
        // Initialize banners system
        await initBannersTable();
        // Initialize friends system
        await initFriendsTable();
        // Initialize fishing system
        const { initializeFishingSystem } = require('./database/fishing');
        await initializeFishingSystem();

        console.log('✅ Announcements, Posts, Borders, Banners, Shop, Friends, and Fishing system initialized successfully');
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
    let userBorders = null;
    let equippedBorder = null;
    let equippedBanner = null;

    if (req.session.userPhone) {
        try {
            const userId = req.session.userPhone + '@s.whatsapp.net';
            userData = await getUser(userId);
            const userBorderDoc = await getUserBorders(userId);
            userBorders = userBorderDoc.ownedBorders || [];
            equippedBorder = await getUserEquippedBorder(userId);
            equippedBanner = await getUserEquippedBanner(userId);

            console.log('📋 Profile page user borders:', {
                userId,
                ownedBordersCount: userBorders.length,
                ownedBorders: userBorders,
                equippedBorder: equippedBorder ? equippedBorder.borderId : null,
                equippedBanner: equippedBanner ? equippedBanner.bannerId : null
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    res.render('profile', { 
        user: userData, 
        userBorders: userBorders,
        equippedBorder: equippedBorder,
        equippedBanner: equippedBanner
    });
});

// View other user profile
app.get('/profile/:phoneNumber', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.redirect('/');
    }

    try {
        const { phoneNumber } = req.params;
        const targetUserId = phoneNumber + '@s.whatsapp.net';

        console.log('🔍 Viewing profile for user:', targetUserId);

        // Get target user data
        const targetUser = await getUser(targetUserId);
        if (!targetUser) {
            return res.render('error', { 
                message: 'User not found',
                user: null
            });
        }

        // Get target user borders and banners
        const userBorderDoc = await getUserBorders(targetUserId);
        const userBannerDoc = await getUserBanners(targetUserId);
        const equippedBorder = await getUserEquippedBorder(targetUserId);
        const equippedBanner = await getUserEquippedBanner(targetUserId);

        // Get current user data for navigation
        let currentUser = null;
        if (req.session.userPhone) {
            currentUser = await getUser(req.session.userPhone + '@s.whatsapp.net');
        }

        console.log('📋 Other user profile page data:', {
            targetUserId,
            targetUsername: targetUser.username,
            ownedBordersCount: userBorderDoc.ownedBorders ? userBorderDoc.ownedBorders.length : 0,
            ownedBannersCount: userBannerDoc.ownedBanners ? userBannerDoc.ownedBanners.length : 0,
            equippedBorder: equippedBorder ? equippedBorder.borderId : null,
            equippedBanner: equippedBanner ? equippedBanner.bannerId : null
        });

        res.render('user-profile', { 
            targetUser: targetUser,
            user: currentUser, // Current logged in user for navigation
            userBorders: userBorderDoc.ownedBorders || [],
            equippedBorder: equippedBorder,
            equippedBanner: equippedBanner,
            isOwnProfile: false
        });

    } catch (error) {
        console.error('❌ Error viewing other user profile:', error);
        res.render('error', { 
            message: 'Error loading user profile',
            user: null
        });
    }
});

// API to get available borders for user
app.get('/api/borders/available', async (req, res) => {
    console.log('🔍 API borders/available request received');
    console.log('🔍 Session authenticated:', req.session.isAuthenticated);
    console.log('🔍 Session owner:', req.session.isOwner);
    console.log('🔍 User phone:', req.session.userPhone);

    if (!req.session.isAuthenticated && !req.session.isOwner) {
        console.log('❌ Access denied - not authenticated');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';
        console.log('👤 Processing for userId:', userId);

        // Get all borders first
        console.log('🎨 Fetching all borders...');
        const allBorders = await getAllBorders();
        console.log('✅ All borders received, count:', allBorders.length);

        if (!allBorders || allBorders.length === 0) {
            console.log('⚠️ No borders available in database');
            return res.json({ 
                success: true, 
                borders: [],
                userBorders: [],
                equippedBorder: null,
                message: 'No borders available'
            });
        }

        // Get user's borders
        console.log('📦 Fetching user borders...');
        const userBorderDoc = await getUserBorders(userId);
        console.log('✅ User border doc received:', {
            userId: userBorderDoc.userId,
            ownedCount: userBorderDoc.ownedBorders ? userBorderDoc.ownedBorders.length : 0,
            equipped: userBorderDoc.equippedBorder
        });

        const responseData = {
            success: true,
            borders: allBorders,
            userBorders: userBorderDoc.ownedBorders || [],
            equippedBorder: userBorderDoc.equippedBorder || null,
            meta: {
                userId,
                totalBorders: allBorders.length,
                ownedBorders: userBorderDoc.ownedBorders ? userBorderDoc.ownedBorders.length : 0
            }
        };

        console.log('📊 Available borders API response:', {
            success: responseData.success,
            bordersCount: responseData.borders.length,
            userBordersCount: responseData.userBorders.length,
            equipped: responseData.equippedBorder
        });

        res.json(responseData);
    } catch (error) {
        console.error('❌ Error fetching available borders:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch borders: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// API to equip border
app.post('/api/borders/equip', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { borderId } = req.body;
        const userId = req.session.userPhone + '@s.whatsapp.net';

        if (!borderId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Border ID is required' 
            });
        }

        console.log('🎯 Equipping border:', { userId, borderId });

        // Get user's border document
        const { UserBorder } = require('./database/borders');
        let userBorderDoc = await UserBorder.findOne({ userId });

        if (!userBorderDoc) {
            userBorderDoc = new UserBorder({
                userId,
                ownedBorders: [{ borderId: 'default' }],
                equippedBorder: null
            });
            await userBorderDoc.save();
        }

        // Check if user owns this border (default border is always available)
        const hasBorder = borderId === 'default' || userBorderDoc.ownedBorders.some(border => border.borderId === borderId);

        if (!hasBorder) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not own this border' 
            });
        }

        // Update equipped border
        userBorderDoc.equippedBorder = borderId;
        userBorderDoc.updatedAt = new Date();
        await userBorderDoc.save();

        console.log('✅ Border equipped successfully:', borderId);

        res.json({ 
            success: true, 
            message: 'Border equipped successfully',
            equippedBorder: borderId
        });
    } catch (error) {
        console.error('❌ Error equipping border:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to equip border: ' + error.message 
        });
    }
});

// API to remove equipped border
app.post('/api/borders/remove', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';
        const result = await equipBorder(userId, null);

        if (result) {
            res.json({ 
                success: true, 
                message: 'Border removed successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to remove border' 
            });
        }
    } catch (error) {
        console.error('Error removing border:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove border' 
        });
    }
});

// API to grant border to user (owner only)
app.post('/api/borders/grant', async (req, res) => {
    if (!req.session.isOwner) {
        return res.status(403).json({ success: false, message: 'Owner access required' });
    }

    try {
        const { userId, borderId } = req.body;

        if (!userId || !borderId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and Border ID are required' 
            });
        }

        const result = await addBorderToUser(userId, borderId);

        if (result) {
            res.json({ 
                success: true, 
                message: 'Border granted successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to grant border' 
            });
        }
    } catch (error) {
        console.error('Error granting border:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to grant border' 
        });
    }
});

// ===== BANNER MANAGEMENT ROUTES =====

// Banner Manager Page (Owner only)
app.get('/banner-manager', async (req, res) => {
    console.log('🔍 Banner Manager access attempt');
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
        console.log('❌ Access denied to banner-manager - not owner');
        return res.redirect('/');
    }

    console.log('✅ Access granted to banner-manager');
    res.render('banner-manager', { user: userData });
});

// API Routes for Banner Management

// Get all borders (public access for displaying in user profiles)
app.get('/api/borders/all', async (req, res) => {
    try {
        const borders = await getAllBorders();
        res.json({ 
            success: true, 
            borders: borders 
        });
    } catch (error) {
        console.error('Error fetching borders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch borders' 
        });
    }
});

// Get all banners
app.get('/api/banners/all', async (req, res) => {
    try {
        const banners = await getAllBanners();
        res.json({ 
            success: true, 
            banners: banners 
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch banners' 
        });
    }
});

// Get banners available to a user
app.get('/api/banners/available', async (req, res) => {
    console.log('🔍 API banners/available request received');
    console.log('🔍 Session authenticated:', req.session.isAuthenticated);
    console.log('🔍 Session owner:', req.session.isOwner);
    console.log('🔍 User phone:', req.session.userPhone);

    if (!req.session.isAuthenticated && !req.session.isOwner) {
        console.log('❌ Access denied - not authenticated');
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        let userId = null;
        if (req.session.userPhone) {
            userId = req.session.userPhone + '@s.whatsapp.net';
            console.log('👤 Processing for userId:', userId);
        }

        console.log('🖼️ Fetching all banners...');
        const allBanners = await getAllBanners();
        console.log('✅ All banners received, count:', allBanners.length);

        if (!userId) {
            // No user context, return all banners without ownership info
            return res.json({ 
                success: true, 
                banners: allBanners.map(banner => ({
                    ...banner._doc || banner,
                    isOwned: false,
                    isEquipped: false
                }))
            });
        }

        console.log('📦 Fetching user banners...');
        const userBanners = await getUserBanners(userId);
        console.log('✅ User banner doc received:', {
            userId: userBanners.userId,
            ownedCount: userBanners.ownedBanners?.length || 0,
            equipped: userBanners.equippedBanner
        });

        // Map user ownership status to banners
        const bannersWithOwnership = allBanners.map(banner => {
            const bannerData = banner._doc || banner;
            const isOwned = userBanners.ownedBanners?.some(ub => ub.bannerId === bannerData.bannerId) || false;
            const isEquipped = userBanners.equippedBanner === bannerData.bannerId;

            return {
                ...bannerData,
                isOwned,
                isEquipped
            };
        });

        console.log('📊 Available banners API response:', {
            success: true,
            bannersCount: bannersWithOwnership.length,
            userBannersCount: userBanners.ownedBanners?.length || 0,
            equipped: userBanners.equippedBanner
        });

        res.json({ 
            success: true, 
            banners: bannersWithOwnership,
            userBanners: userBanners
        });
    } catch (error) {
        console.error('❌ Error fetching available banners:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch banners: ' + error.message 
        });
    }
});

// Create new banner (owner only)
app.post('/api/banners/create', upload.single('bannerImage'), async (req, res) => {
    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Owner access required' });
    }

    try {
        const { bannerId, name, description, rarity } = req.body;

        if (!bannerId || !name || !rarity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Banner ID, name, and rarity are required' 
            });
        }

        // Check if banner ID already exists
        const existingBanner = await getBannerById(bannerId);
        if (existingBanner) {
            return res.status(400).json({ 
                success: false, 
                message: 'Banner ID already exists' 
            });
        }

        let imageUrl = '/banners/default-gradient.svg'; // Default banner

        // Handle file upload
        if (req.file) {
            const fileExtension = path.extname(req.file.originalname);
            const fileName = `${bannerId}${fileExtension}`;
            const uploadPath = path.join(__dirname, 'public', 'banners', fileName);

            // Move uploaded file using fs.copyFileSync instead of writeFileSync with buffer
            const fs = require('fs');

            // Ensure banners directory exists
            const bannersDir = path.join(__dirname, 'public', 'banners');
            if (!fs.existsSync(bannersDir)) {
                fs.mkdirSync(bannersDir, { recursive: true });
            }

            // Copy file from temp location to banners directory
            fs.copyFileSync(req.file.path, uploadPath);
            imageUrl = `/banners/${fileName}`;
        }

        const bannerData = {
            bannerId,
            name,
            description,
            imageUrl,
            rarity,
            createdBy: 'admin'
        };

        const newBanner = await createBanner(bannerData);

        if (newBanner) {
            res.json({ 
                success: true, 
                message: 'Banner created successfully',
                banner: newBanner
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to create banner' 
            });
        }
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create banner: ' + error.message 
        });
    }
});

// Update banner (owner only)
app.put('/api/banners/update/:bannerId', upload.single('bannerImage'), async (req, res) => {
    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Owner access required' });
    }

    try {
        const { bannerId } = req.params;
        const { name, description, rarity } = req.body;

        if (!name || !rarity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and rarity are required' 
            });
        }

        const updateData = {
            name,
            description,
            rarity
        };

        // Handle file upload if provided
        if (req.file) {
            const fileExtension = path.extname(req.file.originalname);
            const fileName = `${bannerId}${fileExtension}`;
            const uploadPath = path.join(__dirname, 'public', 'banners', fileName);

            // Move uploaded file using fs.copyFileSync instead of writeFileSync with buffer
            const fs = require('fs');

            // Ensure banners directory exists
            const bannersDir = path.join(__dirname, 'public', 'banners');
            if (!fs.existsSync(bannersDir)) {
                fs.mkdirSync(bannersDir, { recursive: true });
            }

            // Copy file from temp location to banners directory
            fs.copyFileSync(req.file.path, uploadPath);
            updateData.imageUrl = `/banners/${fileName}`;
        }

        const updatedBanner = await updateBanner(bannerId, updateData);

        if (updatedBanner) {
            res.json({ 
                success: true, 
                message: 'Banner updated successfully',
                banner: updatedBanner
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Banner not found' 
            });
        }
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update banner: ' + error.message 
        });
    }
});

// Delete banner (owner only)
app.delete('/api/banners/delete/:bannerId', async (req, res) => {
    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Owner access required' });
    }

    try {
        const { bannerId } = req.params;

        const deletedBanner = await deleteBanner(bannerId);

        if (deletedBanner) {
            res.json({ 
                success: true, 
                message: 'Banner deleted successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Banner not found' 
            });
        }
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete banner' 
        });
    }
});

// Equip banner for user
app.post('/api/banners/equip', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { bannerId } = req.body;
        const userId = req.session.userPhone + '@s.whatsapp.net';

        const result = await equipBanner(userId, bannerId);

        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Banner equipped successfully' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: result.message 
            });
        }
    } catch (error) {
        console.error('Error equipping banner:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to equip banner' 
        });
    }
});

// Remove equipped banner (set to null)
app.post('/api/banners/remove', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';

        const result = await equipBanner(userId, 'default');

        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Banner removed successfully' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: result.message 
            });
        }
    } catch (error) {
        console.error('Error removing banner:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove banner' 
        });
    }
});

// API to grant banner to user (owner only)
app.post('/api/banners/grant', async (req, res) => {
    let userData = null;
    if (req.session.userPhone) {
        try {
            userData = await getUser(req.session.userPhone + '@s.whatsapp.net');
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const isOwner = req.session.isOwner || (userData && userData.status === 'owner');

    if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Owner access required' });
    }

    try {
        const { userId, bannerId } = req.body;

        if (!userId || !bannerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and Banner ID are required' 
            });
        }

        const result = await addBannerToUser(userId, bannerId);

        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Banner granted successfully' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: result.message 
            });
        }
    } catch (error) {
        console.error('Error granting banner:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to grant banner' 
        });
    }
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

// Border Manager Route
app.get('/owner/border-manager', async (req, res) => {
    console.log('🔍 Border Manager access attempt');

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
        console.log('❌ Access denied to border-manager - not owner');
        return res.redirect('/');
    }

    // Get all borders from database
    let borders = [];
    try {
        borders = await getAllBorders();
    } catch (error) {
        console.error('Error fetching borders:', error);
    }

    console.log('✅ Access granted to border-manager');
    res.render('border-manager', { user: userData, borders, isOwner: true });
});

// Shop Manager Route
app.get('/owner/shop-manager', async (req, res) => {
    console.log('🔍 Shop Manager access attempt');

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
        console.log('❌ Access denied to shop-manager - not owner');
        return res.redirect('/');
    }

    console.log('✅ Access granted to shop-manager');
    res.render('shop-manager', { user: userData, isOwner: true });
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

// Additional upload configuration for posts
const postUpload = multer({ 
    storage: multer.diskStorage({
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
    }),
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
app.post('/api/upload', postUpload.single('file'), (req, res) => {
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

// Fish Management Route
// Redirect short URL to full path
app.get('/fish-manager', (req, res) => {
    res.redirect('/owner/fish-manager');
});

app.get('/owner/fish-manager', async (req, res) => {
    console.log('🔍 Fish Manager access attempt');
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
        console.log('❌ Access denied to fish-manager - not owner');
        return res.redirect('/');
    }

    console.log('✅ Access granted to fish-manager');
    res.render('fish-manager', { user: userData, isOwner: true });
});

// Fish Management API Endpoints
const fishingConfig = require('./config/fishingConfig');
const { getFishingUser, updateFishingUser, deleteFishingUser, getAllFishingUsers } = require('./database/fishing');

// Get all rods
app.get('/api/fishing/rod', async (req, res) => {
    try {
        const rods = Object.values(fishingConfig.rods).map(rod => ({
            id: rod.id,
            name: rod.name,
            rarity: rod.rarity,
            price: rod.price,
            rarityBonus: rod.rarityBonus,
            durability: rod.fishCount
        }));

        res.json({ success: true, data: rods });
    } catch (error) {
        console.error('Error fetching rods:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all baits
app.get('/api/fishing/bait', async (req, res) => {
    try {
        const baits = Object.values(fishingConfig.baits).map(bait => ({
            id: bait.id,
            name: bait.name,
            rarity: bait.rarity,
            price: bait.price,
            catchRate: bait.rarityBonus,
            quantity: bait.quantity || 1,
            uses: bait.uses || 10
        }));

        res.json({ success: true, data: baits });
    } catch (error) {
        console.error('Error fetching baits:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all fish
app.get('/api/fishing/fish', async (req, res) => {
    try {
        const fish = Object.values(fishingConfig.fish).map(f => ({
            id: f.id,
            name: f.name,
            rarity: f.rarity,
            basePrice: f.basePrice,
            minWeight: f.minWeight,
            maxWeight: f.maxWeight
        }));

        res.json({ success: true, data: fish });
    } catch (error) {
        console.error('Error fetching fish:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get specific item by type and id
app.get('/api/fishing/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        let item = null;

        if (type === 'rod' && fishingConfig.rods[id]) {
            const rod = fishingConfig.rods[id];
            item = {
                id: rod.id,
                name: rod.name,
                rarity: rod.rarity,
                price: rod.price,
                rarityBonus: rod.rarityBonus,
                durability: rod.fishCount
            };
        } else if (type === 'bait' && fishingConfig.baits[id]) {
            const bait = fishingConfig.baits[id];
            item = {
                id: bait.id,
                name: bait.name,
                rarity: bait.rarity,
                price: bait.price,
                catchRate: bait.rarityBonus,
                quantity: bait.quantity || 1,
                uses: bait.uses || 10
            };
        } else if (type === 'fish' && fishingConfig.fish[id]) {
            const fish = fishingConfig.fish[id];
            item = {
                id: fish.id,
                name: fish.name,
                rarity: fish.rarity,
                basePrice: fish.basePrice,
                minWeight: fish.minWeight,
                maxWeight: fish.maxWeight
            };
        }

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new item
app.post('/api/fishing/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;

        // Generate ID from name
        const id = data.name.toLowerCase().replace(/\s+/g, '');

        if (type === 'rod') {
            fishingConfig.rods[id] = {
                id: id,
                name: data.name,
                rarity: data.rarity.toLowerCase(),
                price: data.price,
                fishCount: data.durability,
                rarityBonus: data.rarityBonus,
                emoji: '🎣'
            };
        } else if (type === 'bait') {
            fishingConfig.baits[id] = {
                id: id,
                name: data.name,
                rarity: data.rarity.toLowerCase(),
                price: data.price,
                quantity: data.quantity || 1,
                rarityBonus: data.catchRate,
                uses: data.uses,
                emoji: '🪱'
            };
        } else if (type === 'fish') {
            fishingConfig.fish[id] = {
                id: id,
                name: data.name,
                rarity: data.rarity.toLowerCase(),
                basePrice: data.basePrice,
                minWeight: data.minWeight,
                maxWeight: data.maxWeight,
                emoji: '🐟'
            };
        }

        // Save to file
        await saveFishingConfig();

        res.json({ success: true, message: 'Item added successfully' });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update item
app.put('/api/fishing/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = req.body;

        if (type === 'rod' && fishingConfig.rods[id]) {
            fishingConfig.rods[id] = {
                ...fishingConfig.rods[id],
                name: data.name,
                rarity: data.rarity.toLowerCase(),
                price: data.price,
                fishCount: data.durability,
                rarityBonus: data.rarityBonus
            };
        } else if (type === 'bait' && fishingConfig.baits[id]) {
            fishingConfig.baits[id] = {
                ...fishingConfig.baits[id],
                name: data.name,
                rarity: data.rarity.toLowerCase(),
                price: data.price,
                quantity: data.quantity || 1,
                rarityBonus: data.catchRate,
                uses: data.uses
            };
        } else if (type === 'fish' && fishingConfig.fish[id]) {
            fishingConfig.fish[id] = {
                ...fishingConfig.fish[id],
                name: data.name,
                rarity: data.rarity.toLowerCase(),
                basePrice: data.basePrice,
                minWeight: data.minWeight,
                maxWeight: data.maxWeight
            };
        } else {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Save to file
        await saveFishingConfig();

        res.json({ success: true, message: 'Item updated successfully' });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete item
app.delete('/api/fishing/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;

        if (type === 'rod' && fishingConfig.rods[id]) {
            delete fishingConfig.rods[id];
        } else if (type === 'bait' && fishingConfig.baits[id]) {
            delete fishingConfig.baits[id];
        } else if (type === 'fish' && fishingConfig.fish[id]) {
            delete fishingConfig.fish[id];
        } else {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Save to file
        await saveFishingConfig();

        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Function to save fishing config to file
async function saveFishingConfig() {
    const fs = require('fs').promises;
    const path = require('path');

    const configPath = path.join(__dirname, 'config', 'fishingConfig.js');
    const configContent = `// Fishing Game Configuration
const fishingConfig = ${JSON.stringify(fishingConfig, null, 4).replace(/"([^"]+)":/g, '$1:')};

module.exports = fishingConfig;`;

    await fs.writeFile(configPath, configContent, 'utf8');
}

// User Fishing Management API Endpoints

// Get all fishing users
app.get('/api/fishing/user', async (req, res) => {
    try {
        const { FishingUser } = require('./database/fishing');
        const User = require('./database/models/User');

        console.log('🔍 Fetching all fishing users...');

        // Get all fishing users
        const fishingUsers = await FishingUser.find().sort({ totalFish: -1 }).lean();
        console.log('📊 Found fishing users:', fishingUsers.length);

        // Get corresponding user data for each fishing user
        const usersWithData = await Promise.all(fishingUsers.map(async (fishingUser) => {
            try {
                console.log(`🔍 Processing fishing user: ${fishingUser.userId}`);

                // Handle both @lid and @s.whatsapp.net formats
                let phoneNumber;
                if (fishingUser.userId.includes('@lid')) {
                    phoneNumber = fishingUser.userId.replace('@lid', '');
                } else {
                    phoneNumber = fishingUser.userId.replace('@s.whatsapp.net', '');
                }

                // Try to find user data by both formats
                let userData = await User.findOne({ userId: fishingUser.userId }).lean();
                if (!userData && fishingUser.userId.includes('@lid')) {
                    // Try finding with @s.whatsapp.net format
                    const whatsappUserId = phoneNumber + '@s.whatsapp.net';
                    userData = await User.findOne({ userId: whatsappUserId }).lean();
                }

                console.log(`👤 Found user data for ${fishingUser.userId}:`, userData ? {
                    username: userData.username,
                    reelCoin: userData.reelCoin
                } : 'Not found');

                const username = userData ? (userData.username || `User${phoneNumber.slice(-4)}`) : `User${phoneNumber.slice(-4)}`;

                return {
                    _id: fishingUser._id,
                    phoneNumber: phoneNumber,
                    username: username,
                    reelCoins: userData ? (userData.reelCoin || 0) : 0,
                    level: fishingUser.level || 1,
                    totalIncome: fishingUser.totalEarnings || 0,
                    totalFish: fishingUser.totalFish || 0,
                    catches: fishingUser.inventory?.fish?.reduce((acc, fish) => {
                        acc[fish.fishId] = fish.quantity;
                        return acc;
                    }, {}) || {},
                    equipment: {
                        rod: fishingUser.currentRod || 'wood',
                        bait: fishingUser.currentBait || 'worm'
                    }
                };
            } catch (error) {
                console.error(`❌ Error processing fishing user ${fishingUser.userId}:`, error);
                let phoneNumber;
                if (fishingUser.userId.includes('@lid')) {
                    phoneNumber = fishingUser.userId.replace('@lid', '');
                } else {
                    phoneNumber = fishingUser.userId.replace('@s.whatsapp.net', '');
                }

                return {
                    _id: fishingUser._id,
                    phoneNumber: phoneNumber,
                    username: `User${phoneNumber.slice(-4)}`,
                    reelCoins: 0,
                    level: fishingUser.level || 1,
                    totalIncome: fishingUser.totalEarnings || 0,
                    totalFish: fishingUser.totalFish || 0,
                    catches: {},
                    equipment: {
                        rod: fishingUser.currentRod || 'wood',
                        bait: fishingUser.currentBait || 'worm'
                    }
                };
            }
        }));

        console.log('✅ Processed users with data:', usersWithData.length);
        res.json({ success: true, data: usersWithData });
    } catch (error) {
        console.error('❌ Error fetching fishing users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get specific fishing user
app.get('/api/fishing/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { FishingUser } = require('./database/fishing');
        const User = require('./database/models/User');

        console.log('🔍 Getting fishing user by ID:', id);

        const fishingUser = await FishingUser.findById(id).lean();
        if (!fishingUser) {
            console.log('❌ Fishing user not found:', id);
            return res.status(404).json({ success: false, message: 'Fishing user not found' });
        }

        console.log('✅ Found fishing user:', fishingUser.userId);

        // Get main user data
        const phoneNumber = fishingUser.userId.replace('@s.whatsapp.net', '').replace('@lid', '');
        let userData = await User.findOne({ userId: fishingUser.userId }).lean();

        // Try alternative format if not found
        if (!userData && fishingUser.userId.includes('@lid')) {
            const whatsappUserId = phoneNumber + '@s.whatsapp.net';
            userData = await User.findOne({ userId: whatsappUserId }).lean();
            console.log('🔄 Trying alternative format:', whatsappUserId, userData ? 'Found' : 'Not found');
        }

        const username = userData ? (userData.username || `User${phoneNumber.slice(-4)}`) : `User${phoneNumber.slice(-4)}`;

        const userWithData = {
            _id: fishingUser._id.toString(), // Ensure string ID
            userId: fishingUser.userId, // Add original userId
            phoneNumber: phoneNumber,
            username: username,
            reelCoins: userData ? (userData.reelCoin || 0) : 0,
            level: fishingUser.level || 1,
            totalIncome: fishingUser.totalEarnings || 0,
            totalFish: fishingUser.totalFish || 0,
            currentRod: fishingUser.currentRod || 'wood',
            currentBait: fishingUser.currentBait || 'worm',
            catches: fishingUser.inventory?.fish?.reduce((acc, fish) => {
                acc[fish.fishId] = fish.quantity;
                return acc;
            }, {}) || {},
            equipment: {
                rod: fishingUser.currentRod || 'wood',
                bait: fishingUser.currentBait || 'worm'
            }
        };

        console.log('✅ Returning complete user data:', {
            id: userWithData._id,
            username: userWithData.username,
            phoneNumber: userWithData.phoneNumber,
            reelCoins: userWithData.reelCoins
        });

        res.json({ success: true, user: userWithData });
    } catch (error) {
        console.error('❌ Error fetching fishing user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update fishing user
app.put('/api/fishing/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const { FishingUser } = require('./database/fishing');
        const User = require('./database/models/User');

        console.log('🔄 Updating fishing user:', id);
        console.log('📝 Update data:', updateData);

        // Get fishing user
        const fishingUser = await FishingUser.findById(id);
        if (!fishingUser) {
            console.log('❌ Fishing user not found:', id);
            return res.status(404).json({ success: false, message: 'Fishing user not found' });
        }

        console.log('✅ Found fishing user:', fishingUser.userId);

        // Update fishing user data
        const fishingUpdateFields = {};
        if (updateData.level !== undefined) fishingUpdateFields.level = parseInt(updateData.level);
        if (updateData.totalIncome !== undefined) fishingUpdateFields.totalEarnings = parseInt(updateData.totalIncome);
        if (updateData.currentRod) fishingUpdateFields.currentRod = updateData.currentRod;
        if (updateData.currentBait) fishingUpdateFields.currentBait = updateData.currentBait;
        if (updateData.equipment?.rod) fishingUpdateFields.currentRod = updateData.equipment.rod;
        if (updateData.equipment?.bait) fishingUpdateFields.currentBait = updateData.equipment.bait;

        console.log('🔄 Updating fishing fields:', fishingUpdateFields);

        await FishingUser.findByIdAndUpdate(id, { $set: fishingUpdateFields });

        // Update User model for ReelCoin
        if (updateData.reelCoins !== undefined) {
            const reelCoins = parseInt(updateData.reelCoins);
            console.log('💰 Updating reelCoins:', reelCoins);

            let userData = await User.findOneAndUpdate(
                { userId: fishingUser.userId },
                { $set: { reelCoin: reelCoins } },
                { new: true }
            );

            // Try alternative format if not found
            if (!userData && fishingUser.userId.includes('@lid')) {
                const phoneNumber = fishingUser.userId.replace('@lid', '');
                const whatsappUserId = phoneNumber + '@s.whatsapp.net';
                userData = await User.findOneAndUpdate(
                    { userId: whatsappUserId },
                    { $set: { reelCoin: reelCoins } },
                    { new: true }
                );
                console.log('🔄 Updated alternative format user:', whatsappUserId);
            }
        }

        // Return updated data
        const updatedFishingUser = await FishingUser.findById(id).lean();
        let userData = await User.findOne({ userId: fishingUser.userId }).lean();

        // Try alternative format if not found
        if (!userData && fishingUser.userId.includes('@lid')) {
            const phoneNumber = fishingUser.userId.replace('@lid', '');
            const whatsappUserId = phoneNumber + '@s.whatsapp.net';
            userData = await User.findOne({ userId: whatsappUserId }).lean();
        }

        const phoneNumber = fishingUser.userId.replace('@s.whatsapp.net', '').replace('@lid', '');
        const username = userData ? (userData.username || `User${phoneNumber.slice(-4)}`) : `User${phoneNumber.slice(-4)}`;

        const responseData = {
            _id: updatedFishingUser._id.toString(),
            userId: updatedFishingUser.userId,
            phoneNumber: phoneNumber,
            username: username,
            reelCoins: userData ? (userData.reelCoin || 0) : 0,
            level: updatedFishingUser.level || 1,
            totalIncome: updatedFishingUser.totalEarnings || 0,
            totalFish: updatedFishingUser.totalFish || 0,
            currentRod: updatedFishingUser.currentRod || 'wood',
            currentBait: updatedFishingUser.currentBait || 'worm',
            equipment: {
                rod: updatedFishingUser.currentRod || 'wood',
                bait: updatedFishingUser.currentBait || 'worm'
            }
        };

        console.log('✅ Update successful, returning:', {
            id: responseData._id,
            username: responseData.username,
            reelCoins: responseData.reelCoins
        });

        res.json({ success: true, user: responseData });
    } catch (error) {
        console.error('❌ Error updating fishing user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete fishing user
app.delete('/api/fishing/user/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await deleteFishingUser(id);

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User fishing data deleted successfully' });
    } catch (error) {
        console.error('Error deleting fishing user:', error);
        res.status(500).json({ success: false, message: error.message });
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

// Border API Routes
// Get all borders
app.get('/api/borders', async (req, res) => {
    try {
        const borders = await getAllBorders();
        res.json({ success: true, data: borders });
    } catch (error) {
        console.error('Error fetching borders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch borders' });
    }
});

// Get single border
app.get('/api/borders/:id', async (req, res) => {
    try {
        const border = await getBorderById(req.params.id);
        if (!border) {
            return res.status(404).json({ success: false, message: 'Border not found' });
        }
        res.json({ success: true, data: border });
    } catch (error) {
        console.error('Error fetching border:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch border' });
    }
});

// Create new border
app.post('/api/borders', upload.single('borderImage'), async (req, res) => {
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
        const { borderId, name, description, rarity } = req.body;

        if (!borderId || !name || !req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Border ID, name, and image are required' 
            });
        }

        // Check if border ID already exists
        const existingBorder = await getBorderById(borderId);
        if (existingBorder) {
            return res.status(409).json({ 
                success: false, 
                message: 'Border ID already exists' 
            });
        }

        const borderData = {
            borderId,
            name,
            description: description || '',
            rarity: rarity || 'common',
            imageUrl: `/borders/${req.file.filename}`,
            createdBy: userData ? userData.userId : 'unknown'
        };

        const newBorder = await createBorder(borderData);

        if (!newBorder) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to create border' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Border created successfully',
            data: newBorder
        });
    } catch (error) {
        console.error('Error creating border:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create border: ' + error.message 
        });
    }
});

// Update border
app.put('/api/borders/:id', upload.single('borderImage'), async (req, res) => {
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
        const originalBorderId = req.params.id;
        const { borderId, name, description, rarity } = req.body;

        const updateData = {
            borderId: borderId || originalBorderId,
            name,
            description: description || '',
            rarity: rarity || 'common'
        };

        // If new image is uploaded, update the image URL
        if (req.file) {
            updateData.imageUrl = `/borders/${req.file.filename}`;
        }

        const updatedBorder = await updateBorder(originalBorderId, updateData);

        if (!updatedBorder) {
            return res.status(404).json({ 
                success: false, 
                message: 'Border not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Border updated successfully',
            data: updatedBorder
        });
    } catch (error) {
        console.error('Error updating border:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update border: ' + error.message 
        });
    }
});

// Delete border
app.delete('/api/borders/:id', async (req, res) => {
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
        const borderId = req.params.id;

        // Prevent deletion of default border
        if (borderId === 'default') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete default border' 
            });
        }

        const deletedBorder = await deleteBorder(borderId);

        if (!deletedBorder) {
            return res.status(404).json({ 
                success: false, 
                message: 'Border not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Border deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting border:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete border: ' + error.message 
        });
    }
});

// Quick fix border image URL
app.patch('/api/borders/:id/image', async (req, res) => {
    try {
        const borderId = req.params.id;
        const { imageUrl } = req.body;

        console.log(`🔧 Updating border ${borderId} image to:`, imageUrl);

        const { updateBorder } = require('./database/borders');
        const result = await updateBorder(borderId, { imageUrl });

        console.log('✅ Border image updated:', result);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fixing border image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// User Border Management APIs
// Get user's borders
app.get('/api/user/borders', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';
        const userBorders = await getUserBorders(userId);
        const allBorders = await getAllBorders();

        // Get border details for owned borders
        const ownedBordersWithDetails = await Promise.all(
            userBorders.ownedBorders.map(async (ownedBorder) => {
                const borderDetails = await getBorderById(ownedBorder.borderId);
                return {
                    ...borderDetails.toObject(),
                    obtainedAt: ownedBorder.obtainedAt
                };
            })
        );

        res.json({ 
            success: true, 
            data: {
                ownedBorders: ownedBordersWithDetails,
                equippedBorder: userBorders.equippedBorder,
                allBorders
            }
        });
    } catch (error) {
        console.error('Error fetching user borders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch borders' });
    }
});

// Equip border
app.post('/api/user/equip-border', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { borderId } = req.body;
        const userId = req.session.userPhone + '@s.whatsapp.net';

        const result = await equipBorder(userId, borderId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error equipping border:', error);
        res.status(500).json({ success: false, message: 'Failed to equip border' });
    }
});

// Add border to user (admin only)
app.post('/api/user/:userId/add-border', async (req, res) => {
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
        const { userId } = req.params;
        const { borderId } = req.body;

        const result = await addBorderToUser(userId, borderId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error adding border to user:', error);
        res.status(500).json({ success: false, message: 'Failed to add border' });
    }
});

// Shop API Routes
// Get all shop items (visible only for public shop)
app.get('/api/shop/items', async (req, res) => {
    try {
        const items = await getAllShopItems();
        res.json({ success: true, items });
    } catch (error) {
        console.error('Error fetching shop items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shop items' });
    }
});

// Get all shop items including hidden ones (for shop manager)
app.get('/api/shop/items/all', async (req, res) => {
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
        const { ShopItem } = require('./database/shop');
        const items = await ShopItem.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        console.error('Error fetching all shop items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch all shop items' });
    }
});

// Create new shop item (owner only)
app.post('/api/shop/items/add', upload.single('imageFile'), async (req, res) => {
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
        const { name, description, category, price, priceType, stock, purchaseLimit, maxPurchases, linkedBorderId, linkedBannerId, itemLabel, isVisible } = req.body;

        if (!name || !category || !price || !priceType || !stock) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, category, price, priceType, and stock are required' 
            });
        }

        const itemData = {
            name,
            description: description || '',
            category,
            price: parseInt(price),
            priceType,
            stock: parseInt(stock),
            purchaseLimit: purchaseLimit || 'unlimited',
            maxPurchases: purchaseLimit === 'custom' ? parseInt(maxPurchases) || 0 : 0,
            linkedBorderId: category === 'border' ? linkedBorderId : null,
            linkedBannerId: category === 'banner' ? linkedBannerId : null,
            itemLabel: itemLabel || 'normal',
            isVisible: isVisible !== undefined ? isVisible === 'true' : true,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
            createdBy: userData ? userData.userId : 'unknown'
        };

        const newItem = await createShopItem(itemData);

        if (!newItem) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to create shop item' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Shop item created successfully',
            item: newItem
        });
    } catch (error) {
        console.error('Error creating shop item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create shop item: ' + error.message 
        });
    }
});

// Update shop item (owner only)
app.post('/api/shop/items/update', upload.single('imageFile'), async (req, res) => {
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
        const { itemId, name, description, category, price, priceType, stock, purchaseLimit, maxPurchases, linkedBorderId, linkedBannerId, itemLabel, isVisible } = req.body;

        if (!itemId || !name || !category || !price || !priceType || !stock) {
            return res.status(400).json({ 
                success: false, 
                message: 'ItemId, name, category, price, priceType, and stock are required' 
            });
        }

        const updateData = {
            name,
            description: description || '',
            category,
            price: parseInt(price),
            priceType,
            stock: parseInt(stock),
            purchaseLimit: purchaseLimit || 'unlimited',
            maxPurchases: purchaseLimit === 'custom' ? parseInt(maxPurchases) || 0 : 0,
            linkedBorderId: category === 'border' ? linkedBorderId : null,
            linkedBannerId: category === 'banner' ? linkedBannerId : null,
            itemLabel: itemLabel || 'normal',
            isVisible: isVisible !== undefined ? isVisible === 'true' : true
        };

        // If new image is uploaded, update the image URL
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedItem = await updateShopItem(itemId, updateData);

        if (!updatedItem) {
            return res.status(404).json({ 
                success: false, 
                message: 'Shop item not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Shop item updated successfully',
            item: updatedItem
        });
    } catch (error) {
        console.error('Error updating shop item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update shop item: ' + error.message 
        });
    }
});

// Delete shop item (owner only)
// Get available borders for shop manager
app.get('/api/borders/available', async (req, res) => {
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
        const borders = await getAllBorders();
        res.json({ 
            success: true, 
            borders: borders 
        });
    } catch (error) {
        console.error('Error fetching borders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch borders: ' + error.message 
        });
    }
});

app.delete('/api/shop/items/delete', async (req, res) => {
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
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ItemId is required' 
            });
        }

        const deletedItem = await deleteShopItem(itemId);

        if (!deletedItem) {
            return res.status(404).json({ 
                success: false, 
                message: 'Shop item not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Shop item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting shop item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete shop item: ' + error.message 
        });
    }
});

// Purchase item
app.post('/api/shop/purchase', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { itemId } = req.body;
        const userId = req.session.userPhone + '@s.whatsapp.net';

        if (!itemId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Item ID is required' 
            });
        }

        const result = await purchaseItem(userId, itemId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error purchasing item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to purchase item: ' + error.message 
        });
    }
});

// Get user purchase history
app.get('/api/shop/history', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';
        const history = await getUserPurchaseHistory(userId);

        res.json({ 
            success: true, 
            history 
        });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch purchase history' 
        });
    }
});

// Friends API Routes
// Search users for friends
app.get('/api/friends/search', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { q } = req.query;
        const currentUserId = req.session.userPhone + '@s.whatsapp.net';

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }

        const users = await searchUsersByUsername(q.trim(), currentUserId, 10);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Failed to search users' });
    }
});

// Send friend request
app.post('/api/friends/request', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { recipientUserId } = req.body;
        const requesterUserId = req.session.userPhone + '@s.whatsapp.net';

        if (!recipientUserId) {
            return res.status(400).json({ success: false, message: 'Recipient user ID is required' });
        }

        const friendRequest = await sendFriendRequest(requesterUserId, recipientUserId);
        res.json({ success: true, friendRequest });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to send friend request' });
    }
});

// Get friend requests (received)
app.get('/api/friends/requests', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';
        const requests = await getPendingRequests(userId);
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error loading friend requests:', error);
        res.status(500).json({ success: false, message: 'Failed to load friend requests' });
    }
});

// Accept friend request
app.post('/api/friends/accept', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { requestId } = req.body;
        const recipientUserId = req.session.userPhone + '@s.whatsapp.net';

        if (!requestId) {
            return res.status(400).json({ success: false, message: 'Request ID is required' });
        }

        const acceptedRequest = await acceptFriendRequest(requestId, recipientUserId);
        res.json({ success: true, acceptedRequest });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to accept friend request' });
    }
});

// Decline friend request
app.post('/api/friends/decline', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { requestId } = req.body;
        const recipientUserId = req.session.userPhone + '@s.whatsapp.net';

        if (!requestId) {
            return res.status(400).json({ success: false, message: 'Request ID is required' });
        }

        const declinedRequest = await declineFriendRequest(requestId, recipientUserId);
        res.json({ success: true, declinedRequest });
    } catch (error) {
        console.error('Error declining friend request:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to decline friend request' });
    }
});

// Get friends list
app.get('/api/friends/list', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const userId = req.session.userPhone + '@s.whatsapp.net';
        const friends = await getUserFriends(userId);
        res.json({ success: true, friends });
    } catch (error) {
        console.error('Error loading friends list:', error);
        res.status(500).json({ success: false, message: 'Failed to load friends list' });
    }
});

// Remove friend
app.post('/api/friends/remove', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { friendshipId } = req.body;
        const userId = req.session.userPhone + '@s.whatsapp.net';

        if (!friendshipId) {
            return res.status(400).json({ success: false, message: 'Friendship ID is required' });
        }

        await removeFriend(friendshipId, userId);
        res.json({ success: true, message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to remove friend' });
    }
});

// Get other user profile data
app.get('/api/user/profile/:userId', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Format userId to include WhatsApp suffix if not present
        const formattedUserId = userId.includes('@') ? userId : userId + '@s.whatsapp.net';

        console.log('🔍 Getting profile data for user:', formattedUserId);

        // Get user data
        const userData = await getUser(formattedUserId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user borders and banners
        const userBorderDoc = await getUserBorders(formattedUserId);
        const userBannerDoc = await getUserBanners(formattedUserId);
        const equippedBorder = await getUserEquippedBorder(formattedUserId);
        const equippedBanner = await getUserEquippedBanner(formattedUserId);

        console.log('📋 Other user profile data:', {
            userId: formattedUserId,
            username: userData.username,
            level: userData.level,
            status: userData.status,
            ownedBordersCount: userBorderDoc.ownedBorders ? userBorderDoc.ownedBorders.length : 0,
            ownedBannersCount: userBannerDoc.ownedBanners ? userBannerDoc.ownedBanners.length : 0,
            equippedBorder: equippedBorder ? equippedBorder.borderId : null,
            equippedBanner: equippedBanner ? equippedBanner.bannerId : null
        });

        res.json({
            success: true,
            user: {
                userId: userData.userId,
                username: userData.username,
                level: userData.level,
                xp: userData.xp,
                totalXp: userData.totalXp,
                status: userData.status,
                memberSince: userData.memberSince,
                profilePhoto: userData.profilePhoto,
                lastActive: userData.lastActive
            },
            borders: {
                owned: userBorderDoc.ownedBorders || [],
                equipped: equippedBorder
            },
            banners: {
                owned: userBannerDoc.ownedBanners || [],
                equipped: equippedBanner
            }
        });

    } catch (error) {
        console.error('❌ Error getting other user profile:', error);
        res.status(500).json({ success: false, message: 'Failed to get user profile' });
    }
});

// Get user profile with borders and banners
app.get('/api/user/profile', async (req, res) => {
    if (!req.session.isAuthenticated && !req.session.isOwner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Get user data
        const userData = await getUser(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's equipped banner and border
        const [userBanners, userBorders] = await Promise.all([
            getUserBanners(userId),
            getUserBorders(userId)
        ]);

        const profileData = {
            userId: userData.userId,
            username: userData.username,
            profilePhoto: userData.profilePhoto,
            level: userData.level,
            totalXp: userData.totalXp,
            createdAt: userData.createdAt,
            equippedBanner: userBanners.equippedBanner,
            equippedBorder: userBorders.equippedBorder
        };

        res.json({ success: true, user: profileData });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('🌐 Web server running on http://0.0.0.0:' + PORT);
});

module.exports = { app, setBotInstance, setQRCode };