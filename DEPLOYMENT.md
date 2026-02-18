# BugHunter Deployment Guide

## Architecture
BugHunter is a full-stack application with:
- **Frontend**: Vue.js + Vite (Static Site)
- **Backend**: Node.js + Socket.io (Requires persistent connections)

## Deployment Strategy

### Frontend (Vercel)
The frontend is configured to deploy automatically on Vercel.

**Already Configured:**
- `vercel.json` - Build and routing configuration
- `.vercelignore` - Excludes backend from frontend deployment

**Vercel will:**
1. Build the frontend from `bughunter/frontend`
2. Serve it as a static SPA
3. Handle client-side routing

### Backend (Separate Service Required)

**⚠️ Important:** The backend uses Socket.io which requires persistent WebSocket connections.
Vercel Serverless Functions don't support this, so the backend must be deployed separately.

**Recommended Backend Hosting Options:**

1. **Render.com** (Recommended - Free tier available)
   - Create new Web Service
   - Connect GitHub repo
   - Root Directory: `bughunter/backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (if needed)

2. **Railway.app** (Great for Node.js)
   - Connect GitHub repo
   - Set root path to `bughunter/backend`
   - Auto-detects Node.js and builds

3. **Fly.io** (Good performance)
   - Deploy with `flyctl launch` from backend directory

## Step-by-Step Deployment

### 1. Deploy Backend First

**On Render.com:**
```bash
# No manual steps needed - just:
1. Go to render.com
2. New Web Service
3. Connect this GitHub repo
4. Root Directory: bughunter/backend
5. Build: npm install
6. Start: npm start
7. Deploy!
```

**Note your backend URL:** `https://your-backend.onrender.com`

### 2. Update Frontend Configuration

Edit `bughunter/frontend/src/socket-client.js` or wherever Socket.io connects:
```javascript
// Change from:
const socket = io('http://localhost:3000');

// To:
const socket = io('https://your-backend.onrender.com');
```

### 3. Deploy Frontend to Vercel

The frontend is already configured and will deploy automatically when you push to GitHub.

**Manual deployment:**
```bash
cd bughunter
vercel --prod
```

### 4. Environment Variables

**Backend (on Render/Railway):**
- `PORT` (usually auto-set)
- `ANTHROPIC_API_KEY` - Your Claude API key
- Any other secrets

**Frontend (Vercel):**
- `VITE_BACKEND_URL` - Your backend URL (if using env var approach)

## Quick Deploy Commands

```bash
# Commit deployment configs
git add vercel.json .vercelignore DEPLOYMENT.md
git commit -m "Add Vercel deployment configuration"
git push origin main

# Vercel will auto-deploy frontend
# Deploy backend manually on Render/Railway
```

## Troubleshooting

**404 on Vercel:**
- Ensure `vercel.json` is in repository root
- Check build logs in Vercel dashboard
- Verify `outputDirectory` points to `bughunter/frontend/dist`

**Backend Connection Issues:**
- Update frontend Socket.io URL to backend URL
- Enable CORS in backend for frontend domain
- Check backend logs for errors

**Build Failures:**
- Ensure `package.json` in correct directories
- Check Node.js version compatibility
- Review Vercel build logs

## Production Checklist

- [ ] Backend deployed and running
- [ ] Frontend Socket.io URL updated to backend URL
- [ ] Environment variables set on both services
- [ ] CORS configured in backend for frontend domain
- [ ] SSL/HTTPS enabled (automatic on Vercel/Render)
- [ ] API keys secured (not in code)
- [ ] Test full workflow: start test → see results → download PDF

## Notes

- Frontend builds to `bughunter/frontend/dist`
- Backend runs on port specified in environment (usually 3000 or 10000)
- Socket.io requires WebSocket support
- Vercel handles frontend only, backend needs separate hosting
