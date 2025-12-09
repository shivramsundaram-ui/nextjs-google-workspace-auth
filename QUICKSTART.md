# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- Google Account
- Terminal/Command line access

## Step 1: Install Dependencies (1 min)

```bash
cd nextjs-google-workspace-auth
npm install
```

## Step 2: Google Cloud Setup (2 mins)

### A. Create Project & Enable APIs

1. Go to https://console.cloud.google.com
2. Create new project: "NextJS Google Auth"
3. Enable these APIs:
   - Google Drive API
   - Google Calendar API  
   - Gmail API

### B. Create OAuth Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Configure consent screen (External, add your email)
3. Application type: **Web application**
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. **Copy Client ID and Client Secret**

## Step 3: Configure Environment (1 min)

Create `.env.local` file:

```bash
# Generate secret
openssl rand -base64 32

# Copy to .env.local
NEXTAUTH_SECRET=<paste-generated-secret>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<paste-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<paste-client-secret>
```

## Step 4: Run Application (1 min)

```bash
npm run dev
```

Open http://localhost:3000

## Step 5: Test Features

1. Click **"Sign in with Google"**
2. Grant permissions
3. You'll be redirected to dashboard
4. Test each button:
   - ✅ Load Profile
   - ✅ List Drive Files  
   - ✅ Create Folder
   - ✅ List Calendar Events
   - ✅ List Gmail Messages

## That's It! 🎉

You now have a fully working Google Workspace authentication system.

## Common First-Time Issues

**"Redirect URI Mismatch"**
- Ensure Google Console has exactly: `http://localhost:3000/api/auth/callback/google`

**"No refresh token"**  
- Remove app from https://myaccount.google.com/permissions
- Sign in again

**"API not enabled"**
- Wait 1-2 minutes after enabling APIs
- Check console.cloud.google.com

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture
- See [OAUTH_REFRESH_TOKENS.md](OAUTH_REFRESH_TOKENS.md) for token details

## Need Help?

1. Check browser console (F12)
2. Check terminal for errors
3. Review [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)
4. Verify all environment variables are set

---

**Happy coding! 🚀**
