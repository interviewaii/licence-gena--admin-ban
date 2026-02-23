require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Debugging Email Configuration...');
console.log('-----------------------------------');

// 1. Check Environment Variables
console.log('1. Checking .env variables:');
if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL_USER is MISSING in .env');
} else {
    console.log('✅ EMAIL_USER is set:', process.env.EMAIL_USER);
}

if (!process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_PASS is MISSING in .env');
} else {
    console.log('✅ EMAIL_PASS is set (length:', process.env.EMAIL_PASS.length, ')');
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('\n⛔ STOPPING: Please add EMAIL_USER and EMAIL_PASS to backend/.env file');
    process.exit(1);
}

// 2. Configure Transporter
console.log('\n2. Configuring Nodemailer...');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 3. Send Test Email
console.log('\n3. Attempting to send test email...');
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to self
    subject: '✅ Interview AI - Debug Test',
    text: 'If you received this, your email configuration is working perfectly!'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('\n❌ EMAIL SENDING FAILED!');
        console.error('---------------------------');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 TIP: This is usually an authentication error.');
            console.log('   1. Make sure you are using a Gmail App Password, NOT your login password.');
            console.log('   2. Generate one here: https://myaccount.google.com/apppasswords');
            console.log('   3. Make sure there are no extra spaces in .env file');
        }
    } else {
        console.log('\n✅ SUCCESS! Email sent successfully.');
        console.log('Response:', info.response);
        console.log('\n👉 Go check your inbox (' + process.env.EMAIL_USER + ')');
    }
});
