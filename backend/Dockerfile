# Use Playwright's official Node.js image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Set working directory
WORKDIR /app

# Set memory and process limits for Chromium
ENV NODE_OPTIONS="--max-old-space-size=384"
ENV PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW=1

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Start the application with memory constraints
CMD ["node", "--max-old-space-size=384", "src/server.js"]
