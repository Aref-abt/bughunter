# Use Playwright's official Node.js image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Set working directory
WORKDIR /app

# Set memory and process limits for Chromium
ENV NODE_OPTIONS="--max-old-space-size=384"
ENV PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW=1

# Copy package files
COPY package*.json ./

# Install dependencies (use install instead of ci for Railway)
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose ports (8080 for Fly.io, 10000 for Render)
EXPOSE 8080 10000

# Start the application with memory constraints and garbage collection
CMD ["node", "--max-old-space-size=384", "--expose-gc", "src/server.js"]
