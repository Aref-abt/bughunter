# Deploy BugHunter on Fly.io (Web Dashboard)

## Step-by-Step Guide

### 1. Sign Up
1. Go to https://fly.io/dashboard
2. Sign up with GitHub
3. Connect your `Aref-abt/bughunter` repository

### 2. Deploy Backend

1. Click **"New App"** or **"Launch"**
2. Select **"From GitHub"**
3. Choose: `Aref-abt/bughunter`
4. **App Settings**:
   - **Name**: `bughunter-backend` (or any available name)
   - **Region**: `sea` (Seattle - closest to Oregon)
   - **Dockerfile path**: `backend/Dockerfile`
   - **Build context**: `backend/`

5. **Environment Variables** - Add these in the dashboard:
   ```
   NODE_ENV = production
   PORT = 8080
   CLAUDE_API_KEY = <your_api_key_from_earlier>
   ```

6. **VM Resources**: Free tier (256MB-1GB shared)
7. Click **"Deploy"**

### 3. Get Your Backend URL

After deployment completes, you'll get a URL like:
```
https://bughunter-backend.fly.dev
```

**Copy this URL** - you'll need it next!

### 4. Update Frontend

Tell me your Fly.io backend URL and I'll update the frontend to connect to it.

Or manually update `frontend/src/utils/socket.js` line 3:
```javascript
const SOCKET_URL = 'https://your-app.fly.dev'; // Replace with your Fly URL
```

### 5. Frontend Deployment Options

**Option A: Keep frontend on Render** (Easiest)
- Just update the socket URL
- No additional work needed
- Frontend stays on Render, backend on Fly

**Option B: Move frontend to Fly too**
- Create another Fly app for frontend
- Deploy as static site
- Fully on Fly.io

## Why Fly.io?

✅ **More memory**: 256MB-1GB vs Render's 512MB
✅ **Better burst handling**: Handles memory spikes
✅ **Auto-sleep when idle**: Saves resources on free tier
✅ **Faster**: Better global CDN
✅ **More reliable**: Won't crash from Playwright memory usage

## Troubleshooting

**If deployment fails:**
- Check that `fly.toml` exists in `backend/` folder
- Make sure CLAUDE_API_KEY is set
- Try increasing VM size in fly.toml

**If still getting disconnects:**
- Increase VM memory in `backend/fly.toml`: change `memory = '1gb'` to `memory = '2gb'`
- Note: 2GB might require paid plan

---

**Ready?** Let me know when you have your Fly.io backend URL and I'll update the frontend!
