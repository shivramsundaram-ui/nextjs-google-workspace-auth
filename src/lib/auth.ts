import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { refreshAccessToken, isTokenExpired } from "@/lib/google-client";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            // Basic OpenID Connect scopes
            "openid",
            "email",
            "profile",
            // User information (read-only)
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            // Admin Directory API (read-only)
            "https://www.googleapis.com/auth/admin.directory.group.readonly",
            "https://www.googleapis.com/auth/admin.directory.user.readonly",
            "https://www.googleapis.com/auth/directory.readonly",
            // Drive (read-only)
            "https://www.googleapis.com/auth/drive.readonly",
            // Calendar (read-only)
            "https://www.googleapis.com/auth/calendar.events.readonly",
            "https://www.googleapis.com/auth/calendar.readonly",
            // Contacts (read-only)
            "https://www.googleapis.com/auth/contacts.readonly",
            "https://www.googleapis.com/auth/contacts.other.readonly",
            // Cloud Identity Groups (read-only)
            "https://www.googleapis.com/auth/cloud-identity.groups.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        console.log("Initial sign in - storing tokens");
        console.log("Account object keys:", Object.keys(account));
        console.log("ID Token present:", !!account.id_token);
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token, // Capture ID token (contains Azure AD claims)
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          id: user.id,
        };
      }

      if (
        token.accessTokenExpires &&
        !isTokenExpired(token.accessTokenExpires as number)
      ) {
        console.log("Access token is still valid");
        return token;
      }

      if (token.refreshToken) {
        console.log("Access token expired, refreshing...");
        try {
          const refreshedTokens = await refreshAccessToken(
            token.refreshToken as string
          );

          return {
            ...token,
            accessToken: refreshedTokens.accessToken,
            accessTokenExpires: refreshedTokens.accessTokenExpires,
            refreshToken: refreshedTokens.refreshToken,
            // Keep the original ID token (doesn't get refreshed)
            error: undefined,
          };
        } catch (error) {
          console.error("Error refreshing access token:", error);
          return {
            ...token,
            error: "RefreshAccessTokenError",
          };
        }
      }

      console.warn("No refresh token available");
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.idToken = token.idToken as string; // Pass ID token to session
      session.error = token.error as string | undefined;

      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
