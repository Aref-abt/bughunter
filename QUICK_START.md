# 🚀 QUICK START - Get BugHunter Running in 5 Minutes

## Step 1: Install Dependencies (2 minutes)

```bash
# Run the setup script (Mac/Linux)
./setup.sh

# OR manually:
cd backend && npm install && npx playwright install chromium
cd ../frontend && npm install
```

## Step 2: Add Your Claude API Key (1 minute)

1. Get your API key from https://console.anthropic.com/
2. Open `backend/.env` in any text editor
3. Replace `your_claude_api_key_here` with your actual key:

```
CLAUDE_API_KEY=sk-ant-api03-xxxxx-your-actual-key-here-xxxxx
```

Save and close.

## Step 3: Start the Servers (30 seconds)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Wait for: `✅ Claude API Key: Configured`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Wait for: `➜ Local: http://localhost:5173/`

## Step 4: Test It! (1 minute)

1. Open http://localhost:5173 in your browser
2. You'll see the BugHunter interface ✨

### Quick Test with Your SmartCheck App:

1. Open your SmartCheck app at http://localhost:9000
2. Log in normally
3. Press F12 → Console
4. Paste this and press Enter:
```javascript
copy(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return { name, value, domain: location.hostname, path: '/' };
}));
```
5. Go back to BugHunter
6. Enter URL: `http://localhost:9000`
7. Select "Authenticated"
8. Paste cookies (Ctrl+V)
9. Click "🚀 Start AI Testing"
10. Watch the magic! 🎉

## 🎬 What You'll See:

- Browser opens automatically
- AI navigates your app
- Bugs are detected live
- Visual report with annotated screenshots
- Flow chart showing the journey

## 💡 Pro Tips:

- Leave the browser window visible to watch AI work
- Check the Activity Log for real-time decisions
- Download the report as JSON for sharing
- Test different goals: "Test the SAR form", "Explore the dashboard", etc.

## ❌ Troubleshooting:

**"Claude API Key not configured"**
→ Check backend/.env file has your key

**"Authentication failed"**
→ Get fresh cookies (they expire)

**Backend won't start**
→ Make sure port 3000 is free: `lsof -i :3000`

**Frontend won't start**
→ Make sure port 5173 is free: `lsof -i :5173`

## 📹 Record Your Demo:

Use Loom or OBS to record:
1. Pasting cookies
2. Starting the test
3. AI exploring (show the browser!)
4. Bug detection
5. Final report

---

**That's it!** You're ready to demo BugHunter. 🐛✨

Need help? Check the full README.md for more details.
