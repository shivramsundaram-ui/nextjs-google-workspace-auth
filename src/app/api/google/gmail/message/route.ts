import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";

/**
 * GET /api/google/gmail/message?id=MESSAGE_ID
 * Reads a specific Gmail message by ID
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

    // Get message ID from query parameters
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("id");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Initialize Google OAuth2 client with user's tokens
    const oauth2Client = getGoogleClient(
      session.accessToken,
      session.refreshToken
    );

    // Initialize Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch full message details
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = response.data;
    const payload = message.payload;
    const headers = payload?.headers || [];

    // Extract headers
    const from = headers.find((h) => h.name === "From")?.value || "";
    const to = headers.find((h) => h.name === "To")?.value || "";
    const subject =
      headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
    const date = headers.find((h) => h.name === "Date")?.value || "";

    // Extract body (simplified - handles plain text)
    let body = "";
    
    const getParts = (parts: any[]): string => {
      let text = "";
      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          text += Buffer.from(part.body.data, "base64").toString("utf-8");
        } else if (part.parts) {
          text += getParts(part.parts);
        }
      }
      return text;
    };

    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload?.parts) {
      body = getParts(payload.parts);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        threadId: message.threadId,
        from: from,
        to: to,
        subject: subject,
        date: date,
        snippet: message.snippet,
        body: body,
        labelIds: message.labelIds,
      },
    });
  } catch (error: any) {
    console.error("Error reading Gmail message:", error);
    return NextResponse.json(
      {
        error: "Failed to read Gmail message",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
