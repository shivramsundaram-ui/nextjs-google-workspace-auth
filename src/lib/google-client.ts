import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Creates and configures a Google OAuth2 client
 * @param accessToken - The user's access token
 * @param refreshToken - The user's refresh token (optional)
 * @returns Configured OAuth2Client instance
 */
export function getGoogleClient(
  accessToken: string,
  refreshToken?: string
): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  );

  // Set credentials on the client
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Add event listener to handle token refresh
  oauth2Client.on("tokens", (tokens) => {
    console.log("New tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expiry_date,
    });
  });

  return oauth2Client;
}

/**
 * Refreshes an expired access token using the refresh token
 * @param refreshToken - The user's refresh token
 * @returns New access token and expiry time
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
}> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Request new access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      accessTokenExpires: credentials.expiry_date!,
      // Google may return a new refresh token, otherwise keep the old one
      refreshToken: credentials.refresh_token || refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("RefreshAccessTokenError");
  }
}

/**
 * Checks if an access token is expired
 * @param expiresAt - Token expiry timestamp
 * @returns True if token is expired or will expire in the next 5 minutes
 */
export function isTokenExpired(expiresAt: number): boolean {
  // Add 5 minute buffer before actual expiry
  const bufferTime = 5 * 60 * 1000;
  return Date.now() >= expiresAt - bufferTime;
}
