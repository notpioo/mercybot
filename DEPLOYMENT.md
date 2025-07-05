# WhatsApp Bot Deployment Guide

## Railway Deployment

### Prerequisites
- Railway account
- MongoDB Atlas database
- WhatsApp phone number for bot

### Environment Variables
Set these in Railway dashboard:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-connection-string
```

### Files for Railway
- `Dockerfile` - Custom Node.js 20 container
- `railway.toml` - Railway configuration
- `nixpacks.toml` - Alternative nixpacks config
- `.nvmrc` - Node version specification
- `web-server.js` - Web interface for QR code display

### QR Code Solution for Railway
**Problem**: Railway logs display QR code as unreadable text blocks
**Solution**: Web interface for QR code scanning

1. After deployment, Railway will provide a public URL
2. Visit `https://your-app.railway.app` to see QR code interface
3. Scan QR code from the web page instead of logs
4. Web page auto-refreshes every 3 seconds
5. Shows clear status: waiting, ready, or expired

### Deployment Steps
1. Connect Railway to your GitHub repository
2. Add environment variables in Railway dashboard
3. Railway will automatically detect and use the Dockerfile
4. Once deployed, visit your app URL for QR code
5. Scan QR code from web interface (not logs)

### Web Interface Features
- **QR Code Display**: Clear, scannable QR code image
- **Auto Refresh**: Updates every 3 seconds
- **Status Indicators**: Visual feedback for QR state
- **Mobile Friendly**: Responsive design for phone scanning
- **Error Handling**: Clear messages for expired codes

### URLs Available
- `/` - Main QR code interface
- `/qr` - JSON API for QR data
- `/status` - Bot status endpoint

### Features Supported
- ✅ Manual anti-view-once (reply with `.antivc`)
- ✅ Automatic anti-view-once (`.antivc on/off`)
- ✅ Local file storage in downloads/ folder
- ✅ All command systems (owner, premium, group management)
- ✅ MongoDB data persistence
- ✅ Session management for WhatsApp
- ✅ Web-based QR code interface

### Node.js Compatibility
- Uses Node.js 20+ (required for Baileys library)
- Dockerfile ensures proper version
- Compatible with Railway's infrastructure

### Security
- All view-once media saved locally
- No external file hosting
- Secure MongoDB connection
- Session files protected
- QR codes expire automatically

### Monitoring
- Railway provides automatic logs
- Bot includes comprehensive error handling
- WhatsApp connection status monitoring
- Web interface for real-time status