import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { getGoogleClient } from "@/lib/google-client";

/**
 * POST /api/google/calendar/create
 * Creates a new calendar event
 * Request body: {
 *   summary: string,
 *   description?: string,
 *   location?: string,
 *   startDateTime: string (ISO format),
 *   endDateTime: string (ISO format),
 *   timeZone?: string
 * }
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
    const {
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      timeZone = "America/Los_Angeles",
    } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "summary, startDateTime, and endDateTime are required" },
        { status: 400 }
      );
    }

    // Initialize Google OAuth2 client with user's tokens
    const oauth2Client = getGoogleClient(
      session.accessToken,
      session.refreshToken
    );

    // Initialize Google Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create event
    const event = {
      summary: summary,
      description: description || "",
      location: location || "",
      start: {
        dateTime: startDateTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: response.data.id,
        summary: response.data.summary,
        start: response.data.start?.dateTime,
        end: response.data.end?.dateTime,
        htmlLink: response.data.htmlLink,
      },
      message: `Event "${summary}" created successfully`,
    });
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      {
        error: "Failed to create calendar event",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
