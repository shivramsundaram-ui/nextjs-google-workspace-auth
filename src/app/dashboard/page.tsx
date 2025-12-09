"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

/**
 * Individual result state interface
 */
interface ResultState {
  data: any | null;
  loading: boolean;
  error: string | null;
  expanded: boolean;
}

/**
 * Dashboard page - Main UI for interacting with Google Workspace APIs
 * READ-ONLY operations only (matching auth scopes)
 * Displays both Google Access Token and Azure AD ID Token (via WIF)
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Individual result states for each API operation (READ-ONLY)
  const [profileState, setProfileState] = useState<ResultState>({
    data: null,
    loading: false,
    error: null,
    expanded: true,
  });
  const [driveListState, setDriveListState] = useState<ResultState>({
    data: null,
    loading: false,
    error: null,
    expanded: true,
  });
  const [calendarListState, setCalendarListState] = useState<ResultState>({
    data: null,
    loading: false,
    error: null,
    expanded: true,
  });

  /**
   * Generic API caller with individual state management
   */
  const callApi = async (
    url: string,
    setState: React.Dispatch<React.SetStateAction<ResultState>>,
    method: string = "GET",
    body?: any
  ): Promise<any> => {
    setState((prev) => ({ ...prev, loading: true, error: null, data: null }));

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      setState((prev) => ({ ...prev, data, loading: false, expanded: true }));
      return data;
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message,
        loading: false,
        expanded: true,
      }));
      console.error("API Error:", err);
    }
  };

  /**
   * Load user profile (from session)
   */
  const loadProfile = () => {
    if (session?.user) {
      setProfileState({
        data: {
          user: session.user,
          hasAccessToken: !!session.accessToken,
          hasRefreshToken: !!session.refreshToken,
          hasIdToken: !!session.idToken,
          error: session.error,
        },
        loading: false,
        error: null,
        expanded: true,
      });
    }
  };

  /**
   * List Drive files
   */
  const listDriveFiles = async () => {
    await callApi("/api/google/drive/list", setDriveListState);
  };

  /**
   * List calendar events
   */
  const listCalendarEvents = async () => {
    await callApi("/api/google/calendar/list", setCalendarListState);
  };

  /**
   * Decode JWT token (client-side - for display only)
   */
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };

  /**
   * Session Information Display Component
   */
  const SessionInfoCard = () => {
    if (!session) return null;

    const sessionData = {
      user: {
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
        id: session.user?.id,
      },
      tokens: {
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken,
        hasIdToken: !!session.idToken,
        accessTokenLength: session.accessToken?.length || 0,
        refreshTokenLength: session.refreshToken?.length || 0,
        idTokenLength: session.idToken?.length || 0,
      },
      sessionError: session.error || null,
      expires: session.expires || null,
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Session Overview</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Status:</span>
            <span className="text-green-600 font-semibold">Authenticated</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">User ID:</span>
            <span className="font-mono text-xs">{sessionData.user.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Access Token:</span>
            <span className={sessionData.tokens.hasAccessToken ? "text-green-600" : "text-red-600"}>
              {sessionData.tokens.hasAccessToken ? `✓ (${sessionData.tokens.accessTokenLength} chars)` : "✗ Missing"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Refresh Token:</span>
            <span className={sessionData.tokens.hasRefreshToken ? "text-green-600" : "text-red-600"}>
              {sessionData.tokens.hasRefreshToken ? `✓ (${sessionData.tokens.refreshTokenLength} chars)` : "✗ Missing"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">ID Token (Azure):</span>
            <span className={sessionData.tokens.hasIdToken ? "text-green-600" : "text-gray-400"}>
              {sessionData.tokens.hasIdToken ? `✓ (${sessionData.tokens.idTokenLength} chars)` : "✗ Not captured"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-600">Session Expires:</span>
            <span className="text-gray-800">{sessionData.expires ? new Date(sessionData.expires).toLocaleString() : 'N/A'}</span>
          </div>
          {sessionData.sessionError && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-red-600">Error:</span>
              <span className="text-red-600">{sessionData.sessionError}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * User Claims Display Component
   */
  const UserClaimsCard = () => {
    if (!session?.user) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">User Profile Claims</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b">
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900">{session.user.name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{session.user.email || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="py-2">
              <span className="font-medium text-gray-600 block">Name:</span>
              <span className="text-gray-900">{session.user.name || 'N/A'}</span>
            </div>
            <div className="py-2">
              <span className="font-medium text-gray-600 block">Email:</span>
              <span className="text-gray-900 break-all">{session.user.email || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Google Access Token Details Component
   */
  const TokenDetailsCard = () => {
    if (!session?.accessToken) return null;

    const decodedToken = decodeJWT(session.accessToken);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Google Access Token</h2>
        {decodedToken ? (
          <div className="space-y-2 text-sm max-h-96 overflow-auto">
            {decodedToken.iss && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Issuer (iss):</span>
                <span className="text-gray-800 text-xs break-all">{decodedToken.iss}</span>
              </div>
            )}
            {decodedToken.aud && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Audience (aud):</span>
                <span className="text-gray-800 text-xs break-all">{decodedToken.aud}</span>
              </div>
            )}
            {decodedToken.sub && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Subject (sub):</span>
                <span className="text-gray-800 text-xs font-mono">{decodedToken.sub}</span>
              </div>
            )}
            {decodedToken.azp && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Authorized Party (azp):</span>
                <span className="text-gray-800 text-xs break-all">{decodedToken.azp}</span>
              </div>
            )}
            {decodedToken.scope && (
              <div className="py-2 border-b">
                <span className="font-medium text-gray-600 block mb-2">Scopes:</span>
                <div className="flex flex-wrap gap-1">
                  {decodedToken.scope.split(' ').map((scope: string, idx: number) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {decodedToken.exp && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Expires (exp):</span>
                <span className="text-gray-800 text-xs">
                  {new Date(decodedToken.exp * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {decodedToken.iat && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Issued At (iat):</span>
                <span className="text-gray-800 text-xs">
                  {new Date(decodedToken.iat * 1000).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p>Access token format not recognized or cannot be decoded.</p>
            <p className="mt-2 font-mono text-xs bg-gray-100 p-2 rounded break-all">
              Token length: {session.accessToken.length} characters
            </p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Azure ID Token Claims Component (from WIF)
   */
  const AzureIdTokenCard = () => {
    if (!session?.idToken) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Azure AD ID Token</h2>
          <div className="text-sm text-gray-600">
            <p>ID Token not available in session.</p>
            <p className="mt-2 text-xs">
              This may indicate that Workforce Identity Federation is not properly configured,
              or the ID token is not being captured during authentication.
            </p>
          </div>
        </div>
      );
    }

    const decodedIdToken = decodeJWT(session.idToken);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Azure AD ID Token</h2>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            via WIF
          </span>
        </div>
        {decodedIdToken ? (
          <div className="space-y-2 text-sm max-h-96 overflow-auto">
            {decodedIdToken.tid && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Tenant ID (tid):</span>
                <span className="text-gray-800 text-xs font-mono">{decodedIdToken.tid}</span>
              </div>
            )}
            {decodedIdToken.oid && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Object ID (oid):</span>
                <span className="text-gray-800 text-xs font-mono">{decodedIdToken.oid}</span>
              </div>
            )}
            {decodedIdToken.preferred_username && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Preferred Username:</span>
                <span className="text-gray-800 text-xs">{decodedIdToken.preferred_username}</span>
              </div>
            )}
            {decodedIdToken.name && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-800 text-xs">{decodedIdToken.name}</span>
              </div>
            )}
            {decodedIdToken.email && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-gray-800 text-xs break-all">{decodedIdToken.email}</span>
              </div>
            )}
            {decodedIdToken.iss && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Issuer (iss):</span>
                <span className="text-gray-800 text-xs break-all">{decodedIdToken.iss}</span>
              </div>
            )}
            {decodedIdToken.aud && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Audience (aud):</span>
                <span className="text-gray-800 text-xs break-all">{decodedIdToken.aud}</span>
              </div>
            )}
            {decodedIdToken.sub && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Subject (sub):</span>
                <span className="text-gray-800 text-xs font-mono">{decodedIdToken.sub}</span>
              </div>
            )}
            {decodedIdToken.upn && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">UPN:</span>
                <span className="text-gray-800 text-xs">{decodedIdToken.upn}</span>
              </div>
            )}
            {decodedIdToken.unique_name && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Unique Name:</span>
                <span className="text-gray-800 text-xs">{decodedIdToken.unique_name}</span>
              </div>
            )}
            {decodedIdToken.roles && (
              <div className="py-2 border-b">
                <span className="font-medium text-gray-600 block mb-2">Roles:</span>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(decodedIdToken.roles) ? decodedIdToken.roles : [decodedIdToken.roles]).map((role: string, idx: number) => (
                    <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {decodedIdToken.groups && (
              <div className="py-2 border-b">
                <span className="font-medium text-gray-600 block mb-2">Groups:</span>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-auto">
                  {(Array.isArray(decodedIdToken.groups) ? decodedIdToken.groups : [decodedIdToken.groups]).slice(0, 10).map((group: string, idx: number) => (
                    <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-mono">
                      {group.length > 20 ? `${group.substring(0, 20)}...` : group}
                    </span>
                  ))}
                  {Array.isArray(decodedIdToken.groups) && decodedIdToken.groups.length > 10 && (
                    <span className="text-xs text-gray-500">+{decodedIdToken.groups.length - 10} more</span>
                  )}
                </div>
              </div>
            )}
            {decodedIdToken.exp && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Expires (exp):</span>
                <span className="text-gray-800 text-xs">
                  {new Date(decodedIdToken.exp * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {decodedIdToken.iat && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Issued At (iat):</span>
                <span className="text-gray-800 text-xs">
                  {new Date(decodedIdToken.iat * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {decodedIdToken.nbf && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Not Before (nbf):</span>
                <span className="text-gray-800 text-xs">
                  {new Date(decodedIdToken.nbf * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {decodedIdToken.ver && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Version:</span>
                <span className="text-gray-800 text-xs">{decodedIdToken.ver}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p>ID token format not recognized or cannot be decoded.</p>
            <p className="mt-2 font-mono text-xs bg-gray-100 p-2 rounded break-all">
              Token length: {session.idToken.length} characters
            </p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Raw Session Data Component
   */
  const RawSessionCard = () => {
    if (!session) return null;

    const [expanded, setExpanded] = useState(false);

    const safeSession = {
      ...session,
      accessToken: session.accessToken ? `${session.accessToken.substring(0, 20)}...` : null,
      refreshToken: session.refreshToken ? `${session.refreshToken.substring(0, 20)}...` : null,
      idToken: session.idToken ? `${session.idToken.substring(0, 20)}...` : null,
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Complete Session Object</h2>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
        {expanded && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              (Tokens truncated for security)
            </p>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96 border">
              {JSON.stringify(safeSession, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  /**
   * Inline result display component
   */
  const InlineResult = ({
    state,
    setState,
  }: {
    state: ResultState;
    setState: React.Dispatch<React.SetStateAction<ResultState>>;
  }) => {
    if (!state.loading && !state.error && !state.data) return null;

    return (
      <div className="mt-4">
        {state.loading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-blue-700 text-sm">Loading...</p>
            </div>
          </div>
        )}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-red-800 text-sm font-semibold">Error</p>
                <p className="text-red-700 text-sm mt-1">{state.error}</p>
              </div>
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, error: null, data: null }))
                }
                className="text-red-400 hover:text-red-600 ml-2"
                title="Clear"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {state.data && !state.loading && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  <p className="text-green-800 text-sm font-semibold">
                    Success
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setState((prev) => ({ ...prev, expanded: !prev.expanded }))
                    }
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    {state.expanded ? "Collapse" : "Expand"}
                  </button>
                  <button
                    onClick={() =>
                      setState((prev) => ({ ...prev, error: null, data: null }))
                    }
                    className="text-green-400 hover:text-green-600"
                    title="Clear"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {state.expanded && (
                <pre className="mt-3 bg-white p-3 rounded text-xs overflow-auto max-h-64 border border-green-200">
                  {JSON.stringify(state.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Not authenticated</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Google Workspace Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Logged in as: {session.user?.email}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Azure AD Identity (via WIF) → Google Workspace Read-Only Access
              </p>
              {session.error && (
                <p className="text-red-600 text-sm mt-2">
                  Session Error: {session.error}
                </p>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Session & Token Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Session & Token Information</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <SessionInfoCard />
            <UserClaimsCard />
            <TokenDetailsCard />
            <AzureIdTokenCard />
          </div>
        </div>

        {/* Raw Session Data */}
        <div className="mb-6">
          <RawSessionCard />
        </div>

        {/* API Actions Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Google API Operations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Profile</h2>
              <button
                onClick={loadProfile}
                disabled={profileState.loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Load Profile
              </button>
              <InlineResult state={profileState} setState={setProfileState} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Google Drive</h2>
              <p className="text-sm text-gray-500 mb-3">View your files (read-only)</p>
              <button
                onClick={listDriveFiles}
                disabled={driveListState.loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                List Drive Files
              </button>
              <InlineResult state={driveListState} setState={setDriveListState} />
            </div>

            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Google Calendar</h2>
              <p className="text-sm text-gray-500 mb-3">View your calendar (read-only)</p>
              <button
                onClick={listCalendarEvents}
                disabled={calendarListState.loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                List Upcoming Events
              </button>
              <InlineResult
                state={calendarListState}
                setState={setCalendarListState}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
