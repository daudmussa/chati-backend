# 🚀 Quick Start: Deploy Backend Online

Follow these steps to get your backend running online in ~10 minutes.

## Step 1: Prepare Your Code

1. Make sure all changes are committed:
```bash
git status
git add .
git commit -m "Prepare for deployment"
```

2. Push to GitHub (if not already done):
```bash
# Create a new repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway (Easiest Option)

### 2.1 Sign Up
- Go to [railway.app](https://railway.app)
- Click "Login" and sign in with GitHub
- Authorize Railway to access your repositories

### 2.2 Create Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select your `chati` repository
4. Railway will automatically detect Node.js and start building

### 2.3 Configure Environment Variables
1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"Add Variable"** and add each of these:

```
CLAUDE_API_KEY=your_actual_api_key_here
TWILIO_ACCOUNT_SID=your_actual_sid_here
TWILIO_AUTH_TOKEN=your_actual_token_here
TWILIO_PHONE_NUMBER=your_phone_number_here
PORT=3000
BYPASS_CLAUDE=0
BUSINESS_CONTEXT=Your business description here
```

**Where to find these values:**
- Open your `.env` file locally
- Copy the actual values (not the example text)
- Paste each one into Railway

### 2.4 Get Your Backend URL
1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Copy your URL (e.g., `https://chati-production.up.railway.app`)

## Step 3: Update Frontend to Use Deployed Backend

### Option A: Using Environment Variable (Recommended)

1. Create `.env` file in your project root:
```bash
VITE_API_URL=https://your-app.up.railway.app
```

2. Replace `http://localhost:3000` with the config:
   - Import: `import API_BASE_URL from '@/config/api'`
   - Use: `fetch(\`\${API_BASE_URL}/api/endpoint\`)`

### Option B: Direct Replacement (Quick)

Find and replace in all files:
- **Find**: `http://localhost:3000`
- **Replace**: `https://your-app.up.railway.app`

Files to update:
- `src/pages/Store.tsx`
- `src/pages/Admin.tsx`
- `src/pages/Conversations.tsx`
- `src/pages/Bookings.tsx`
- `src/pages/Settings.tsx`

## Step 4: Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** > **Manage** > **Active Numbers**
3. Click on your WhatsApp number
4. Scroll to **"Messaging"** section
5. Under **"A MESSAGE COMES IN"**:
   - Set Webhook URL: `https://your-app.up.railway.app/webhook`
   - Method: **POST**
6. Click **Save**

## Step 5: Test Your Deployment

### 5.1 Test Backend Health
Open in browser:
```
https://your-app.up.railway.app/health
```
Should return: `{"status":"ok","timestamp":"...","uptime":...}`

### 5.2 Test WhatsApp
1. Send a message to your WhatsApp business number
2. Check Railway logs for incoming webhook
3. Verify AI responds to your message
4. Check Conversations page in your app

### 5.3 Test Features
- ✅ Create a product in Store
- ✅ View conversations
- ✅ Check admin dashboard
- ✅ Verify all API calls work

## Step 6: Deploy Frontend (if using Vercel/Netlify)

If your frontend is also deployed:

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## Troubleshooting

### ❌ Backend won't start
- Check Railway logs (Deployments > View Logs)
- Verify all environment variables are set
- Ensure no syntax errors in server.js

### ❌ CORS errors
- Verify frontend is using correct backend URL
- Check browser console for exact error
- Ensure backend has CORS enabled (already done)

### ❌ Twilio webhook failing
- Check webhook URL is exactly: `https://your-app.railway.app/webhook`
- Verify webhook is POST method
- Check Twilio webhook logs for errors
- Ensure backend is publicly accessible

### ❌ Frontend can't connect to backend
- Verify VITE_API_URL is set correctly
- Check browser network tab for failed requests
- Ensure backend URL doesn't end with `/`

## Alternative Platforms

### Render
- Free tier available (sleeps after inactivity)
- Easy deployment: [render.com](https://render.com)
- Use `render.yaml` file in project

### Heroku
- Requires credit card even for free tier
- Use `Procfile` already created
- Deploy with Heroku CLI

### Docker
- Use `Dockerfile` already created
- Deploy to any platform supporting containers

## Monitoring Your Backend

### Railway Dashboard
- View real-time logs
- Monitor memory/CPU usage
- Set up alerts

### Check Health Endpoint
Set up monitoring (free options):
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://pingdom.com)
- Monitor: `https://your-app.railway.app/health`

## Cost Estimate

Railway Pricing:
- **Hobby Plan**: $5/month credit (enough for small apps)
- **Usage-based**: ~$0.000231/GB-hour
- Typical cost: $5-15/month

## Security Checklist

- ✅ .env file in .gitignore
- ✅ All secrets in environment variables
- ✅ HTTPS enabled (automatic on Railway)
- ✅ API endpoints protected
- ✅ Regular log monitoring

## Success! 🎉

Your backend is now online and fully functional!

**Next Steps:**
1. Share your app with users
2. Monitor logs regularly
3. Set up alerts for errors
4. Consider adding a database for persistence
5. Implement user authentication
6. Add rate limiting for API endpoints

## Need Help?

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Twilio Docs: [twilio.com/docs](https://www.twilio.com/docs)
- Check `DEPLOYMENT.md` for detailed guides

---

**Total Time: 10-15 minutes** ⏱️
