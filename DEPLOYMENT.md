# Deployment Guide - Seana Bot

## Railway Deployment

### Prerequisites
1. Railway account (https://railway.app)
2. MongoDB Atlas account atau database MongoDB
3. Repository di GitHub/GitLab

### Step-by-Step Railway Deployment

#### 1. Persiapan Environment Variables
Siapkan environment variables berikut di Railway:

```bash
NODE_ENV=production
PORT=5000
NODE_VERSION=20
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seanabot
```

**PENTING**: Pastikan menggunakan Node.js 20+ karena @whiskeysockets/baileys memerlukan Node.js 20+

#### 2. Deploy via Railway Dashboard
1. Login ke Railway dashboard
2. Klik "New Project" → "Deploy from GitHub repo"
3. Pilih repository yang berisi Seana Bot
4. Railway akan otomatis detect Dockerfile dan melakukan build

#### 3. Deploy via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init project
railway init

# Deploy
railway up
```

#### 4. Konfigurasi Domain (Opsional)
1. Di Railway dashboard, pilih project
2. Go to Settings → Domains
3. Generate domain atau tambahkan custom domain

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/seanabot` |

### Docker Deployment (Alternative)

#### Build dan Run Manual
```bash
# Build image
docker build -t seana-bot .

# Run container
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your_mongodb_uri \
  seana-bot
```

#### Menggunakan Docker Compose
```bash
# Run dengan database MongoDB local
docker-compose up -d

# Run tanpa MongoDB local (gunakan MongoDB Atlas)
docker-compose up -d seana-bot
```

### Production Checklist

#### Sebelum Deploy
- [ ] MongoDB Atlas cluster sudah setup dan running
- [ ] Environment variables sudah dikonfigurasi
- [ ] Firewall rules sudah diatur (jika perlu)

#### Setelah Deploy
- [ ] Health check endpoint `/api/bot-status` berfungsi
- [ ] QR code dapat di-generate di web interface
- [ ] Bot dapat connect ke WhatsApp
- [ ] Database connection berfungsi
- [ ] Logging berfungsi dengan baik

### Monitoring & Maintenance

#### Railway Dashboard
- Monitor resource usage (CPU, Memory, Network)
- Check deployment logs
- Monitor health checks

#### Bot Status Endpoints
- Health check: `GET /api/bot-status`
- QR code: `GET /api/qr-code`

#### Troubleshooting Common Issues

1. **Docker Build Error: Node.js Version**
   ```
   Error: This package requires Node.js 20+ to run reliably
   ```
   **Solution**: Pastikan menggunakan Node.js 20+ di Dockerfile dan set NODE_VERSION=20 di environment variables

2. **npm ci --only=production deprecated warning**
   ```
   npm warn config only Use `--omit=dev` to omit dev dependencies
   ```
   **Solution**: Gunakan `npm ci --omit=dev` instead of `--only=production`

3. **Bot tidak bisa connect ke WhatsApp**
   - Check apakah QR code ter-generate
   - Pastikan tidak ada instance bot lain yang running
   - Restart service

4. **Database connection failed**
   - Verify MONGODB_URI environment variable
   - Check database server status
   - Verify network connectivity

5. **Memory/CPU issues**
   - Monitor resource usage di Railway dashboard
   - Scale up instance jika perlu
   - Check untuk memory leaks

6. **Baileys Engine Requirements Error**
   - Pastikan NODE_VERSION environment variable set ke "20"
   - Rebuild dengan Dockerfile yang sudah diupdate
   - Gunakan Dockerfile.multistage untuk optimized build

### Scaling

#### Horizontal Scaling
Railway support auto-scaling berdasarkan traffic. Konfigurasi di:
- Settings → Autoscaling
- Set minimum dan maximum replicas

#### Vertical Scaling
Upgrade plan Railway untuk resource lebih besar:
- More RAM
- More CPU
- Better performance

### Backup & Recovery

#### WhatsApp Auth State
- File auth_info_baileys/ akan disimpan dalam container
- Untuk persistent storage, mount volume atau gunakan Railway volumes

#### Database Backup
- Setup automated backup di MongoDB Atlas
- Atau manual backup berkala

### Security Best Practices

1. **Environment Variables**
   - Jangan commit secrets ke repository
   - Gunakan Railway environment variables

2. **Network Security**
   - Railway provides HTTPS by default
   - Gunakan secure MongoDB connection (SSL)

3. **Access Control**
   - Implement rate limiting
   - Monitor unauthorized access attempts

### Cost Optimization

1. **Railway Usage**
   - Monitor usage di dashboard
   - Setup billing alerts
   - Scale down saat tidak diperlukan

2. **Database Costs**
   - Optimize MongoDB queries
   - Setup proper indexing
   - Monitor database size

## Support

Jika ada masalah dengan deployment:
1. Check Railway logs
2. Verify environment variables
3. Test health check endpoints
4. Contact support jika diperlukan