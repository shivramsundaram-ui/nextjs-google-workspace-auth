# OAuth 2.0 & Refresh Tokens - Complete Guide

Comprehensive explanation of how OAuth 2.0 and refresh tokens work in this application.

## Table of Contents

1. [OAuth 2.0 Overview](#oauth-20-overview)
2. [Authorization Flow](#authorization-flow)
3. [Token Types](#token-types)
4. [Refresh Token Mechanism](#refresh-token-mechanism)
5. [Implementation Details](#implementation-details)
6. [Best Practices](#best-practices)

---

## OAuth 2.0 Overview

OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service.

### Key Concepts

**Authorization vs Authentication:**
- **Authentication**: Who you are (Sign in)
- **Authorization**: What you can access (Permissions)

**OAuth Roles:**
- **Resource Owner**: User (you)
- **Client**: Next.js app
- **Authorization Server**: Google OAuth
- **Resource Server**: Google APIs (Drive, Calendar, Gmail)

---

## Authorization Flow

### Step-by-Step Flow

```
┌──────────┐                                           ┌──────────┐
│          │                                           │          │
│   User   │                                           │  Next.js │
│          │                                           │   App    │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │  1. Click "Sign in with Google"                     │
     ├─────────────────────────────────────────────────────>
     │                                                      │
     │  2. Redirect to Google OAuth                        │
     <─────────────────────────────────────────────────────┤
     │                                                      │
┌────▼─────┐                                               │
│  Google  │                                               │
│  OAuth   │                                               │
└────┬─────┘                                               │
     │                                                      │
     │  3. User logs in & grants permissions               │
     │                                                      │
     │  4. Redirect back with authorization code           │
     ├─────────────────────────────────────────────────────>
     │                                                      │
     │                                                 ┌────▼─────┐
     │                                                 │ NextAuth │
     │                                                 │          │
     │                                                 └────┬─────┘
     │                                                      │
     │  5. Exchange code for tokens                        │
     │  <──────────────────────────────────────────────────┤
     │                                                      │
     │  6. Return: access_token, refresh_token, expires_in │
     ├─────────────────────────────────────────────────────>
     │                                                      │
     │                                                 ┌────▼─────┐
     │                                                 │   JWT    │
     │                                                 │  Cookie  │
     │                                                 └──────────┘
```

### 1. Authorization Request

When user clicks "Sign in with Google", NextAuth constructs this URL:

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id={GOOGLE_CLIENT_ID}&
  redirect_uri={NEXTAUTH_URL}/api/auth/callback/google&
  response_type=code&
  scope=openid email profile https://www.googleapis.com/auth/drive ...&
  access_type=offline&
  prompt=consent
```

**Key Parameters:**

- `client_id`: Your app's identifier
- `redirect_uri`: Where Google sends the user after auth
- `response_type=code`: We want an authorization code
- `scope`: Permissions we're requesting
- `access_type=offline`: Request refresh token
- `prompt=consent`: Force consent screen (ensures refresh token)

### 2. User Consent

Google shows consent screen with:
- App name
- List of requested permissions
- User's Google account
- Allow/Deny buttons

### 3. Authorization Code

After user clicks "Allow", Google redirects:

```
{NEXTAUTH_URL}/api/auth/callback/google?code=AUTHORIZATION_CODE&scope=...
```

### 4. Token Exchange

NextAuth automatically exchanges the code for tokens:

**Request:**
```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=AUTHORIZATION_CODE&
client_id={GOOGLE_CLIENT_ID}&
client_secret={GOOGLE_CLIENT_SECRET}&
redirect_uri={NEXTAUTH_URL}/api/auth/callback/google&
grant_type=authorization_code
```

**Response:**
```json
{
  "access_token": "ya29.a0AfH6...",
  "refresh_token": "1//0gLq9Z...",
  "expires_in": 3599,
  "scope": "openid email profile ...",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1..."
}
```

---

## Token Types

### 1. Access Token

**Purpose:** Access protected resources (APIs)

**Characteristics:**
- Short-lived (typically 1 hour)
- Grants access to specific scopes
- Sent with every API request
- Cannot be refreshed directly

**Format:**
```
ya29.a0AfH6SMC6Y8...
```

**Usage:**
```http
GET https://www.googleapis.com/drive/v3/files
Authorization: Bearer ya29.a0AfH6SMC6Y8...
```

**When to Use:**
- Every API call to Google services
- Included in Authorization header

**Security:**
- Never exposed to client-side JavaScript
- Stored in encrypted JWT
- Server-side only

### 2. Refresh Token

**Purpose:** Obtain new access tokens

**Characteristics:**
- Long-lived (no expiration)
- Can be revoked by user
- Only returned once (usually)
- Must be stored securely

**Format:**
```
1//0gLq9Z0E-yxxxx...
```

**When to Use:**
- When access token expires
- Automatic refresh in background
- No user interaction needed

**Security:**
- NEVER send to client
- NEVER log or expose
- Store encrypted
- Rotate periodically

### 3. ID Token (JWT)

**Purpose:** Verify user identity

**Characteristics:**
- Contains user info (email, name, picture)
- Signed by Google
- Can be verified without API call

**Format:**
```
eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

**Decoded:**
```json
{
  "iss": "https://accounts.google.com",
  "sub": "123456789",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://...",
  "exp": 1234567890
}
```

---

## Refresh Token Mechanism

### How Token Refresh Works

```
┌─────────────────────────────────────────────────┐
│  1. User makes request to protected API route  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  2. NextAuth checks JWT from session cookie    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  3. Is access token expired?                   │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐      ┌─────▼─────┐
    │   NO    │      │    YES    │
    └────┬────┘      └─────┬─────┘
         │                 │
         │           ┌─────▼─────────────────────────────┐
         │           │  4. Use refresh_token to get new  │
         │           │     access_token from Google      │
         │           └─────┬─────────────────────────────┘
         │                 │
         │           ┌─────▼─────────────────────────────┐
         │           │  5. Update JWT with new tokens    │
         │           └─────┬─────────────────────────────┘
         │                 │
         └─────────┬───────┘
                   │
         ┌─────────▼───────────────────────────────┐
         │  6. Proceed with API call using valid   │
         │     access_token                        │
         └─────────────────────────────────────────┘
```

### Implementation in Code

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
async jwt({ token, account, user }): Promise<JWT> {
  // Initial sign in - store tokens
  if (account && user) {
    return {
      ...token,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      accessTokenExpires: account.expires_at * 1000,
    };
  }

  // Token still valid
  if (!isTokenExpired(token.accessTokenExpires)) {
    return token;
  }

  // Token expired - refresh it
  if (token.refreshToken) {
    const refreshedTokens = await refreshAccessToken(token.refreshToken);
    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: refreshedTokens.accessTokenExpires,
      refreshToken: refreshedTokens.refreshToken,
    };
  }

  // No refresh token - error
  return { ...token, error: "RefreshAccessTokenError" };
}
```

**File:** `src/lib/google-client.ts`

```typescript
export async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // This automatically calls Google's token endpoint
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      accessTokenExpires: credentials.expiry_date!,
      refreshToken: credentials.refresh_token || refreshToken,
    };
  } catch (error) {
    throw new Error("RefreshAccessTokenError");
  }
}
```

### Token Refresh Request

**What happens under the hood:**

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id={GOOGLE_CLIENT_ID}&
client_secret={GOOGLE_CLIENT_SECRET}&
refresh_token={REFRESH_TOKEN}&
grant_type=refresh_token
```

**Response:**
```json
{
  "access_token": "ya29.a0AfH6...",
  "expires_in": 3599,
  "scope": "openid email profile ...",
  "token_type": "Bearer"
}
```

**Note:** Refresh token usually NOT included in response (you keep the original)

---

## Implementation Details

### Token Storage

**Where tokens are stored:**

1. **Server-side (JWT)**
   ```
   Cookie: next-auth.session-token=eyJhbGciOiJIUzI1...
   ```
   
   **Decoded JWT payload:**
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "picture": "https://...",
     "sub": "123456789",
     "accessToken": "ya29.a0AfH6...",
     "refreshToken": "1//0gLq9Z...",
     "accessTokenExpires": 1234567890000,
     "iat": 1234567890,
     "exp": 1237159890,
     "jti": "abc123"
   }
   ```

2. **Never stored:**
   - ❌ localStorage
   - ❌ sessionStorage
   - ❌ Client-side state
   - ❌ URL parameters

### Token Expiry Check

**File:** `src/lib/google-client.ts`

```typescript
export function isTokenExpired(expiresAt: number): boolean {
  // Add 5 minute buffer before actual expiry
  const bufferTime = 5 * 60 * 1000;
  return Date.now() >= expiresAt - bufferTime;
}
```

**Why 5-minute buffer?**
- Prevents token expiring mid-request
- Allows time for API call completion
- Reduces "token expired" errors

### Automatic Refresh Flow

```typescript
// This runs on EVERY request that checks session
export const authOptions: AuthOptions = {
  callbacks: {
    async jwt({ token, account }) {
      // Check and refresh tokens automatically
      // Return updated token
    },
    async session({ session, token }) {
      // Pass tokens to session
      // Available in API routes via getServerSession()
    }
  }
}
```

### Using Tokens in API Routes

**Pattern:**

```typescript
export async function GET(request: NextRequest) {
  // 1. Get session (triggers token refresh if needed)
  const session = await getServerSession(authOptions);
  
  // 2. Validate session
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 3. Check for refresh errors
  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json({ 
      error: "Session expired. Please sign in again." 
    }, { status: 401 });
  }
  
  // 4. Initialize Google client with fresh token
  const oauth2Client = getGoogleClient(
    session.accessToken,
    session.refreshToken
  );
  
  // 5. Make API call
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const response = await drive.files.list({ pageSize: 10 });
  
  return NextResponse.json(response.data);
}
```

---

## Best Practices

### 1. Always Request Offline Access

```typescript
authorization: {
  params: {
    access_type: "offline",  // ✅ Get refresh token
    prompt: "consent",       // ✅ Force consent screen
  }
}
```

### 2. Store Tokens Securely

✅ **DO:**
- Encrypt tokens in JWT
- Use httpOnly cookies
- Server-side storage only
- Rotate NEXTAUTH_SECRET regularly

❌ **DON'T:**
- Store in localStorage
- Expose to client JavaScript
- Log tokens
- Store in URL parameters

### 3. Handle Token Refresh Gracefully

```typescript
// Check for refresh errors
if (session.error === "RefreshAccessTokenError") {
  // Redirect to sign in
  return signIn();
}
```

### 4. Implement Token Expiry Buffer

```typescript
// Don't wait until last second
const bufferTime = 5 * 60 * 1000; // 5 minutes
if (Date.now() >= expiresAt - bufferTime) {
  // Refresh now
}
```

### 5. Handle Missing Refresh Token

**Why it might be missing:**
- User already granted access (no `prompt=consent`)
- Revoked by user
- Expired (rare, but possible)

**Solution:**
```typescript
if (!refreshToken) {
  // Force re-authentication
  return signIn("google", { 
    callbackUrl: "/dashboard",
    prompt: "consent" 
  });
}
```

### 6. Revoke Tokens on Sign Out

```typescript
// Optional: Revoke Google tokens
await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
  method: 'POST'
});

// Then sign out
await signOut();
```

### 7. Monitor Token Usage

```typescript
oauth2Client.on('tokens', (tokens) => {
  console.log('Token refresh:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresAt: new Date(tokens.expiry_date)
  });
});
```

### 8. Implement Retry Logic

```typescript
async function callGoogleAPI(oauth2Client) {
  try {
    return await drive.files.list();
  } catch (error) {
    if (error.code === 401) {
      // Token might be expired, refresh and retry
      await oauth2Client.refreshAccessToken();
      return await drive.files.list();
    }
    throw error;
  }
}
```

---

## Common Scenarios

### Scenario 1: First Time User

1. User clicks "Sign in with Google"
2. Google shows consent screen
3. User clicks "Allow"
4. Google returns: access_token + **refresh_token** + expires_in
5. Both tokens stored in JWT
6. ✅ User can access app

### Scenario 2: Returning User

1. User opens app
2. NextAuth reads JWT from cookie
3. Checks if access_token is expired
4. If expired, uses refresh_token to get new access_token
5. ✅ Seamless access, no sign-in needed

### Scenario 3: Refresh Token Missing

1. User previously granted access without `prompt=consent`
2. No refresh_token stored
3. access_token expires
4. Cannot refresh automatically
5. ❌ User must sign in again

**Fix:** Always use `prompt=consent`

### Scenario 4: Token Revoked

1. User goes to Google Account settings
2. Removes app permissions
3. refresh_token becomes invalid
4. Next API call fails
5. ❌ User must sign in again

**Detection:**
```typescript
if (error.message === "RefreshAccessTokenError") {
  // Redirect to sign in
}
```

---

## Security Considerations

### 1. Token Leakage Prevention

**Threats:**
- XSS attacks
- CSRF attacks
- Man-in-the-middle
- Logging/debugging

**Mitigations:**
- httpOnly cookies (no JavaScript access)
- Secure flag (HTTPS only)
- SameSite=lax (CSRF protection)
- Never log tokens
- HTTPS in production

### 2. Refresh Token Rotation

Some providers rotate refresh tokens:
```typescript
// Always prefer new refresh token if provided
refreshToken: credentials.refresh_token || oldRefreshToken
```

### 3. Scope Minimization

Only request scopes you actually need:
```typescript
// ❌ DON'T request everything
scope: "https://www.googleapis.com/auth/drive"

// ✅ DO request specific access
scope: "https://www.googleapis.com/auth/drive.file" // Only user-created files
```

### 4. Token Validation

Validate tokens before use:
```typescript
// Check expiry
if (Date.now() >= token.exp * 1000) {
  throw new Error("Token expired");
}

// Verify signature (ID token)
const ticket = await oauth2Client.verifyIdToken({
  idToken: token,
  audience: GOOGLE_CLIENT_ID
});
```

---

## Debugging

### Check Token Status

```typescript
// In API route
const session = await getServerSession(authOptions);
console.log({
  hasAccessToken: !!session?.accessToken,
  hasRefreshToken: !!session?.refreshToken,
  expiresAt: new Date(session?.accessTokenExpires),
  error: session?.error
});
```

### Test Token Refresh

```typescript
// Force token to be expired
token.accessTokenExpires = Date.now() - 1000;
// Next request will trigger refresh
```

### Monitor Google OAuth

Enable detailed logging:
```typescript
oauth2Client.on('tokens', (tokens) => {
  console.log('Tokens received:', tokens);
});
```

---

## Resources

- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [JWT.io](https://jwt.io) - Decode JWTs
- [OAuth Playground](https://developers.google.com/oauthplayground)
