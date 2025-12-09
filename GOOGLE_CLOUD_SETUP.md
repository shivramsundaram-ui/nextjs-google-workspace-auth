# Google Cloud Setup Guide

Complete step-by-step guide to configure Google Cloud for this application.

## Prerequisites

- Google Account
- Access to Google Cloud Console
- Project billing enabled (for production use)

## Step 1: Create Google Cloud Project

1. **Navigate to Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click on project dropdown (top-left)
   - Click "New Project"
   - Enter project name: `nextjs-google-workspace`
   - Organization: (Select if applicable)
   - Click "CREATE"
   - Wait for project creation (~30 seconds)

3. **Select Your Project**
   - Use project dropdown to select your new project
   - Note the Project ID (you'll need this)

## Step 2: Enable Required APIs

### Option A: Using Console UI

1. **Navigate to APIs & Services**
   - From sidebar: APIs & Services → Library

2. **Enable Google Drive API**
   - Search for "Google Drive API"
   - Click on "Google Drive API"
   - Click "ENABLE"
   - Wait for confirmation

3. **Enable Google Calendar API**
   - Search for "Google Calendar API"
   - Click on "Google Calendar API"
   - Click "ENABLE"

4. **Enable Gmail API**
   - Search for "Gmail API"
   - Click on "Gmail API"
   - Click "ENABLE"

### Option B: Using gcloud CLI

```bash
# Install gcloud CLI first: https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable drive.googleapis.com
gcloud services enable calendar-json.googleapis.com
gcloud services enable gmail.googleapis.com

# Verify enabled APIs
gcloud services list --enabled
```

## Step 3: Configure OAuth Consent Screen

**IMPORTANT:** You must configure this before creating credentials.

1. **Navigate to OAuth Consent Screen**
   - APIs & Services → OAuth consent screen

2. **Choose User Type**
   - **Internal**: For Google Workspace domains only
   - **External**: For any Google account (choose this for development)
   - Click "CREATE"

3. **App Information**
   - **App name**: `Next.js Google Workspace Auth`
   - **User support email**: Your email
   - **App logo**: (Optional)
   - **Application home page**: `http://localhost:3000`
   - **Application privacy policy**: (Optional for dev)
   - **Application terms of service**: (Optional for dev)
   - **Authorized domains**: (Leave empty for dev)
   - **Developer contact email**: Your email
   - Click "SAVE AND CONTINUE"

4. **Scopes**
   - Click "ADD OR REMOVE SCOPES"
   - Filter and select these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
     - `.../auth/drive`
     - `.../auth/calendar`
     - `.../auth/gmail.readonly`
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

5. **Test Users** (for External apps in testing)
   - Click "ADD USERS"
   - Add your Google email
   - Add any other test user emails
   - Click "SAVE AND CONTINUE"

6. **Summary**
   - Review your settings
   - Click "BACK TO DASHBOARD"

## Step 4: Create OAuth 2.0 Credentials

1. **Navigate to Credentials**
   - APIs & Services → Credentials

2. **Create Credentials**
   - Click "CREATE CREDENTIALS"
   - Select "OAuth client ID"

3. **Configure OAuth Client**
   - **Application type**: Web application
   - **Name**: `Next.js Development Client`

4. **Authorized JavaScript Origins** (Optional)
   - Add: `http://localhost:3000`
   - Add: `https://yourdomain.com` (for production)

5. **Authorized Redirect URIs** ⚠️ CRITICAL
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
   - Click "ADD URI" for each
   
   **Format must be exact:**
   ```
   {NEXTAUTH_URL}/api/auth/callback/google
   ```

6. **Create**
   - Click "CREATE"
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Click "OK"

7. **Download Credentials** (Optional)
   - Click download icon next to your credential
   - Save JSON file securely
   - **Never commit this to git**

## Step 5: Configure Application

1. **Update .env.local**
   
   ```bash
   # Generate secret
   openssl rand -base64 32
   
   # Update .env.local
   NEXTAUTH_SECRET=<generated-secret>
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   ```

2. **Verify Configuration**
   
   ```bash
   # Check all variables are set
   cat .env.local
   ```

## Step 6: Test Authentication

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to App**
   - Open http://localhost:3000
   - Click "Sign in with Google"

3. **OAuth Consent Flow**
   - Select your Google account
   - Review permissions
   - Click "Continue" or "Allow"

4. **Verify Success**
   - Should redirect to `/dashboard`
   - Check for user email display
   - Check browser console for errors

## Step 7: Test API Endpoints

1. **Test Profile**
   - Click "Load Profile" button
   - Should show user info and token status

2. **Test Drive API**
   - Click "List Drive Files"
   - Should return your Drive files
   - If empty, that's OK if you have no files

3. **Test Calendar API**
   - Click "List Upcoming Events"
   - Should return calendar events

4. **Test Gmail API**
   - Click "List Inbox Messages"
   - Should return recent emails

## Common Issues

### Issue: "Redirect URI Mismatch"

**Cause:** Redirect URI in Google Console doesn't match

**Solution:**
```bash
# Check your NEXTAUTH_URL
echo $NEXTAUTH_URL

# Ensure Google Console has exact URL:
http://localhost:3000/api/auth/callback/google

# Not:
- http://localhost:3000/
- http://localhost:3000/api/auth/callback
- https://localhost:3000/api/auth/callback/google
```

### Issue: "Access Denied" or "Insufficient Permissions"

**Cause:** Scopes not properly configured

**Solution:**
1. Go to OAuth consent screen
2. Click "EDIT APP"
3. Go to Scopes section
4. Ensure all required scopes are added
5. Save changes

### Issue: "This app isn't verified"

**Cause:** External app in testing mode

**Solution:**
- Development: Click "Advanced" → "Go to [App] (unsafe)"
- Production: Submit app for verification (only if public)

### Issue: Refresh Token is null

**Cause:** User already granted permissions without `prompt=consent`

**Solution:**
1. Go to https://myaccount.google.com/permissions
2. Find your app
3. Click "Remove Access"
4. Sign in again to app
5. Consent screen will appear
6. Refresh token will be returned

### Issue: API Returns 403 Forbidden

**Cause:** API not enabled in Google Cloud

**Solution:**
```bash
# Verify enabled APIs
gcloud services list --enabled | grep -E 'drive|calendar|gmail'

# Enable if missing
gcloud services enable drive.googleapis.com
gcloud services enable calendar-json.googleapis.com
gcloud services enable gmail.googleapis.com
```

### Issue: Quota Exceeded

**Cause:** Hit daily/per-user quota limits

**Solution:**
1. Check quotas in Google Cloud Console
2. Quotas & System Limits
3. Enable billing for higher quotas
4. Implement request caching
5. Add exponential backoff retry logic

## Production Checklist

Before going to production:

- [ ] Create separate production project
- [ ] Enable billing
- [ ] Request quota increases if needed
- [ ] Add production redirect URIs
- [ ] Update OAuth consent screen for production
- [ ] Submit for app verification (if public)
- [ ] Set up monitoring and logging
- [ ] Configure error tracking
- [ ] Test with multiple user accounts
- [ ] Review and restrict scopes to minimum needed
- [ ] Set up Cloud Logging
- [ ] Configure rate limiting
- [ ] Add production environment variables to Vercel

## Security Best Practices

1. **Credentials Security**
   - Never commit credentials to git
   - Use environment variables
   - Rotate secrets regularly
   - Use separate projects for dev/prod

2. **Scope Minimization**
   - Only request scopes you need
   - Document why each scope is needed
   - Review scopes periodically

3. **Token Management**
   - Store tokens encrypted
   - Never log tokens
   - Implement token rotation
   - Set appropriate expiry times

4. **Access Control**
   - Implement user role checks
   - Add rate limiting
   - Monitor API usage
   - Log security events

## Monitoring and Logging

### Enable Cloud Logging

```bash
# Install logging client
npm install @google-cloud/logging

# In your code
import { Logging } from '@google-cloud/logging';
const logging = new Logging();
```

### Monitor API Usage

1. Go to APIs & Services → Dashboard
2. View API usage metrics
3. Set up alerts for quota limits
4. Monitor error rates

### Set Up Alerts

```bash
# Using gcloud
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="API Quota Alert" \
  --condition-display-name="Quota > 80%" \
  --condition-threshold-value=0.8
```

## Next Steps

1. **Review README.md** for application usage
2. **Test all API endpoints** systematically
3. **Implement error handling** for production
4. **Set up monitoring** and alerting
5. **Plan for scale** and quota management

## Resources

- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Workspace APIs](https://developers.google.com/workspace)
- [API Quotas and Limits](https://developers.google.com/workspace/guides/limits)
- [NextAuth Documentation](https://next-auth.js.org)
