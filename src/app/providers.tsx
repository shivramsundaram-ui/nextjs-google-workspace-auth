"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side session provider wrapper
 * Required for NextAuth in App Router
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
