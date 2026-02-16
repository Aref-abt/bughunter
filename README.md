# 🐛 BugHunter - AI-Powered Web Testing

An intelligent web testing tool that uses AI to automatically explore web applications, find bugs, and generate visual reports.

## ✨ Features

- 🤖 **AI-Powered Navigation** - Claude AI intelligently explores your web application
- 🍪 **Cookie-Based Authentication** - Test authenticated applications securely
- 📸 **Visual Bug Reports** - Screenshots with annotations highlighting issues
- 🗺️ **Navigation Flow Charts** - Mermaid diagrams showing exploration paths
- ⚡ **Real-Time Progress** - Live updates as AI explores your app
- 🐛 **Bug Detection** - Console errors, broken links, and accessibility issues
- 📊 **Comprehensive Reports** - Detailed bug reports with reproduction steps

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Claude API key from [Anthropic Console](https://console.anthropic.com/)

### Installation

```bash
# Clone or extract the project
cd bughunter

# Install backend dependencies
cd backend
npm install

# Install Playwright browsers
npx playwright install chromium

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

1. **Set up your Claude API key:**

```bash
# In the backend directory
cd backend
cp .env.example .env

# Edit .env and add your Claude API key
# CLAUDE_API_KEY=sk-ant-api03-xxxxx
```

2. **Start the backend server:**

```bash
cd backend
npm start
```

You should see:
```
🚀 BugHunter server running on port 3000
   Frontend URL: http://localhost:5173
   Claude API Key: ✅ Configured
```

3. **Start the frontend (in a new terminal):**

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

4. **Open your browser:**

Navigate to `http://localhost:5173`

## 📖 How to Use

### Step 1: Get Your Session Cookies

1. Open your web application in Chrome
2. Log in normally (with 2FA, SSO, or any auth method)
3. Press F12 to open DevTools
4. Go to the **Console** tab
5. Paste this code and press Enter:

```javascript
copy(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return { name, value, domain: location.hostname, path: '/' };
}));
```

6. Cookies are now copied to your clipboard!

### Step 2: Start Testing

1. In BugHunter, enter your **Target URL** (e.g., `http://localhost:9000`)
2. Select "**Authenticated (paste cookies)**"
3. **Paste your cookies** in the text area
4. (Optional) Add a **Testing Goal** like "Test the checkout workflow"
5. Click **🚀 Start AI Testing**

### Step 3: Watch AI Work

- See real-time progress as AI navigates your app
- Watch AI decisions and reasoning
- Bugs are detected and displayed live
- Browser window shows actual navigation (you can watch it!)

### Step 4: Review Results

- **Navigation Flow Chart** - Visual map of pages visited
- **Bug Reports** - Each bug with:
  - Annotated screenshot showing the issue
  - Severity level (High/Medium/Low)
  - Steps to reproduce
  - Location URL
- **Download Report** - Export as JSON for sharing

## 🎯 Example Use Cases

### Testing Your SmartCheck Platform

```
Target URL: http://localhost:9000
Cookies: [Paste from console]
Goal: Test the CTR filing workflow
```

### Testing Public Sites

```
Target URL: https://example.com
Authentication: Public (no authentication)
Goal: General exploration
```

### Testing Specific Features

```
Target URL: https://your-app.com
Cookies: [Paste from console]
Goal: Test the payment form validation
```

## 🔧 Troubleshooting

### "Claude API Key not configured"

- Make sure you created `.env` file in `backend/` directory
- Verify your API key is correct
- Restart the backend server

### "Authentication failed - cookies may be expired"

- Log into your app again and get fresh cookies
- Make sure the domain in cookies matches your target URL
- Check that your session hasn't expired

### Browser doesn't open

- Make sure Playwright is installed: `npx playwright install chromium`
- Check that port 3000 (backend) isn't already in use

### Frontend can't connect to backend

- Verify backend is running on port 3000
- Check browser console for connection errors
- Make sure no firewall is blocking localhost connections

## 📁 Project Structure

```
bughunter/
├── backend/                 # Node.js server
│   ├── src/
│   │   ├── server.js       # Main Express + Socket.io server
│   │   ├── playwright-runner.js  # Browser automation
│   │   ├── claude-client.js      # AI integration
│   │   ├── bug-detector.js       # Bug detection logic
│   │   ├── screenshot-annotator.js  # Image processing
│   │   └── report-generator.js   # Report creation
│   ├── package.json
│   └── .env               # Your API key (create this!)
│
├── frontend/               # Vue 3 application
│   ├── src/
│   │   ├── App.vue        # Main application
│   │   ├── components/
│   │   │   ├── TestForm.vue      # Input form
│   │   │   ├── LiveProgress.vue  # Real-time updates
│   │   │   └── BugReport.vue     # Results display
│   │   └── utils/
│   │       └── socket.js  # WebSocket client
│   └── package.json
│
└── README.md              # This file!
```

## 🛠️ Tech Stack

- **Frontend:** Vue 3 + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.io
- **Browser Automation:** Playwright
- **AI:** Claude Sonnet 4.5 (Anthropic API)
- **Image Processing:** Canvas (Node.js)
- **Real-time Communication:** WebSocket (Socket.io)

## 🎬 Demo Video Recording

To record a demo:

```bash
# Use Loom, OBS, or QuickTime
# Show:
1. Pasting cookies
2. Starting test
3. Live AI exploration
4. Bug detection
5. Final report with visuals
```

## 📝 Hackathon Submission

### What You Built
BugHunter - An AI agent that tests web applications by actually using them like a QA engineer would. It autonomously navigates, interacts with forms, and generates visual bug reports with annotated screenshots.

### Target Customer
- Development teams needing faster QA cycles
- Startups without dedicated QA resources
- Companies with complex web applications

### Problem Solved
Traditional testing is manual, time-consuming, and doesn't catch UI/UX issues. BugHunter automates exploration, finds bugs humans miss, and provides visual evidence for quick fixes.

### Next Steps
- Add support for more bug types (performance, security)
- Browser recording for full session replay
- CI/CD integration (GitHub Actions, GitLab)
- Team collaboration features
- Bug tracking system integration (Jira, Linear)

## 🤝 Tools Used

- **Claude Sonnet 4.5** - AI decision-making and analysis
- **Playwright** - Browser automation
- **Vue 3** - Frontend framework
- **Node.js** - Backend server
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## 📄 License

MIT License - Built for AI Product Engineer Hackathon

## 🎉 Credits

Built with ❤️ using AI-first development practices.

---

**Ready to find bugs?** Start the servers and open `http://localhost:5173`! 🚀
