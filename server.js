const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const LICENSE_TIERS = {
    DAILY: { code: 'DALY', name: 'Daily Plan', duration: 1, price: 4900 },
    WEEKLY: { code: 'WEEK', name: 'Weekly Plan', duration: 7, price: 19900 },
    MONTHLY: { code: 'MNTH', name: 'Monthly Plan', duration: 30, price: 49900 }
};

function generateLicenseKey(deviceId, tierCode, expiryDate) {
    const deviceHash = deviceId.substring(0, 8).toUpperCase();
    const expiry = expiryDate ? formatDate(expiryDate) : '';
    const checksum = generateChecksum(tierCode, deviceHash, expiry);
    return expiry ? `${tierCode}-${deviceHash}-${expiry}-${checksum}` : `${tierCode}-${deviceHash}-${checksum}`;
}

function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function generateChecksum(tier, deviceHash, expiry) {
    const combined = `${tier}${deviceHash}${expiry}SECRET_SALT_2025`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/create-order', async (req, res) => {
    try {
        const { amount, tier, deviceId } = req.body;
        const tierInfo = LICENSE_TIERS[tier];
        if (!tierInfo) return res.status(400).json({ error: 'Invalid tier' });

        const order = await razorpay.orders.create({
            amount: tierInfo.price,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { deviceId, tier }
        });

        res.json({ success: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

app.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deviceId, tier } = req.body;

        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

        if (razorpay_signature !== expectedSign) return res.status(400).json({ error: 'Invalid signature' });

        const tierInfo = LICENSE_TIERS[tier];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + tierInfo.duration);

        const licenseKey = generateLicenseKey(deviceId, tierInfo.code, expiryDate);
        console.log('✅ License generated:', licenseKey);

        res.json({ success: true, licenseKey, tier: tierInfo.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID ? '✓' : '✗'}`);
});
