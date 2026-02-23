# Email Configuration Guide

## Quick Setup (Gmail)

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/apppasswords
2. You might need to enable 2-Step Verification first if not enabled
3. Under "App passwords", click "Generate"
4. Select app: **Mail**
5. Select device: **Other** (type "Interview AI Backend")
6. Click **Generate**
7. Copy the 16-character password (example: `xxxx xxxx xxxx xxxx`)

### Step 2: Update .env File

1. Open `backend/.env` file (create if doesn't exist by copying `.env.example`)
2. Add your email configuration:

```env
# Email Configuration (Gmail)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

**IMPORTANT:** Use the **App Password**, NOT your regular Gmail password!

### Step 3: Restart Server

After updating `.env`:
```bash
# Stop the current server (Ctrl+C)
npm start
```

### Step 4: Test Email

1. Visit: `http://localhost:3000/admin.html`
2. Login with `admin` / `admin123`
3. Scroll to "Test Tools"
4. Enter your email address
5. Click "Send Test Email"
6. Check your inbox!

---

## Troubleshooting

### Error: "Invalid login"
- Make sure you're using the **App Password**, not your regular password
- App password should be 16 characters
- Remove any spaces from the app password

### Error: "Less secure app access"
- Gmail no longer supports this
- You MUST use App Password (see Step 1)

### Still not working?
- Check that EMAIL_USER is your full Gmail address
- Verify 2-Step Verification is enabled on your Google Account
- Try generating a new App Password
- Make sure there are no extra spaces in your `.env` file

---

## Example `.env` File

```env
# Server
PORT=3000

# Razorpay API Keys
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE

# Email Configuration (Gmail) - ADD THESE LINES
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop

# Pricing (in paise, 1 INR = 100 paise)
PRICE_DAILY=4900
PRICE_WEEKLY=19900
PRICE_MONTHLY=49900

# Google OAuth Configuration (optional for now)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Session Secret
SESSION_SECRET=your_random_session_secret_here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# App URL
APP_URL=http://localhost:3000
```

---

## After Email is Configured

Once email is working, licenses will be automatically sent to users after payment! 📧

Test the full flow:
1. Go to purchase page
2. Enter email address
3. Complete payment
4. Check if email arrives with license key!
