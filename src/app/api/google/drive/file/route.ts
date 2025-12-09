import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";

/**
 * DELETE /api/google/drive/file
 * Deletes a file from Google Drive
 * Request body: { fileId: string }
 */
export async function DELETE(request: NextRequest) {
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
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
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

    // Delete file
    await drive.files.delete({
      fileId: fileId,
    });

    return NextResponse.json({
      success: true,
      message: `File deleted successfully`,
      fileId: fileId,
    });
  } catch (error: any) {
    console.error("Error deleting Drive file:", error);
    return NextResponse.json(
      {
        error: "Failed to delete Drive file",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
