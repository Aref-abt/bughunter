#!/bin/bash

echo "🐛 BugHunter - Quick Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your Claude API key!"
    echo "   Get your key from: https://console.anthropic.com/"
    echo ""
fi

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env and add your CLAUDE_API_KEY"
echo "2. Run 'cd backend && npm start' in one terminal"
echo "3. Run 'cd frontend && npm run dev' in another terminal"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "Happy bug hunting! 🐛🔍"
