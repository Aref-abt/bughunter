# Deploy BugHunter on Render.com

## ONE-CLICK DEPLOYMENT

1. **Go to:** [render.com/dashboard](https://dashboard.render.com)
2. **Click:** New → Blueprint
3. **Connect:** This GitHub repo (`Aref-abt/bughunter`)
4. **Click:** Apply

Render will automatically deploy:
- ✅ Backend (with Socket.io support)
- ✅ Frontend (static site)

## After Deployment

### Get Your Backend URL:
- Find your backend service URL: `https://bughunter-backend-XXXX.onrender.com`

### Update Frontend:
Edit `frontend/src/App.vue` (or wherever socket connects):

```javascript
// Find this line (around line 16-20):
const socketClient = socketIOClient('http://localhost:3000');

// Change to your Render backend URL:
const socketClient = socketIOClient('https://bughunter-backend-XXXX.onrender.com');
```

### Push Update:
```bash
git add frontend/src/App.vue
git commit -m "Update backend URL for Render"
git push origin main
```

Render will auto-redeploy!

## Environment Variables

Add to backend service on Render:
- `ANTHROPIC_API_KEY` = your Claude API key

## Done! 🎉

Your BugHunter app is live on Render with full WebSocket support!
