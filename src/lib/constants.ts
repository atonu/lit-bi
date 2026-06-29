// =============================================================================
// Reportbly — App-wide Constants
// =============================================================================
// All configurable values should live here so they're easy to change.
// =============================================================================

// ---------------------------------------------------------------------------
// Chat sync interval — how often chat sessions are persisted to MongoDB
// ---------------------------------------------------------------------------
/** Interval in milliseconds for syncing chat history to the database. Default: 2 minutes. */
export const CHAT_SYNC_INTERVAL_MS = 5 * 1000; // 5 seconds

export const PLACEHOLDER_ORG_ID = "000000000000000000000001"; // 24-char hex ObjectId

// ---------------------------------------------------------------------------
// Chat session constants
// ---------------------------------------------------------------------------
/** Maximum number of chat history items to show in the sidebar. */
export const CHAT_HISTORY_SIDEBAR_LIMIT = 50;

/** Minimum messages in a session before a title is generated. */
export const CHAT_TITLE_GENERATION_THRESHOLD = 1;

// ---------------------------------------------------------------------------
// Connection constants
// ---------------------------------------------------------------------------
/** Max connections allowed per organization (soft limit). */
export const MAX_CONNECTIONS_PER_ORG = 20;

// ---------------------------------------------------------------------------
// UI constants
// ---------------------------------------------------------------------------
/** Width of expanded sidebar in px. */
export const SIDEBAR_EXPANDED_WIDTH = 280;

/** Width of collapsed sidebar in px. */
export const SIDEBAR_COLLAPSED_WIDTH = 64;

// ---------------------------------------------------------------------------
// External/Deployment constants
// ---------------------------------------------------------------------------
/** The base URL of the deployed frontend application */
export const WEBSITE_URL = "https://lit-bi.vercel.app";
