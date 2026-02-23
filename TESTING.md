# Testing Guide

## Quick Start Test

1. **Start the server:**
```bash
cd backend
npm start
```

2. **Test endpoints in your browser or use curl:**

### Test 1: Health Check
Visit: `http://localhost:3000/health`

Expected response:
```json
{
  "status": "ok",
  "database": "json",
  "session": "ready"
}
```

### Test 2: Database Test
Visit: `http://localhost:3000/api/test-db`

Expected response:
```json
{
  "success": true,
  "message": "Database is working!",
  "currentSettings": {
    "daily_price": "4900",
    "weekly_price": "19900",
    "monthly_price": "49900",
    ...
  }
}
```

### Test 3: Get Pricing
Visit: `http://localhost:3000/api/pricing`

Expected response:
```json
{
  "success": true,
  "pricing": {
    "daily": 4900,
    "weekly": 19900,
    "monthly": 49900
  }
}
```

### Test 4: Email Test (PowerShell/CMD)
```powershell
curl -X POST http://localhost:3000/api/test-email `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"your_email@example.com\"}'
```

**OR use browser console** (visit http://localhost:3000 first):
```javascript
fetch('http://localhost:3000/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your_email@gmail.com' })
})
.then(r => r.json())
.then(console.log);
```

Check your email for the test license key!

### Test 5: Payment Flow (with Email)

Use your existing desktop app, but the payment will now:
1. Generate license key
2. **Send email automatically if you add email support to PaymentAlert.js**
3. Return license key for display

## What's Working Now:

✅ Database (JSON file storage)
✅ Pricing management (from settings)
✅ License key generation
✅ Email sending functionality
✅ Payment verification
✅ All original endpoints work

## What's NOT Yet Implemented:

❌ Google OAuth login (need to set up first)
❌ Web portal pages (coming next)
❌ Admin panel UI
❌ User dashboard

## Next Steps:

1. **Test current functionality** - Run all tests above
2. **Set up Google OAuth** - Follow GOOGLE_OAUTH_SETUP.md
3. **Build web portal** - After OAuth is working

## Database Location

Your data is stored in: `backend/data/`
- `users.json` - User accounts
- `licenses.json` - License keys
- `transactions.json` - Payment history
- `settings.json` - App settings (pricing, etc.)

## Troubleshooting

**Server won't start?**
- Check `.env` file exists and has correct keys
- Make sure port 3000 isn't in use

**Email not sending?**
- Verify EMAIL_USER and EMAIL_PASS in `.env`
- Make sure you're using Gmail App Password, not regular password

**Payment failing?**
- Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in `.env`
- Verify you're in test mode with test credentials
