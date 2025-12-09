import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";

/**
 * POST /api/google/drive/folder
 * Creates a new folder in Google Drive
 * Request body: { name: string, parentId?: string }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Initialize Google OAuth2 client with user's tokens
    const oauth2Client = getGoogleClient(
      session.accessToken,
      session.refreshToken
    );

    // Initialize Google Drive API
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Prepare folder metadata
    const fileMetadata: any = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
    };

    // If parentId is provided, create folder inside that parent
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    // Create folder
    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name, webViewLink, createdTime",
    });

    return NextResponse.json({
      success: true,
      folder: response.data,
      message: `Folder "${name}" created successfully`,
    });
  } catch (error: any) {
    console.error("Error creating Drive folder:", error);
    return NextResponse.json(
      {
        error: "Failed to create Drive folder",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
