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

### Deployment Steps
1. Connect Railway to your GitHub repository
2. Add environment variables in Railway dashboard
3. Railway will automatically detect and use the Dockerfile
4. Bot will start automatically after successful build

### Features Supported
- ✅ Manual anti-view-once (reply with `.antivc`)
- ✅ Automatic anti-view-once (`.antivc on/off`)
- ✅ Local file storage in downloads/ folder
- ✅ All command systems (owner, premium, group management)
- ✅ MongoDB data persistence
- ✅ Session management for WhatsApp

### Node.js Compatibility
- Uses Node.js 20+ (required for Baileys library)
- Dockerfile ensures proper version
- Compatible with Railway's infrastructure

### Security
- All view-once media saved locally
- No external file hosting
- Secure MongoDB connection
- Session files protected

### Monitoring
- Railway provides automatic logs
- Bot includes comprehensive error handling
- WhatsApp connection status monitoring