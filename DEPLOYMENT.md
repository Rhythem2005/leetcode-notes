# 🚀 Deployment Guide

This guide provides step-by-step instructions for deploying the LeetCode Notes application to Render (backend) and Vercel (frontend).

## Prerequisites

### Required Accounts
- [ ] GitHub account with repository access
- [ ] Render account (https://render.com)
- [ ] Vercel account (https://vercel.com)
- [ ] Gemini API key (https://aistudio.google.com/app/apikeys)
- [ ] Claude API key (https://console.anthropic.com/)

### Local Prerequisites
- Python 3.9+
- Node.js 18+
- Git
- npm

## Step 1: Prepare Repository

### 1.1 Verify Git Status
```bash
cd leetcode-notes
git status
```

### 1.2 Update all files (if changes made locally)
```bash
git add .
git commit -m "Deployment prep: Add Procfile, env examples, and configs"
git push origin main
```

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service on Render
1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select the `leetcode-notes` repository
5. Click **Connect**

### 2.2 Configure Service Settings

**Basic Configuration:**
- **Name**: `leetcode-notes-api`
- **Ray**: Select closest region to users
- **Runtime**: Python 3
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
- **Plan**: Choose Free or Starter (Free tier has cold starts)

### 2.3 Set Environment Variables

Click **Advanced** → **Add Environment Variable** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `GEMINI_API_KEY` | Your Gemini key | From https://aistudio.google.com/app/apikeys |
| `CLAUDE_API_KEY` | Your Claude key | From https://console.anthropic.com/ |
| `FLASK_ENV` | `production` | Disables debug mode |
| `PORT` | `5000` | Standard Render port |

### 2.4 Deploy

1. Click **Create Web Service**
2. Render will start building (visible in logs)
3. Wait for "Service is live" message
4. Copy the service URL (e.g., `https://leetcode-notes-api.onrender.com`)

### 2.5 Verify Backend

```bash
curl https://leetcode-notes-api.onrender.com/health
# Should return: {"status":"ok"}
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Project on Vercel
1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Select `leetcode-notes` repository
4. Click **Import**

### 3.2 Configure Project

**Framework Preset**: Vite (auto-detected)

**Build and Output Settings:**
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`
- **Root Directory**: `frontend`

### 3.3 Set Environment Variables

In **Environment Variables** section, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-render-url.onrender.com` |
| `VITE_DEBUG` | `false` |

⚠️ **Important**: Replace `https://your-render-url.onrender.com` with the actual Render backend URL from Step 2.4

### 3.4 Deploy

1. Click **Deploy**
2. Vercel will build frontend (visible in log)
3. Wait for "Production Deployment Ready" message
4. Copy the frontend URL (e.g., `https://leetcode-notes.vercel.app`)

### 3.5 Verify Frontend

1. Open `https://leetcode-notes.vercel.app` in browser
2. Should load without errors
3. Check browser console (F12) for any errors

## Step 4: Connect Frontend to Backend

After both are deployed, the frontend needs to know the backend URL.

### 4.1 Update Backend URL in Vercel

1. Go to Vercel Dashboard
2. Select `leetcode-notes` project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_URL` to your Render backend URL
5. Click **Save**
6. Vercel will auto-redeploy with new URL

### 4.2 Trigger Redeployment

Either:
- **Option A**: Push any commit to GitHub (auto-deploys)
- **Option B**: Click **Redeploy** on Vercel dashboard

## Step 5: Test Full Application

### 5.1 Test Backend
```bash
curl https://your-render-url.onrender.com/health
# Expected: {"status":"ok"}
```

### 5.2 Test Frontend
1. Open https://your-vercel-url.vercel.app
2. Try generating a note:
   - Enter problem number: `121`
   - Paste some Python code
   - Click submit
3. Should see generated analysis

### 5.3 Test API Connection
In browser console (F12):
```javascript
fetch('https://your-render-url.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log('Backend connected!', d))
  .catch(e => console.error('Backend error', e))
```

## Troubleshooting

### Backend won't start
1. Check Render logs (Dashboard → Service → Logs)
2. Verify all environment variables are set
3. Ensure `Procfile` exists: `web: gunicorn app:app`
4. Try building locally: `pip install -r backend/requirements.txt`

### Frontend shows blank page
1. Check Vercel logs (Dashboard → Project → Deployment)
2. Open browser console (F12) → Network tab
3. Verify API requests are going to correct backend URL
4. Check `VITE_API_URL` environment variable

### API calls fail (CORS error)
1. Verify backend `VITE_API_URL` is correct
2. Backend has CORS enabled in `app.py`
3. Try direct curl to backend: `curl https://your-api-url/health`
4. Check browser console for exact error

### "Could not find image" on Render
- Render free tier may be slow
- Wait 2-3 minutes for first build
- Check build logs for errors
- May need to upgrade to paid tier

### Vercel shows "Cannot find module" error
1. Ensure root directory is set to `frontend`
2. Clear Vercel cache: Delete all deployments, redeploy
3. Verify `package.json` exists in `frontend/`
4. Check Node version compatibility

## Production Best Practices

### Security
- ✅ Never commit `.env` files
- ✅ API keys only in environment variables
- ✅ Use HTTPS everywhere
- ✅ Enable Render auto-scaling for production tier

### Performance
- ✅ Use Render's standard tier for consistent performance
- ✅ Enable Vercel edge caching
- ✅ Monitor API response times
- ✅ Set up error tracking

### Maintenance
- ✅ Regular backups of SQLite database
- ✅ Monitor error logs daily
- ✅ Update dependencies monthly
- ✅ Test API changes before pushing

## Monitoring

### Render
- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Status**: https://status.render.com

### Vercel
- **Logs**: Dashboard → Project → Deployments
- **Metrics**: Dashboard → Project → Analytics
- **Status**: https://www.vercel-status.com

## Next Steps

After successful deployment:

1. **Share your app**: Send frontend URL to friends
2. **Backup database**: Export your notes regularly
3. **Monitor performance**: Check logs weekly
4. **Plan upgrades**: Consider paid tiers for production use
5. **Automate backups**: Set up database backups

## Support

### Common URLs
- GitHub: https://github.com/Rhythem2005/leetcode-notes
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard

### Getting Help
1. Check logs on Render/Vercel
2. Review browser console (F12)
3. Search error message on Google
4. Open GitHub issue with details

---

**Last Updated**: April 6, 2026  
**Status**: Ready for Production ✅
