const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { initializeDatabase, userOps, licenseOps, transactionOps, settingsOps, analyticsOps, deviceOps } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for now
}));

// Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 payment attempts per hour
    message: 'Too many payment attempts, please try again later.'
});

app.use('/api/', limiter);

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.APP_URL
        : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(express.json());
app.use(express.static('public'));

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Nodemailer configuration
// Nodemailer configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// License tier configuration from settings or env
const LICENSE_TIERS = {
    DAILY: { code: 'DALY', name: 'Daily Plan', duration: 1, price: parseInt(settingsOps.get('daily_price') || process.env.PRICE_DAILY || '9900') },
    WEEKLY: { code: 'WEEK', name: 'Weekly Plan', duration: 7, price: parseInt(settingsOps.get('weekly_price') || process.env.PRICE_WEEKLY || '19900') },
    MONTHLY: { code: 'MNTH', name: 'Monthly Plan', duration: 30, price: parseInt(settingsOps.get('monthly_price') || process.env.PRICE_MONTHLY || '49900') }
};

// License key generation functions
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

// Email sending function
async function sendLicenseEmail(email, name, licenseKey, tier, expiryDate, deviceId) {
    const mailOptions = {
        from: `"Interview Round AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Your Interview AI License Key',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">Interview AI</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your License Key is Ready!</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p>Hi ${name || 'there'},</p>
                    
                    <p>Thank you for purchasing Interview AI! Your license has been successfully activated.</p>
                    
                    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Your License Key:</h3>
                        <p style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #667eea; margin: 0;">
                            ${licenseKey}
                        </p>
                    </div>
                    
                    <h3>License Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0;"><strong>Plan:</strong> ${tier}</li>
                        <li style="padding: 8px 0;"><strong>Device ID:</strong> ${deviceId}</li>
                        <li style="padding: 8px 0;"><strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString()}</li>
                    </ul>
                    
                    <h3>How to Activate:</h3>
                    <ol style="line-height: 1.8;">
                        <li>Open Interview AI application</li>
                        <li>When prompted, paste your license key</li>
                        <li>Click "Activate License"</li>
                        <li>Start practicing!</li>
                    </ol>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Important:</strong> This license is tied to Device ID: <code>${deviceId}</code>. 
                            If you reinstall the app, you'll need to use the same device or contact support for a new key.
                        </p>
                    </div>
                    
                    <p>If you have any questions or need support, reply to this email.</p>
                    
                    <p>Happy interviewing!<br>
                    <strong>The Interview AI Team</strong></p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>© 2025 Interview AI. All rights reserved.</p>
                </div>
            </div>
        `,
        text: `
Interview AI - Your License Key

Hi ${name || 'there'},

Thank you for purchasing Interview AI! Your license has been successfully activated.

YOUR LICENSE KEY: ${licenseKey}

License Details:
- Plan: ${tier}
- Device ID: ${deviceId}
- Expires: ${new Date(expiryDate).toLocaleDateString()}

How to Activate:
1. Open Interview AI application
2. When prompted, paste your license key
3. Click "Activate License"
4. Start practicing!

IMPORTANT: This license is tied to Device ID: ${deviceId}
If you reinstall the app, you'll need to use the same device or contact support for a new key.

If you have any questions or need support, reply to this email.

Happy interviewing!
The Interview AI Team
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
}

// Routes

// Get current server time for license synchronization
app.get('/api/time', (req, res) => {
    res.json({ success: true, timestamp: Date.now() });
});

// Activate or verify a license key (One-Time Use Enforcement)
app.post('/api/license/activate', (req, res) => {
    try {
        const { licenseKey, deviceId } = req.body;
        if (!licenseKey || !deviceId) {
            return res.status(400).json({ success: false, error: 'Missing licenseKey or deviceId' });
        }

        // Check if device is banned
        if (deviceOps.isBanned(deviceId)) {
            return res.status(403).json({
                success: false,
                error: 'Your device has been banned from using this service. Please contact support.'
            });
        }

        // Check if this key has already been activated in the database
        const existing = licenseOps.findByKey(licenseKey);

        if (existing) {
            // Key has been activated before
            if (existing.deviceId === deviceId) {
                // Same device - allow re-activation (e.g. after re-install)
                return res.json({
                    success: true,
                    message: 'License re-verified successfully.',
                    expiryDate: existing.expiryDate,
                    tier: existing.tier
                });
            } else {
                // Different device - REJECT (One key per device)
                return res.status(403).json({
                    success: false,
                    error: 'This license key is already locked to another device and cannot be reused.'
                });
            }
        }

        // --- NEW SECURITY CHECK: Verify if key was generated for this device ---
        const parts = licenseKey.split('-');
        if (parts.length >= 2) {
            const embeddedHash = parts[1];
            const actualHash = deviceId.substring(0, 8).toUpperCase();
            if (embeddedHash !== actualHash && embeddedHash !== 'ADMIN') { // Allow 'ADMIN' as a wildcard hash for debugging
                return res.status(403).json({
                    success: false,
                    error: 'This license key was generated for a different device and is not valid here.'
                });
            }
        }

        // First time activation - "Burn" the key to this device
        const tier = licenseKey.substring(0, 4); // HR01, WEEK, etc.

        // Extract expiry from key format (TIER-HASH-YYYYMMDD-CHKSUM)
        // NOTE: reuse `parts` from the device hash check above
        let expiryDate = new Date();
        if (parts.length >= 3 && /^\d{8}$/.test(parts[2])) {
            const dateStr = parts[2];
            expiryDate = new Date(
                parseInt(dateStr.substring(0, 4)),
                parseInt(dateStr.substring(4, 6)) - 1,
                parseInt(dateStr.substring(6, 8)),
                23, 59, 59
            );
        } else {
            // Default to 1 year if format doesn't match
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }

        const newLicense = licenseOps.create(0, licenseKey, tier, deviceId, expiryDate, 'active');

        res.json({
            success: true,
            message: 'License activated and locked to this device.',
            expiryDate: newLicense.expiryDate,
            tier: newLicense.tier
        });

    } catch (error) {
        console.error('License activation error:', error);
        res.status(500).json({ success: false, error: 'Internal server error during activation.' });
    }
});

// ── ADMIN: Ban a license key ──
app.post('/api/admin/ban-license', (req, res) => {
    try {
        const { licenseKey } = req.body;
        if (!licenseKey) {
            return res.status(400).json({ success: false, error: 'Missing licenseKey' });
        }

        const license = licenseOps.findByKey(licenseKey);
        if (!license) {
            return res.status(404).json({ success: false, error: 'License key not found in database.' });
        }

        licenseOps.updateStatus(licenseKey, 'banned');
        console.log('🚫 License banned:', licenseKey);

        res.json({
            success: true,
            message: `License ${licenseKey} has been banned.`,
            license: { ...license, status: 'banned' }
        });
    } catch (error) {
        console.error('Ban license error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ── ADMIN: Unban a license key ──
app.post('/api/admin/unban-license', (req, res) => {
    try {
        const { licenseKey } = req.body;
        if (!licenseKey) {
            return res.status(400).json({ success: false, error: 'Missing licenseKey' });
        }

        const license = licenseOps.findByKey(licenseKey);
        if (!license) {
            return res.status(404).json({ success: false, error: 'License key not found.' });
        }

        licenseOps.updateStatus(licenseKey, 'active');
        console.log('✅ License unbanned:', licenseKey);

        res.json({
            success: true,
            message: `License ${licenseKey} has been unbanned.`,
            license: { ...license, status: 'active' }
        });
    } catch (error) {
        console.error('Unban license error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ── APP: Check if a license key is still valid (not banned) ──
app.post('/api/license/check', (req, res) => {
    try {
        const { licenseKey, deviceId } = req.body;
        if (!licenseKey) {
            return res.status(400).json({ success: false, error: 'Missing licenseKey' });
        }

        // Check if device is banned (if deviceId provided)
        if (deviceId && deviceOps.isBanned(deviceId)) {
            return res.json({
                success: true,
                status: 'banned',
                message: 'Your device has been banned from using this service.'
            });
        }

        const license = licenseOps.findByKey(licenseKey);

        // Key not in DB = check if device is banned globally
        if (!license) {
            // If deviceId was provided, check device ban even for unknown keys
            if (deviceId && deviceOps.isBanned(deviceId)) {
                return res.json({ success: true, status: 'banned', message: 'Your device has been banned from using this service.' });
            }
            return res.json({ success: true, status: 'active' });
        }

        // Check if the license key itself is banned
        if (license.status === 'banned') {
            return res.json({ success: true, status: 'banned', message: 'This license has been banned by the administrator.' });
        }

        // Check if the original device that activated the key is now banned
        if (license.deviceId && deviceOps.isBanned(license.deviceId)) {
            return res.json({ success: true, status: 'banned', message: 'Your device has been banned from using this service.' });
        }

        return res.json({ success: true, status: license.status });
    } catch (error) {
        console.error('License check error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ── ADMIN: List all licenses ──
app.get('/api/admin/licenses', (req, res) => {
    try {
        const licenses = licenseOps.getAll();
        res.json({ success: true, licenses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── ADMIN: Ban a Device ID ──
app.post('/api/admin/ban-device', (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'Missing deviceId' });
        }

        // 1. Add device to blacklist
        deviceOps.ban(deviceId);

        // 2. Also ban ALL license keys tied to this device (prefix match)
        const allLicenses = licenseOps.getAll();
        let bannedKeys = [];
        for (const license of allLicenses) {
            if (license.deviceId) {
                const storedUpper = license.deviceId.toUpperCase();
                const inputUpper = deviceId.toUpperCase();
                // Prefix match: either 8-char matches, or full match
                if (storedUpper.startsWith(inputUpper) || inputUpper.startsWith(storedUpper.substring(0, 8))) {
                    licenseOps.updateStatus(license.licenseKey, 'banned');
                    bannedKeys.push(license.licenseKey);
                }
            }
        }

        console.log(`🚫 Device banned: ${deviceId} | Also banned ${bannedKeys.length} license(s)`);

        res.json({
            success: true,
            message: `Device ${deviceId} has been banned.`,
            bannedLicenses: bannedKeys.length,
            keys: bannedKeys
        });
    } catch (error) {
        console.error('Ban device error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ── ADMIN: Unban a Device ID ──
app.post('/api/admin/unban-device', (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'Missing deviceId' });
        }

        deviceOps.unban(deviceId);
        console.log('✅ Device unbanned:', deviceId);

        res.json({
            success: true,
            message: `Device ${deviceId} has been unbanned.`
        });
    } catch (error) {
        console.error('Unban device error:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ── ADMIN: List Banned Devices ──
app.get('/api/admin/banned-devices', (req, res) => {
    try {
        const banned = deviceOps.getAllBanned();
        res.json({ success: true, banned });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── APP: Health Check ──
app.get('/health', (req, res) => res.json({ status: 'ok', database: 'json', session: 'ready' }));

// ── APP: Redirect root to landing page ──
app.get('/', (req, res) => res.redirect('/index.html'));

// ── ADMIN: Easy shortcuts ──
app.get('/admin', (req, res) => res.redirect('/admin.html'));
app.get('/license-gen', (req, res) => res.redirect('/license-generator.html'));

// Get current pricing
app.get('/api/pricing', (req, res) => {
    try {
        // Get pricing from database settings or use defaults
        const dailyPrice = parseInt(settingsOps.get('daily_price') || process.env.PRICE_DAILY || '9900');
        const weeklyPrice = parseInt(settingsOps.get('weekly_price') || process.env.PRICE_WEEKLY || '19900');
        const monthlyPrice = parseInt(settingsOps.get('monthly_price') || process.env.PRICE_MONTHLY || '49900');

        const pricing = {
            daily: dailyPrice,
            weekly: weeklyPrice,
            monthly: monthlyPrice,
            demo_url: settingsOps.get('demo_download_url') || 'https://github.com/ashu/interview-ai/releases/download/v1.0.0/Interview-AI-Demo.exe',
            pro_url: settingsOps.get('pro_download_url') || 'https://github.com/ashu/interview-ai/releases/download/v1.0.0/Interview-AI-Pro.exe',
            elite_url: settingsOps.get('elite_download_url') || 'https://github.com/ashu/interview-ai/releases/download/v1.0.0/Interview-AI-Elite.exe',
            currency: settingsOps.get('default_currency') || 'INR',
            exchange_rate: parseInt(settingsOps.get('exchange_rate') || '85')
        };
        res.json({ success: true, pricing });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update pricing (admin only)
app.post('/api/admin/update-pricing', (req, res) => {
    try {
        const { daily, weekly, monthly, demo_url, pro_url, elite_url, currency, exchange_rate } = req.body;

        // Validate
        if (!daily || !weekly || !monthly) {
            return res.status(400).json({ error: 'Missing pricing values' });
        }

        // Save to database
        settingsOps.set('daily_price', daily.toString());
        settingsOps.set('weekly_price', weekly.toString());
        settingsOps.set('monthly_price', monthly.toString());

        if (demo_url) settingsOps.set('demo_download_url', demo_url);
        if (pro_url) settingsOps.set('pro_download_url', pro_url);
        if (elite_url) settingsOps.set('elite_download_url', elite_url);
        if (currency) settingsOps.set('default_currency', currency);
        if (exchange_rate) settingsOps.set('exchange_rate', exchange_rate.toString());

        // Update in-memory tiers
        LICENSE_TIERS.DAILY.price = parseInt(daily);
        LICENSE_TIERS.WEEKLY.price = parseInt(weekly);
        LICENSE_TIERS.MONTHLY.price = parseInt(monthly);

        res.json({
            success: true,
            message: 'Settings updated successfully!',
            pricing: { daily, weekly, monthly, demo_url, pro_url, elite_url }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track clicks (demo/pro)
app.post('/api/track-click', (req, res) => {
    try {
        const { type } = req.body;
        if (!['demo', 'pro'].includes(type)) {
            return res.status(400).json({ error: 'Invalid click type' });
        }

        const stats = analyticsOps.increment(type);
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get admin stats (analytics + users)
app.get('/api/admin/stats', (req, res) => {
    try {
        const analytics = analyticsOps.getStats();

        // Get all licenses for counting
        const licenses = licenseOps.getAll();

        res.json({
            success: true,
            analytics,
            users: transactions,
            licenseCount: licenses.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create order (enhanced with optional user email)
app.post('/create-order', paymentLimiter, async (req, res) => {
    try {
        const { amount, tier, deviceId, userEmail, userName } = req.body;

        // Validation
        if (!tier || !deviceId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: tier and deviceId'
            });
        }

        const tierInfo = LICENSE_TIERS[tier];
        if (!tierInfo) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier selected'
            });
        }

        // Find or create user if email is provided
        let userId = 0;
        if (userEmail) {
            let user = userOps.findByEmail(userEmail);
            if (!user) {
                user = userOps.create(null, userEmail, userName || 'Guest', null);
            }
            userId = user.id;
        }

        const order = await razorpay.orders.create({
            amount: tierInfo.price,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { deviceId, tier, userEmail: userEmail || 'none', userName: userName || 'Guest' }
        });

        // Create pending transaction
        transactionOps.create(userId, order.id, tierInfo.price, tier, 'pending');

        console.log('✅ Order created:', order.id);
        res.json({ success: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('❌ Order creation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify payment (enhanced with email sending)
app.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deviceId, tier, userEmail, userName } = req.body;

        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

        if (razorpay_signature !== expectedSign) {
            // Update transaction to failed if possible, but we might not want to expose this error detail if signature is wrong
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Update transaction status to success
        transactionOps.update(razorpay_payment_id, razorpay_signature, 'success', razorpay_order_id);

        const tierInfo = LICENSE_TIERS[tier];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + tierInfo.duration);

        const licenseKey = generateLicenseKey(deviceId, tierInfo.code, expiryDate);
        console.log('✅ License generated:', licenseKey);

        // Create license record
        if (userEmail) {
            const user = userOps.findByEmail(userEmail);
            if (user) {
                licenseOps.create(user.id, licenseKey, tierInfo.name, deviceId, expiryDate, 'active');
            }
        }

        // If user email provided, send email
        let emailSent = false;
        if (userEmail && userEmail !== 'none') {
            emailSent = await sendLicenseEmail(
                userEmail,
                userName || 'Valued Customer',
                licenseKey,
                tierInfo.name,
                expiryDate,
                deviceId
            );
        }

        res.json({
            success: true,
            licenseKey,
            tier: tierInfo.name,
            expiryDate: expiryDate.toISOString(),
            emailSent,
            email: userEmail || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Test database endpoint
app.get('/api/test-db', (req, res) => {
    try {
        const settings = settingsOps.getAll();
        res.json({
            success: true,
            message: 'Database is working!',
            currentSettings: settings
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const testSent = await sendLicenseEmail(
            email,
            'Test User',
            'TEST-12345678-20251231-ABCD',
            'Test Plan',
            new Date(),
            'TEST-DEVICE-ID'
        );

        res.json({ success: testSent, message: testSent ? 'Test email sent!' : 'Email failed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID ? '✓' : '✗'}`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? '✓' : '✗'}`);
    console.log(`💾 Database: JSON (file-based)`);
    console.log('='.repeat(50));
    console.log('\n📝 Test Endpoints:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/api/test-db`);
    console.log(`   POST http://localhost:${PORT}/api/test-email`);
    console.log(`   GET  http://localhost:${PORT}/api/pricing`);
    console.log('\n💡 Tip: OAuth not required for testing payment flow!');
    console.log('='.repeat(50));
});
