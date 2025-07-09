// Messages Configuration
module.exports = {
    greeting: "👋 Halo! Saya adalah bot asisten WhatsApp Anda.",
    ownerContact: "👤 Berikut adalah kontak owner saya:",
    commandNotFound: "❌ Command tidak ditemukan. Ketik .menu untuk melihat command yang tersedia.",
    error: "❌ Terjadi kesalahan saat memproses permintaan Anda.",
    processing: "⏳ Memproses permintaan Anda...",
    success: "✅ Operasi berhasil diselesaikan!",
    invalidFormat: "❌ Format tidak valid. Silakan periksa command Anda.",
    premiumRequired: "💎 Fitur ini hanya untuk pengguna premium.",
    groupOnly: "👥 Command ini hanya dapat digunakan dalam grup.",
    privateOnly: "🔒 Command ini hanya dapat digunakan dalam chat pribadi.",
    noPermission: "❌ Anda tidak memiliki izin untuk menggunakan command ini.",
    userNotFound: "❌ Pengguna tidak ditemukan.",
    alreadyExists: "❌ Sudah ada.",
    notFound: "❌ Tidak ditemukan.",
    limitExceeded: "⚠️ Anda telah melebihi batas harian.",
    serverError: "❌ Server error. Silakan coba lagi nanti.",
    underMaintenance: "🔧 Bot sedang dalam pemeliharaan. Silakan coba lagi nanti.",
    bannedUser: "🚫 Anda dilarang menggunakan bot ini.",
    cooldown: "⏰ Silakan tunggu sebelum menggunakan command ini lagi.",
    missingArguments: "❌ Argumen yang diperlukan tidak ada.",
    invalidArguments: "❌ Argumen yang diberikan tidak valid.",
    
    // User Management Messages
    userBanned: "🚫 Pengguna telah dilarang.",
    userUnbanned: "✅ Pengguna telah dibuka larangannya.",
    userPromoted: "⬆️ Pengguna telah dipromosikan menjadi admin.",
    userDemoted: "⬇️ Pengguna telah diturunkan menjadi member.",
    userKicked: "👢 Pengguna telah dikeluarkan dari grup.",
    userAdded: "➕ Pengguna telah ditambahkan ke grup.",
    
    // Group Management Messages
    groupClosed: "🔒 Grup telah ditutup.",
    groupOpened: "🔓 Grup telah dibuka.",
    welcomeEnabled: "👋 Pesan selamat datang diaktifkan.",
    welcomeDisabled: "👋 Pesan selamat datang dinonaktifkan.",
    antilinkEnabled: "🔗 Antilink diaktifkan.",
    antilinkDisabled: "🔗 Antilink dinonaktifkan.",
    antibadwordEnabled: "🚫 Anti-badword diaktifkan.",
    antibadwordDisabled: "🚫 Anti-badword dinonaktifkan.",
    
    // Warning System Messages
    warningIssued: "⚠️ Peringatan diberikan!",
    warningRemoved: "✅ Peringatan dihapus.",
    allWarningsCleared: "🧹 Semua peringatan dibersihkan.",
    maxWarningsReached: "🚨 Peringatan maksimum tercapai! Pengguna akan dikeluarkan.",
    
    // Economy Messages
    balanceAdded: "💰 Saldo berhasil ditambahkan.",
    balanceRemoved: "💸 Saldo berhasil dikurangi.",
    chipsAdded: "🎰 Chip berhasil ditambahkan.",
    chipsRemoved: "🎰 Chip berhasil dikurangi.",
    limitAdded: "📈 Limit berhasil ditambahkan.",
    limitRemoved: "📉 Limit berhasil dikurangi.",
    premiumAdded: "💎 Status premium ditambahkan.",
    premiumRemoved: "💎 Status premium dihapus.",
    limitReset: "🔄 Limit berhasil direset.",
    
    // Sticker Messages
    stickerProcessing: "⏳ Sedang membuat sticker...",
    stickerNoMedia: "❌ Kirim gambar/video dengan caption `.stiker` atau reply gambar/video dengan `.stiker`",
    stickerFileTooLarge: "❌ Ukuran file terlalu besar! Maksimal {maxSize}MB.",
    stickerDownloadFailed: "❌ Gagal mendownload media.",
    stickerCreateFailed: "❌ Gagal membuat sticker. Pastikan format gambar/video didukung.",
    stickerSuccess: "✅ Sticker berhasil dibuat!"
};