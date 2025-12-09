import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware to protect routes
 * Only protects /dashboard/* paths
 * Uses NextAuth's withAuth middleware for session validation
 */
export default withAuth(
  function middleware(req) {
    // Additional custom logic can be added here
    // For example, role-based access control
    return NextResponse.next();
  },
  {
    callbacks: {
      // Only allow access if user is authenticated
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

/**
 * Configure which routes this middleware should run on
 * Only protects the dashboard and its sub-routes
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
