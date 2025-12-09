import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";

/**
 * GET /api/google/gmail/list
 * Lists the latest 10 messages from Gmail inbox
 */
export async function GET(request: NextRequest) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    // Check for token refresh errors
    if (session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    // Initialize Google OAuth2 client with user's tokens
    const oauth2Client = getGoogleClient(
      session.accessToken,
      session.refreshToken
    );

    // Initialize Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // List messages from inbox
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      labelIds: ["INBOX"],
    });

    const messages = response.data.messages || [];

    // Fetch details for each message
    const messageDetails = await Promise.all(
      messages.map(async (message) => {
        try {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = details.data.payload?.headers || [];
          const from = headers.find((h) => h.name === "From")?.value || "";
          const subject =
            headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
          const date = headers.find((h) => h.name === "Date")?.value || "";

          return {
            id: details.data.id,
            threadId: details.data.threadId,
            snippet: details.data.snippet,
            from: from,
            subject: subject,
            date: date,
            labelIds: details.data.labelIds,
          };
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed message fetches
    const validMessages = messageDetails.filter((msg) => msg !== null);

    return NextResponse.json({
      success: true,
      messages: validMessages,
      count: validMessages.length,
    });
  } catch (error: any) {
    console.error("Error listing Gmail messages:", error);
    return NextResponse.json(
      {
        error: "Failed to list Gmail messages",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
