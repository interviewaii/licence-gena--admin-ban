# Google OAuth Setup Guide

## Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com

## Step 2: Create a New Project
1. Click "Select a project" dropdown at the top
2. Click "NEW PROJECT"
3. Project name: `Interview AI Licensing` (or your choice)
4. Click "CREATE"

## Step 3: Enable Google+ API
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "ENABLE"

## Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "CREATE"
4. Fill in:
   - App name: `Interview AI`
   - User support email: Your email
   - Developer contact: Your email
5. Click "SAVE AND CONTINUE"
6. On Scopes page: Click "ADD OR REMOVE SCOPES"
   - Select: `/auth/userinfo.email`
   - Select: `/auth/userinfo.profile`
7. Click "SAVE AND CONTINUE"
8. On Test users: Click "SAVE AND CONTINUE"

## Step 5: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: Select "Web application"
4. Name: `Interview AI Web Client`
5. Authorized redirect URIs:
   - Click "ADD URI"
   - Enter: `http://localhost:3000/auth/google/callback`
   - For production, also add: `https://yourdomain.com/auth/google/callback`
6. Click "CREATE"

## Step 6: Copy Your Credentials
You'll see a popup with:
- **Client ID**: Something like `123456789-abc.apps.googleusercontent.com`
- **Client Secret**: A random string

**IMPORTANT:** Copy both of these!

## Step 7: Add to .env File
1. Open `backend/.env` file (create if doesn't exist)
2. Add your credentials:

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=generate_random_string_here_click_keyboard_randomly
```

For SESSION_SECRET, just type a random string of characters (the longer the better).

## Step 8: Test It
Once you add these to `.env`, restart your backend server and OAuth should work!

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console EXACTLY matches the one in your `.env`
- Check for trailing slashes
- Verify the port number (3000)

### Error: "Access blocked"
- Go back to OAuth consent screen
- Make sure your email is added as a test user
- Or publish the app (not recommended during development)

### Still not working?
- Check that APIs are enabled
- Verify credentials are copied correctly
- Restart the backend server after changing `.env`
