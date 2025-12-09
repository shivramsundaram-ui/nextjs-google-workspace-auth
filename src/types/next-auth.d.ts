import { DefaultSession } from "next-auth";

/**
 * Extended session type to include Google OAuth tokens and Azure ID token (from WIF)
 */
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string; // Azure AD ID token (via Google WIF)
    error?: string;
    user: {
      id?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  }
}

/**
 * Extended JWT type to store Google OAuth tokens and Azure ID token
 */
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string; // Azure AD ID token (via Google WIF)
    accessTokenExpires?: number;
    error?: string;
    id?: string;
  }
}

export {};
