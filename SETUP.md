# Backend Server Setup - Final Steps

## ✅ Server is Running!

Your backend server is working! You saw:
```
✅ Server running on http://localhost:3000
💳 Razorpay: ✓
```

## 🔧 Update Your Environment

Edit `backend/.env` and replace with your actual Razorpay keys:

```env
PORT=3000
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_HERE
```

Get them from: https://dashboard.razorpay.com/app/keys

## 🚀 Start the Server

```bash
cd backend
node server.js
```

Keep this terminal running while testing payments.

## Next: Test the Integration

Once the Electron app is updated, you can test payments using:
- Test UPI: `success@razorpay`
- Test Card: `4111 1111 1111 1111`, CVV: `123`

The license key will be generated automatically and shown after payment!
