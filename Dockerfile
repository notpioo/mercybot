# Use Node.js 18 alpine image for smaller size
FROM node:18-alpine

# Install required system dependencies for sharp and other native modules
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    python3 \
    make \
    g++ \
    ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create auth directory with proper permissions
RUN mkdir -p auth_info_baileys && chmod 755 auth_info_baileys

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/bot-status || exit 1

# Start the application
CMD ["node", "index.js"]