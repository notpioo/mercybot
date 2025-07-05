# Use Node.js 20 official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create downloads directory
RUN mkdir -p downloads

# Expose port (Railway assigns PORT automatically)
EXPOSE $PORT
ENV PORT=3000

# Start the application
CMD ["node", "index.js"]