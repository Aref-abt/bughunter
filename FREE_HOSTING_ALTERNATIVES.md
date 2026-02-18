# Free Hosting Alternatives for BugHunter

If Render's free tier keeps crashing due to memory limits, try these alternatives:

## 1. Railway (RECOMMENDED)
- **Free Tier**: $5 free credit/month
- **Memory**: 512MB but better burst handling
- **Deployment**: Similar to Render (uses Dockerfile)
- **URL**: https://railway.app

**Setup**:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 2. Fly.io
- **Free Tier**: 3 small VMs (256MB shared)
- **Memory**: 256MB but handles bursts well
- **Deployment**: Uses Dockerfile
- **URL**: https://fly.io

**Setup**:
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch --dockerfile backend/Dockerfile
```

## 3. Koyeb
- **Free Tier**: 512MB RAM
- **Memory**: Better performance than Render
- **Deployment**: Git-based or Docker
- **URL**: https://koyeb.com

## 4. Cyclic
- **Free Tier**: Good for Node.js apps
- **Memory**: 512MB
- **Note**: May need adjustments for Playwright
- **URL**: https://cyclic.sh

## 5. Self-Host Options

### Docker Compose (Local/VPS)
If you have a VPS or local server:
```bash
docker-compose up -d
```

### Ngrok (Local Development)
Expose local backend to internet:
```bash
npm install -g ngrok
ngrok http 3000
```

## Current Optimizations on Render

We've made these optimizations for Render's 512MB limit:
- ✅ Reduced max steps: 35 → 12
- ✅ JPEG screenshots at 60% quality
- ✅ Single-process Chromium
- ✅ Manual garbage collection
- ✅ Limited screenshot history (last 10)
- ✅ Smaller viewport (1280x720)

If still crashing, the free tier simply can't handle Playwright + Chromium reliably.
