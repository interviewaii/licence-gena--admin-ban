const fs = require('fs');
const path = require('path');

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
function readJSON(filepath, defaultData = []) {
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    try {
        const data = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filepath}:`, error);
        return defaultData;
    }
}

function writeJSON(filepath, data) {
    try {
        const tempFile = filepath + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, filepath);
        return true;
    } catch (error) {
        console.error(`Error writing ${filepath}:`, error);
        return false;
    }
}

// Initialize database
function initializeDatabase() {
    // Initialize users
    readJSON(USERS_FILE, []);

    // Initialize licenses
    readJSON(LICENSES_FILE, []);

    // Initialize transactions
    readJSON(TRANSACTIONS_FILE, []);

    // Initialize analytics
    readJSON(ANALYTICS_FILE, { demo_downloads: 0, pro_downloads: 0 });

    // Initialize settings with defaults
    const defaultSettings = {
        daily_price: '4900',
        weekly_price: '19900',
        monthly_price: '49900',
        razorpay_mode: 'test',
        razorpay_test_key_id: '',
        razorpay_test_key_secret: '',
        razorpay_live_key_id: '',
        razorpay_live_key_secret: '',
        demo_download_url: 'https://github.com/ashu-glitech/interview-ai-demo.exe/releases/download/v1.0.1/Interview-AI-Setup.exe',
        pro_download_url: 'https://github.com/ashu-glitech/interview-ai-demo.exe/releases/download/v1.0.0-pro/Interview-Pro-version.exe',
        elite_download_url: 'https://github.com/ashu-glitech/interview-ai-demo.exe/releases/download/v1.0.0-pro/Interview-Elite-version.exe',
        default_currency: 'INR',
        exchange_rate: '85',
        banned_devices: '[]'
    };

    const existingSettings = readJSON(SETTINGS_FILE, defaultSettings);
    // Merge with defaults to ensure all keys exist
    const mergedSettings = { ...defaultSettings, ...existingSettings };
    writeJSON(SETTINGS_FILE, mergedSettings);

    console.log('✅ Database initialized successfully (JSON storage)');
}

// User operations
const userOps = {
    findByGoogleId: (googleId) => {
        const users = readJSON(USERS_FILE, []);
        return users.find(u => u.googleId === googleId);
    },

    findById: (id) => {
        const users = readJSON(USERS_FILE, []);
        return users.find(u => u.id === id);
    },

    findByEmail: (email) => {
        const users = readJSON(USERS_FILE, []);
        return users.find(u => u.email === email);
    },

    create: (googleId, email, name, profilePic) => {
        const users = readJSON(USERS_FILE, []);
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            googleId,
            email,
            name,
            profilePic,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        writeJSON(USERS_FILE, users);
        return newUser;
    },

    getAll: () => {
        return readJSON(USERS_FILE, []);
    }
};

// License operations
const licenseOps = {
    create: (userId, licenseKey, tier, deviceId, expiryDate, status = 'active') => {
        const licenses = readJSON(LICENSES_FILE, []);
        const newLicense = {
            id: licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1,
            userId,
            licenseKey,
            tier,
            deviceId,
            expiryDate: expiryDate.toISOString(),
            status,
            createdAt: new Date().toISOString()
        };
        licenses.push(newLicense);
        writeJSON(LICENSES_FILE, licenses);
        return newLicense;
    },

    findByUserId: (userId) => {
        const licenses = readJSON(LICENSES_FILE, []);
        return licenses.filter(l => l.userId === userId);
    },

    findByKey: (licenseKey) => {
        const licenses = readJSON(LICENSES_FILE, []);
        return licenses.find(l => l.licenseKey === licenseKey);
    },

    getAll: () => {
        return readJSON(LICENSES_FILE, []);
    },

    countByUserId: (userId) => {
        const licenses = readJSON(LICENSES_FILE, []);
        return licenses.filter(l => l.userId === userId).length;
    },

    updateStatus: (licenseKey, status) => {
        const licenses = readJSON(LICENSES_FILE, []);
        const license = licenses.find(l => l.licenseKey === licenseKey);
        if (license) {
            license.status = status;
            license.updatedAt = new Date().toISOString();
            writeJSON(LICENSES_FILE, licenses);
            return license;
        }
        return null;
    }
};

// Transaction operations
const transactionOps = {
    create: (userId, razorpayOrderId, amount, tier, status = 'pending') => {
        const transactions = readJSON(TRANSACTIONS_FILE, []);
        const newTransaction = {
            id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1,
            userId,
            razorpayOrderId,
            razorpayPaymentId: null,
            razorpaySignature: null,
            amount,
            tier,
            status,
            createdAt: new Date().toISOString()
        };
        transactions.push(newTransaction);
        writeJSON(TRANSACTIONS_FILE, transactions);
        return newTransaction;
    },

    update: (razorpayPaymentId, razorpaySignature, status, razorpayOrderId) => {
        const transactions = readJSON(TRANSACTIONS_FILE, []);
        const transaction = transactions.find(t => t.razorpayOrderId === razorpayOrderId);
        if (transaction) {
            transaction.razorpayPaymentId = razorpayPaymentId;
            transaction.razorpaySignature = razorpaySignature;
            transaction.status = status;
            writeJSON(TRANSACTIONS_FILE, transactions);
            return transaction;
        }
        return null;
    },

    findByUserId: (userId) => {
        const transactions = readJSON(TRANSACTIONS_FILE, []);
        return transactions.filter(t => t.userId === userId);
    },

    getAll: () => {
        const transactions = readJSON(TRANSACTIONS_FILE, []);
        const users = readJSON(USERS_FILE, []);

        // Join with users data
        return transactions.map(t => {
            const user = users.find(u => u.id === t.userId);
            return {
                ...t,
                userEmail: user ? user.email : 'N/A',
                userName: user ? user.name : 'Guest'
            };
        });
    },

    getTotalSpentByUser: (userId) => {
        const transactions = readJSON(TRANSACTIONS_FILE, []);
        const total = transactions
            .filter(t => t.userId === userId && t.status === 'success')
            .reduce((sum, t) => sum + t.amount, 0);
        return total;
    }
};

// Settings operations
const settingsOps = {
    get: (key) => {
        const settings = readJSON(SETTINGS_FILE, {});
        return settings[key] || null;
    },

    set: (key, value) => {
        const settings = readJSON(SETTINGS_FILE, {});
        settings[key] = value;
        writeJSON(SETTINGS_FILE, settings);
        return true;
    },

    getAll: () => {
        return readJSON(SETTINGS_FILE, {});
    }
};

// Analytics operations
const analyticsOps = {
    increment: (type) => {
        const analytics = readJSON(ANALYTICS_FILE, { demo_downloads: 0, pro_downloads: 0 });
        if (type === 'demo') {
            analytics.demo_downloads = (analytics.demo_downloads || 0) + 1;
        } else if (type === 'pro') {
            analytics.pro_downloads = (analytics.pro_downloads || 0) + 1;
        }
        writeJSON(ANALYTICS_FILE, analytics);
        return analytics;
    },

    getStats: () => {
        return readJSON(ANALYTICS_FILE, { demo_downloads: 0, pro_downloads: 0 });
    }
};

// Device operations
const deviceOps = {
    // Check if a device is banned — supports full hash OR 8-char display ID (prefix match)
    isBanned: (deviceId) => {
        try {
            const bannedStr = settingsOps.get('banned_devices') || '[]';
            const banned = JSON.parse(bannedStr);
            const idLower = deviceId.toLowerCase();
            const idUpper = deviceId.toUpperCase();
            return banned.some(b => {
                const bLower = b.toLowerCase();
                const bUpper = b.toUpperCase();
                // Exact match OR prefix match (8-char display ID vs full hash)
                return bLower === idLower ||
                    bUpper.startsWith(idUpper) ||
                    idUpper.startsWith(bUpper.substring(0, 8));
            });
        } catch { return false; }
    },

    ban: (deviceId) => {
        try {
            const bannedStr = settingsOps.get('banned_devices') || '[]';
            const banned = JSON.parse(bannedStr);
            // Prevent duplicate (case-insensitive)
            const idLower = deviceId.toLowerCase();
            if (!banned.some(b => b.toLowerCase() === idLower)) {
                banned.push(deviceId);
                settingsOps.set('banned_devices', JSON.stringify(banned));
            }
            return true;
        } catch { return false; }
    },

    unban: (deviceId) => {
        try {
            const bannedStr = settingsOps.get('banned_devices') || '[]';
            const banned = JSON.parse(bannedStr);
            const idLower = deviceId.toLowerCase();
            const filtered = banned.filter(b => {
                const bLower = b.toLowerCase();
                return bLower !== idLower &&
                    !bLower.startsWith(idLower) &&
                    !idLower.startsWith(bLower.substring(0, 8));
            });
            settingsOps.set('banned_devices', JSON.stringify(filtered));
            return true;
        } catch { return false; }
    },

    getAllBanned: () => {
        try {
            const bannedStr = settingsOps.get('banned_devices') || '[]';
            return JSON.parse(bannedStr);
        } catch { return []; }
    }
};

module.exports = {
    initializeDatabase,
    userOps,
    licenseOps,
    transactionOps,
    settingsOps,
    analyticsOps,
    deviceOps
};
