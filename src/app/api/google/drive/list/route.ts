import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";

/**
 * GET /api/google/drive/list
 * Lists the first 20 files from Google Drive
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

    // Initialize Google Drive API
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // List files - first 20, ordered by most recent
    const response = await drive.files.list({
      pageSize: 20,
      fields:
        "nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)",
      orderBy: "modifiedTime desc",
    });

    return NextResponse.json({
      success: true,
      files: response.data.files || [],
      count: response.data.files?.length || 0,
    });
  } catch (error: any) {
    console.error("Error listing Drive files:", error);
    return NextResponse.json(
      {
        error: "Failed to list Drive files",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
