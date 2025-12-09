# Next.js 14+ Google Workspace Authentication

Complete, production-ready implementation of Google Workspace Authentication + Google APIs integration using Next.js 14+ App Router and NextAuth v5 (Auth.js).

## Features

✅ **NextAuth v5** with Google OAuth2 Provider
✅ **Automatic Token Refresh** - Access tokens refresh automatically
✅ **Google Drive API** - List, create folders, upload, delete files
✅ **Google Calendar API** - List events, create events
✅ **Gmail API** - Read inbox, read specific messages
✅ **Protected Routes** - Middleware-based route protection
✅ **Full TypeScript** - Complete type safety
✅ **Production Ready** - Deployment considerations included

## Tech Stack

- **Next.js 14+** (App Router)
- **NextAuth v5** (Auth.js)
- **TypeScript**
- **Google APIs Node.js Client**
- **Tailwind CSS**

## Project Structure

```
nextjs-google-workspace-auth/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts          # NextAuth configuration
│   │   │   └── google/
│   │   │       ├── drive/
│   │   │       │   ├── list/
│   │   │       │   │   └── route.ts      # List Drive files
│   │   │       │   ├── folder/
│   │   │       │   │   └── route.ts      # Create folder
│   │   │       │   ├── upload/
│   │   │       │   │   └── route.ts      # Upload file
│   │   │       │   └── file/
│   │   │       │       └── route.ts      # Delete file
│   │   │       ├── calendar/
│   │   │       │   ├── list/
│   │   │       │   │   └── route.ts      # List events
│   │   │       │   └── create/
│   │   │       │       └── route.ts      # Create event
│   │   │       └── gmail/
│   │   │           ├── list/
│   │   │           │   └── route.ts      # List messages
│   │   │           └── message/
│   │   │               └── route.ts      # Read message
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Dashboard UI
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Home/Sign-in page
│   │   ├── providers.tsx                 # Session provider
│   │   └── globals.css                   # Global styles
│   ├── lib/
│   │   └── google-client.ts              # Google OAuth helper
│   ├── types/
│   │   └── next-auth.d.ts                # TypeScript types
│   └── middleware.ts                     # Route protection
├── .env.local                            # Environment variables
├── package.json
├── tsconfig.json
└── next.config.js
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Cloud

#### a. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Note your Project ID

#### b. Enable Required APIs

Enable these APIs in your project:
- Google Drive API
- Google Calendar API
- Gmail API

```bash
# Or use gcloud CLI
gcloud services enable drive.googleapis.com
gcloud services enable calendar-json.googleapis.com
gcloud services enable gmail.googleapis.com
```

#### c. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Next.js Google Workspace Auth`
5. **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Create `.env.local`:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-here-run-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth consent screen
   - Requests offline access (`access_type=offline`)
   - Forces consent prompt (`prompt=consent`)

2. **Google returns authorization code**
   - NextAuth exchanges code for tokens
   - Receives: access_token, refresh_token, expires_in

3. **Tokens stored in JWT**
   - Access token (expires in ~1 hour)
   - Refresh token (long-lived)
   - Token expiry timestamp

4. **Session created**
   - JWT encoded and stored in cookie
   - Session object includes tokens

### Token Refresh Flow

```
Access Token Expired?
        ↓
   Yes → Use refresh_token
        ↓
   Call Google Token Endpoint
        ↓
   Receive new access_token
        ↓
   Update JWT with new token
        ↓
   Continue API call
```

**Automatic Refresh:**
- Happens in `jwt()` callback
- Checks expiry before each request
- 5-minute buffer before actual expiry
- Seamless to end user

### API Route Pattern

Every Google API route follows this pattern:

```typescript
1. Validate session (getServerSession)
2. Check for token errors
3. Initialize OAuth2 client with tokens
4. Call Google API
5. Return JSON response
```

### Google API Client Initialization

```typescript
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({
  access_token: accessToken,
  refresh_token: refreshToken
});

// Automatic refresh on token expiry
oauth2Client.on('tokens', (tokens) => {
  // New tokens received
});
```

## API Endpoints

### Drive Endpoints

**List Files**
```bash
GET /api/google/drive/list
```

**Create Folder**
```bash
POST /api/google/drive/folder
Body: { "name": "My Folder" }
```

**Upload File**
```bash
POST /api/google/drive/upload
Body: {
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "base64Data": "base64-encoded-content"
}
```

**Delete File**
```bash
DELETE /api/google/drive/file
Body: { "fileId": "file-id-here" }
```

### Calendar Endpoints

**List Events**
```bash
GET /api/google/calendar/list
```

**Create Event**
```bash
POST /api/google/calendar/create
Body: {
  "summary": "Meeting",
  "startDateTime": "2024-12-01T10:00:00Z",
  "endDateTime": "2024-12-01T11:00:00Z"
}
```

### Gmail Endpoints

**List Messages**
```bash
GET /api/google/gmail/list
```

**Read Message**
```bash
GET /api/google/gmail/message?id=MESSAGE_ID
```

## Production Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy to Vercel**
- Go to [Vercel](https://vercel.com)
- Import your repository
- Add environment variables:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (your production URL)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

3. **Update Google OAuth Redirect URI**
- Add production callback: `https://yourdomain.com/api/auth/callback/google`

### Environment Variables

**Required:**
- `NEXTAUTH_SECRET` - Secret for JWT encryption
- `NEXTAUTH_URL` - Application URL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional:**
- `NODE_ENV` - Set to `production`

### Security Considerations

1. **Secure Cookies**
   - NextAuth automatically uses secure cookies in production
   - `__Secure-` prefix added automatically
   - `httpOnly`, `sameSite=lax`

2. **Token Storage**
   - Tokens stored in encrypted JWT
   - Never exposed to client JavaScript
   - Refresh tokens never sent to browser

3. **HTTPS Required**
   - Google OAuth requires HTTPS in production
   - Vercel provides free SSL

4. **Environment Variables**
   - Never commit `.env.local`
   - Use Vercel's encrypted storage
   - Rotate secrets regularly

### Performance Optimization

1. **Edge Runtime** (Optional)
   - Can use Edge runtime for faster cold starts
   - Add to route: `export const runtime = 'edge'`
   - Note: `googleapis` library requires Node runtime

2. **API Route Caching**
   - Implement caching for repeated calls
   - Use Next.js cache headers

3. **Token Refresh Optimization**
   - 5-minute buffer prevents frequent refreshes
   - Refresh happens only when needed

### Google API Quotas

**Default Quotas (per day):**
- Drive API: 1 billion queries
- Calendar API: 1 million queries
- Gmail API: 1 billion queries

**Rate Limits:**
- 100 queries per 100 seconds per user
- 1000 queries per 100 seconds

**Monitoring:**
- Check quota usage in Google Cloud Console
- Enable billing for higher quotas
- Implement retry logic with exponential backoff

## Troubleshooting

### Refresh Token Not Returned

**Problem:** Google returns `null` for refresh_token

**Solution:**
1. Remove app from Google account permissions
2. Sign in again - consent screen must appear
3. Ensure `access_type=offline` and `prompt=consent`

### Token Expired Error

**Problem:** API calls fail with 401 Unauthorized

**Solution:**
- Check refresh token exists
- Verify refresh logic in `jwt()` callback
- Ensure Google credentials are correct

### CORS Errors

**Problem:** API calls fail in browser

**Solution:**
- Ensure API routes are on same domain
- Check Next.js configuration
- Verify middleware isn't blocking routes

### Session Not Persisting

**Problem:** User logged out on refresh

**Solution:**
- Check `NEXTAUTH_SECRET` is set
- Verify cookie domain matches
- Check browser cookie settings

## Advanced Usage

### Custom Scopes

Add more scopes in `route.ts`:

```typescript
scope: [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/contacts.readonly", // Add this
].join(" ")
```

### Service Account (Optional)

For server-to-server auth without user:

```typescript
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});
```

### Multiple Providers

Add more OAuth providers:

```typescript
providers: [
  GoogleProvider({ /* ... */ }),
  GitHubProvider({ /* ... */ }),
  // etc
]
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Workspace APIs](https://developers.google.com/workspace)

## License

MIT

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Google Cloud Console logs
3. Check browser console for errors
4. Review Next.js server logs
