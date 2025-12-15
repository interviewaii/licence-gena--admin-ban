# Interview Cracker AI - Backend Server

Payment processing server for Interview Cracker AI using Razorpay.

## Quick Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
```

Edit `.env` and fill in:
- Razorpay API keys (get from https://dashboard.razorpay.com)
- Gmail credentials (app password)
- Pricing (default: ₹49/199/499)

3. **Run server**:
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

- `GET /health` - Health check
- `GET /pricing` - Get pricing info
- `POST /create-order` - Create Razorpay payment order
- `POST /verify-payment` - Verify payment and send license

## Setup Razorpay

1. Go to https://razorpay.com and sign up
2. Navigate to Settings → API Keys
3. Generate Test Keys for development
4. Copy Key ID and Secret to `.env`

## Setup Gmail

1. Go to https://myaccount.google.com/apppasswords
2. Create app password for "Mail"
3. Copy password to `.env`

## Testing

Use Razorpay test mode for development. Test cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/
