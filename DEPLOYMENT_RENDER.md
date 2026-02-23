# Deployment Guide - Render.com

## 🚀 Deploy to Render in 10 Minutes

### Prerequisites
- ✅ Code working locally
- ✅ Git repository (GitHub/GitLab)
- ✅ Render account (free): https://render.com

---

## Step 1: Prepare Your Code

### 1.1 Add render.yaml (Optional but Recommended)
Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: interview-ai-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### 1.2 Verify package.json
Make sure your `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 1.3 Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial commit - ready for deployment"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

---

## Step 2: Deploy on Render

### 2.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

### 2.2 Configure Service
Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `interview-ai-backend` |
| **Region** | Select closest to you (Singapore for India) |
| **Branch** | `main` |
| **Root Directory** | `backend` (if backend is in subfolder) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or paid for better performance) |

### 2.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add ALL these variables:

```env
# Server
PORT=3000
NODE_ENV=production

# Razorpay (LIVE MODE for production!)
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET

# Email
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Pricing (in paise)
PRICE_DAILY=4900
PRICE_WEEKLY=19900
PRICE_MONTHLY=49900

# Admin
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=YourStrongPassword123!

# Session (generate new random string!)
SESSION_SECRET=randomly_generated_64_character_string_here

# App URL (will get this after deployment)
APP_URL=https://your-app.onrender.com
```

**IMPORTANT:**
- Use **LIVE** Razorpay keys for production!
- Change admin password!
- Generate new SESSION_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 2.4 Create Service
Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Run `npm install`
3. Start your server
4. Give you a URL like: `https://interview-ai-backend.onrender.com`

---

## Step 3: Post-Deployment Configuration

### 3.1 Update APP_URL
1. Copy your Render URL
2. Go to Render Dashboard → Your Service → Environment
3. Edit `APP_URL`: `https://your-app.onrender.com`
4. Click "Save Changes" (will redeploy)

### 3.2 Configure Razorpay Webhook
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add Webhook URL: `https://your-app.onrender.com/razorpay-webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
4. Save

### 3.3 Test Your Deployment
Visit your URLs:
- **Landing:** `https://your-app.onrender.com`
- **Admin:** `https://your-app.onrender.com/admin.html`
- **Purchase:** `https://your-app.onrender.com/purchase.html`

---

## Step 4: Final Testing

### 4.1 Test Payment Flow (REAL MONEY!)
1. Go to purchase page
2. Enter real email
3. Select Daily plan (cheapest - ₹49)
4. Use real payment card
5. Verify:
   - ✅ Payment successful
   - ✅ License key shows
   - ✅ Email received
   - ✅ Can copy license key

### 4.2 Test Admin Panel
1. Go to `/admin.html`
2. Login with your ADMIN credentials
3. Try:
   - ✅ Update pricing
   - ✅ Check database
   - ✅ Test email (if configured)

---

## 🔧 Troubleshooting

### Issue: "Application Error"
**Solution:**
1. Check Render logs: Dashboard → Your Service → Logs
2. Look for errors
3. Common fixes:
   - Missing environment variable
   - Wrong start command
   - npm install failed

### Issue: "Cannot read .env file"
**Solution:**
- Don't put `.env` in repository!
- Use Render's Environment Variables instead
- They're automatically loaded

### Issue: Payment fails
**Solution:**
1. Check Razorpay keys are LIVE mode
2. Verify webhook URL is correct
3. Check Render logs for errors

### Issue: Email not sending
**Solution:**
1. Verify EMAIL_USER and EMAIL_PASS in Render env vars
2. Use Gmail  App Password, not regular password
3. Check spam folder

---

## 🎯 Cost & Performance

### Free Tier
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic HTTPS
- ✅ Auto-deploy on git push
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Cold start (30s delay after sleep)

### Paid Tier ($7/month)
- ✅ No sleep/cold starts
- ✅ Always running
- ✅ Better performance
- ✅ Custom domains

**Recommendation:** Start with free tier, upgrade if needed

---

## 📊 Monitoring

### Check Render Dashboard
- **Logs:** Real-time server logs
- **Metrics:** CPU, Memory usage
- **Events:** Deployments, errors

### Set Up Notifications
1. Render Dashboard → Settings
2. Add email/Slack for alerts
3. Get notified on:
   - Deploy success/failure
   - Service crashes
   - High resource usage

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push
Once set up, every time you:
```bash
git push origin main
```

Render automatically:
1. Pulls latest code
2. Runs `npm install`
3. Restarts service
4. **Zero downtime!**

### Manual Deployment
Dashboard → Your Service → Manual Deploy → "Deploy latest commit"

---

## 🚀 You're Live!

**Your Backend URLs:**
- Landing: `https://your-app.onrender.com`
- Admin: `https://your-app.onrender.com/admin.html`
- Purchase: `https://your-app.onrender.com/purchase.html`
- API Health: `https://your-app.onrender.com/health`

**Share your purchase link with customers and start selling! 🎉**

---

##  Custom Domain (Optional)

### Add Your Domain
1. Buy domain (Namecheap, GoDaddy, etc.)
2. Render Dashboard → Settings → Custom Domains
3. Add your domain: `api.yourdomain.com`
4. Update DNS records (Render shows exactly what to add)
5. Wait for DNS propagation (5-30 min)

**After domain setup:**
- Update `APP_URL` in environment
- Update Razorpay webhook
- Update Google OAuth callback (if using)

---

## 📝 Deployment Checklist

Before deploying:
- [ ] Admin password changed
- [ ] Razorpay LIVE keys ready
- [ ] Email configured
- [ ] SESSION_SECRET generated
- [ ] Code pushed to GitHub
- [ ] All environment variables documented

After deploying:
- [ ] Test payment (₹49 real money)
- [ ] Email delivers
- [ ] Admin panel works
- [ ] Database saving
- [ ] Logs look good
- [ ] Razorpay webhook configured

**You're ready to sell licenses! 🚀**
