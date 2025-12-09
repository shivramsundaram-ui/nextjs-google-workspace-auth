import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";
import { Readable } from "stream";

/**
 * POST /api/google/drive/upload
 * Uploads a file to Google Drive
 * Request body: { fileName: string, mimeType: string, base64Data: string, parentId?: string }
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
    const { fileName, mimeType, base64Data, parentId } = body;

    if (!fileName || !mimeType || !base64Data) {
      return NextResponse.json(
        { error: "fileName, mimeType, and base64Data are required" },
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

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Create readable stream from buffer
    const fileStream = Readable.from(fileBuffer);

    // Prepare file metadata
    const fileMetadata: any = {
      name: fileName,
    };

    // If parentId is provided, upload to that folder
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: fileStream,
      },
      fields: "id, name, mimeType, size, webViewLink, createdTime",
    });

    return NextResponse.json({
      success: true,
      file: response.data,
      message: `File "${fileName}" uploaded successfully`,
    });
  } catch (error: any) {
    console.error("Error uploading file to Drive:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file to Drive",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
