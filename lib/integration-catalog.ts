import type { IntegrationToolkit } from "@/lib/types";

// Composio serves a logo per toolkit slug at a fixed URL scheme. Shared so the catalog below and
// the marketing globe resolve logos the same way.
export function composioLogoUrl(slug: string) {
  return `https://logos.composio.dev/api/${slug}`;
}

function toolkit(
  slug: string,
  name: string,
  description: string,
  authSchemes: string[] = ["OAUTH2"]
): IntegrationToolkit {
  return {
    slug,
    name,
    description,
    logo: composioLogoUrl(slug),
    enabled: true,
    isNoAuth: false,
    authSchemes,
  };
}

// Static first-paint catalog for Browse. Live Agent37/Composio search still runs for typed
// queries, but the default grid should not wait on a remote catalog request.
//
// SLUGS MUST MATCH Composio's toolkit slugs exactly (docs.composio.dev/toolkits/<slug>) —
// a wrong slug means a broken logo AND a failed connect. Note the inconsistent naming
// upstream: googledrive/googlecalendar are unseparated but google_classroom/one_drive/
// microsoft_teams use underscores. Verify against the docs before adding entries.
export const DEFAULT_INTEGRATION_TOOLKITS: IntegrationToolkit[] = [
  // School essentials
  toolkit("canvas", "Canvas", "Canvas is the LMS most universities use for classes and assignments."),
  toolkit("google_classroom", "Google Classroom", "Google Classroom for assignments, announcements, and grades."),
  toolkit("blackbaud", "Blackbaud", "Blackbaud powers many private-school and higher-ed admin systems."),
  toolkit("gmail", "Gmail", "Gmail is Google's email service."),
  toolkit("googlecalendar", "Google Calendar", "Google Calendar helps manage schedules and events."),
  toolkit("googledrive", "Google Drive", "Google Drive stores and shares cloud files."),
  toolkit("googledocs", "Google Docs", "Google Docs is a collaborative document editor."),
  toolkit("googlesheets", "Google Sheets", "Google Sheets is a cloud spreadsheet tool."),
  toolkit("googletasks", "Google Tasks", "Google Tasks helps track tasks and to-dos."),
  toolkit("googlemeet", "Google Meet", "Google Meet for video calls and virtual office hours."),
  toolkit("outlook", "Outlook", "Outlook is Microsoft's email and calendar platform."),
  toolkit("microsoft_teams", "Microsoft Teams", "Microsoft Teams for class meetings and group chats."),
  toolkit("one_drive", "OneDrive", "OneDrive for Microsoft 365 cloud files."),
  toolkit("zoom", "Zoom", "Zoom for lectures, office hours, and study sessions."),
  toolkit("dropbox", "Dropbox", "Dropbox for shared files and group projects."),
  toolkit("box", "Box", "Box for secure cloud file storage and sharing."),
  // Organization & productivity
  toolkit("notion", "Notion", "Notion centralizes notes, docs, wikis, and tasks."),
  toolkit("todoist", "Todoist", "Todoist keeps tasks and to-do lists organized."),
  toolkit("trello", "Trello", "Trello organizes projects on kanban boards."),
  toolkit("asana", "Asana", "Asana tracks team tasks, deadlines, and projects."),
  toolkit("airtable", "Airtable", "Airtable merges spreadsheets with databases."),
  toolkit("calendly", "Calendly", "Calendly schedules meetings without the back-and-forth."),
  toolkit("linear", "Linear", "Linear tracks issues and product work."),
  toolkit("jira", "Jira", "Jira tracks bugs, issues, and project work."),
  // Social & communication
  toolkit("discord", "Discord", "Discord connects communities and study groups."),
  toolkit("slack", "Slack", "Slack is a channel-based messaging platform."),
  toolkit("whatsapp", "WhatsApp", "WhatsApp for messaging groups and contacts."),
  toolkit("reddit", "Reddit", "Reddit hosts communities and discussion threads."),
  toolkit("linkedin", "LinkedIn", "LinkedIn for networking, internships, and your career."),
  toolkit("twitter", "Twitter", "Twitter connects posts, profiles, and social data."),
  toolkit("youtube", "YouTube", "YouTube hosts and manages video content."),
  toolkit("spotify", "Spotify", "Spotify for music and podcasts."),
  // Creative & builder tools
  toolkit("canva", "Canva", "Canva for presentations, posters, and social graphics."),
  toolkit("figma", "Figma", "Figma supports collaborative design workflows."),
  toolkit("github", "GitHub", "GitHub is a code hosting platform."),
  toolkit("supabase", "Supabase", "Supabase is an open-source backend platform.", ["API_KEY"]),
  toolkit("hubspot", "HubSpot", "HubSpot manages CRM, marketing, and sales workflows."),
  // Research & agent tools
  toolkit("perplexityai", "Perplexity AI", "Perplexity AI provides conversational answer search.", ["API_KEY"]),
  toolkit("codeinterpreter", "Code Interpreter", "Code Interpreter runs Python and data analysis tasks.", []),
  toolkit("serpapi", "SerpApi", "SerpApi provides real-time search results.", ["API_KEY"]),
  toolkit("firecrawl", "Firecrawl", "Firecrawl automates web crawling and extraction.", ["API_KEY"]),
  toolkit("tavily", "Tavily", "Tavily offers search and data retrieval for agents.", ["API_KEY"]),
];

// Pinned at the top of Browse under a "Favorites" heading — the apps most students should
// connect first. Order here is display order. Curated by hand; edit freely.
export const FAVORITE_INTEGRATION_SLUGS: string[] = [
  "gmail",
  "googlecalendar",
  "canvas",
  "google_classroom",
  "googledrive",
  "notion",
  "outlook",
  "microsoft_teams",
  "one_drive",
  "zoom",
];
