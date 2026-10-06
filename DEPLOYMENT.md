# Backend Deployment Guide

This guide will help you deploy your Chati Solutions backend to a cloud platform.

## Prerequisites

1. Your code pushed to a GitHub repository
2. Environment variables ready (from `.env` file)
3. Choose a hosting platform (Railway, Render, or Heroku recommended)

---

## Option 1: Railway (Recommended - Easiest)

### Steps:

1. **Sign Up**: Go to [railway.app](https://railway.app) and sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**:
   - Go to your project > Variables tab
   - Add these variables:
     ```
     CLAUDE_API_KEY=your_claude_api_key
     TWILIO_ACCOUNT_SID=your_twilio_sid
     TWILIO_AUTH_TOKEN=your_twilio_token
     TWILIO_PHONE_NUMBER=your_twilio_number
     PORT=3000
     BYPASS_CLAUDE=0
     BUSINESS_CONTEXT=Your business description
     ```

4. **Deploy**:
   - Railway will auto-detect Node.js and deploy
   - Get your deployment URL from the "Deployments" tab
   - Format: `https://your-app.railway.app`

5. **Update Frontend**:
   - Replace all `http://localhost:3000` in your frontend code with your Railway URL
   - Redeploy your frontend

---

## Option 2: Render

### Steps:

1. **Sign Up**: Go to [render.com](https://render.com) and sign up with GitHub

2. **Create New Web Service**:
   - Dashboard > New > Web Service
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**:
   - **Name**: chati-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid for better performance)

4. **Add Environment Variables**:
   - Go to Environment tab
   - Add the same variables as Railway above

5. **Deploy**:
   - Click "Create Web Service"
   - Get your URL: `https://chati-backend.onrender.com`

6. **Note**: Free tier may sleep after inactivity. Upgrade for 24/7 uptime.

---

## Option 3: Heroku

### Steps:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   heroku create chati-backend
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set CLAUDE_API_KEY=your_key
   heroku config:set TWILIO_ACCOUNT_SID=your_sid
   heroku config:set TWILIO_AUTH_TOKEN=your_token
   heroku config:set TWILIO_PHONE_NUMBER=your_number
   heroku config:set BYPASS_CLAUDE=0
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **Get URL**:
   ```bash
   heroku open
   ```

---

## Option 4: Docker (Any Platform)

If you prefer Docker:

```bash
# Build image
docker build -t chati-backend .

# Run locally to test
docker run -p 3000:3000 --env-file .env chati-backend

# Deploy to any cloud that supports Docker
# (DigitalOcean, AWS ECS, Google Cloud Run, etc.)
```

---

## After Deployment

### 1. Test Your API

Visit these URLs (replace with your deployed URL):

- `https://your-app.railway.app/` - Should show API info
- `https://your-app.railway.app/health` - Should return `{"status":"ok"}`

### 2. Update Frontend API Calls

You need to replace all instances of `http://localhost:3000` with your deployed URL.

#### Quick Find & Replace:

**Files to update:**
- `src/pages/Store.tsx`
- `src/pages/Admin.tsx`
- `src/pages/Conversations.tsx`
- `src/pages/Bookings.tsx`
- `src/pages/Settings.tsx`

**Replace:**
```
http://localhost:3000
```

**With:**
```
https://your-actual-deployed-url.railway.app
```

Or create an environment variable:

Create `.env` in your frontend:
```
VITE_API_URL=https://your-actual-deployed-url.railway.app
```

Then use `import.meta.env.VITE_API_URL` in your code.

### 3. Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to Phone Numbers > Your WhatsApp Number
3. Under "Messaging", set webhook URL to:
   ```
   https://your-deployed-url.railway.app/webhook
   ```
4. Method: POST
5. Save

### 4. Test WhatsApp Integration

Send a message to your WhatsApp business number and verify:
- Message appears in Conversations page
- AI responds correctly
- No errors in logs

---

## Troubleshooting

### Server Not Starting
- Check logs in your hosting platform
- Verify all environment variables are set
- Ensure PORT is set to 3000 or use `process.env.PORT`

### CORS Errors
The server already has CORS enabled for all origins. If issues persist:
- Verify your frontend URL is correct
- Check browser console for specific errors

### Twilio Webhook Not Working
- Ensure webhook URL is publicly accessible
- Check webhook logs in Twilio console
- Verify SSL certificate (most platforms provide this automatically)

### Out of Memory
- Upgrade to a paid plan with more RAM
- Railway Free: 512MB
- Render Free: 512MB
- Consider optimizing conversation history storage

---

## Cost Estimates

### Railway
- **Free Tier**: $5 free credit/month
- **Pro**: $5/month + usage (~$10-20/month total)

### Render
- **Free Tier**: Yes, but sleeps after 15min inactivity
- **Starter**: $7/month (always on)

### Heroku
- **Eco**: $5/month (never sleeps)
- **Basic**: $7/month

---

## Security Best Practices

1. ✅ Never commit `.env` file (already in `.gitignore`)
2. ✅ Use environment variables for all secrets
3. ✅ Rotate API keys if exposed
4. ✅ Enable HTTPS (automatic on all platforms)
5. ✅ Monitor logs regularly
6. ✅ Set up alerts for errors

---

## Monitoring

### Railway
- Built-in metrics and logs
- View in project dashboard

### Render
- Logs available in dashboard
- Set up log alerts

### Custom Monitoring
Consider adding:
- Sentry for error tracking
- LogRocket for user sessions
- Uptime monitoring (UptimeRobot, Pingdom)

---

## Backup Strategy

Your data is currently in-memory. For production:

1. **Add Database** (recommended):
   - Railway PostgreSQL (free addon)
   - Supabase (free tier)
   - MongoDB Atlas (free tier)

2. **Implement Persistence**:
   - Store conversations, products, orders in DB
   - Migrate from Maps to database queries

3. **Scheduled Backups**:
   - Most platforms offer automated backups
   - Export data regularly

---

## Next Steps

1. ✅ Deploy backend to chosen platform
2. ✅ Update frontend with deployed URL
3. ✅ Configure Twilio webhook
4. ✅ Test end-to-end functionality
5. 📝 Add database for production use
6. 📝 Set up monitoring and alerts
7. 📝 Configure custom domain (optional)

---

## Support

If you encounter issues:
1. Check platform-specific documentation
2. Review server logs
3. Verify environment variables
4. Test health endpoint
5. Check Twilio webhook logs

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Platform account created (Railway/Render/Heroku)
- [ ] Environment variables configured
- [ ] Backend deployed successfully
- [ ] Health endpoint returns OK
- [ ] Frontend updated with backend URL
- [ ] Frontend redeployed
- [ ] Twilio webhook configured
- [ ] Test WhatsApp message sent
- [ ] AI responds correctly
- [ ] All features working (Store, Bookings, Admin)

---

**Recommended: Start with Railway for the easiest deployment experience.**
