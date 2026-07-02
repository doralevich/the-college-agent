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

// Static first-paint catalog for Browse, organized into Composio-style categories so the
// grid reads as a store, not a wall. Live Agent37/Composio search still runs for typed
// queries, and "Show more apps" pages through the full remote catalog.
//
// SLUGS MUST MATCH Composio's toolkit slugs exactly (docs.composio.dev/toolkits/<slug>) —
// a wrong slug means a broken logo AND a failed connect. Note the inconsistent naming
// upstream: googledrive/googlecalendar are unseparated but google_classroom/one_drive/
// microsoft_teams use underscores. Verify against the docs before adding entries.

export type IntegrationCategory = { title: string; toolkits: IntegrationToolkit[] };

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    title: "School & classes",
    toolkits: [
      toolkit("canvas", "Canvas", "Canvas is the LMS most universities use for classes and assignments."),
      toolkit("google_classroom", "Google Classroom", "Google Classroom for assignments, announcements, and grades."),
      toolkit("blackbaud", "Blackbaud", "Blackbaud powers many private-school and higher-ed admin systems."),
    ],
  },
  {
    title: "Email & calendar",
    toolkits: [
      toolkit("gmail", "Gmail", "Gmail is Google's email service."),
      toolkit("googlecalendar", "Google Calendar", "Google Calendar helps manage schedules and events."),
      toolkit("outlook", "Outlook", "Outlook is Microsoft's email and calendar platform."),
      toolkit("calendly", "Calendly", "Calendly schedules meetings without the back-and-forth."),
    ],
  },
  {
    title: "Files & docs",
    toolkits: [
      toolkit("googledrive", "Google Drive", "Google Drive stores and shares cloud files."),
      toolkit("googledocs", "Google Docs", "Google Docs is a collaborative document editor."),
      toolkit("googlesheets", "Google Sheets", "Google Sheets is a cloud spreadsheet tool."),
      toolkit("one_drive", "OneDrive", "OneDrive for Microsoft 365 cloud files."),
      toolkit("dropbox", "Dropbox", "Dropbox for shared files and group projects."),
      toolkit("box", "Box", "Box for secure cloud file storage and sharing."),
    ],
  },
  {
    title: "Tasks & notes",
    toolkits: [
      toolkit("googletasks", "Google Tasks", "Google Tasks helps track tasks and to-dos."),
      toolkit("todoist", "Todoist", "Todoist keeps tasks and to-do lists organized."),
      toolkit("notion", "Notion", "Notion centralizes notes, docs, wikis, and tasks."),
      toolkit("trello", "Trello", "Trello organizes projects on kanban boards."),
      toolkit("asana", "Asana", "Asana tracks team tasks, deadlines, and projects."),
      toolkit("airtable", "Airtable", "Airtable merges spreadsheets with databases."),
      toolkit("linear", "Linear", "Linear tracks issues and product work."),
      toolkit("jira", "Jira", "Jira tracks bugs, issues, and project work."),
    ],
  },
  {
    title: "Meetings & chat",
    toolkits: [
      toolkit("zoom", "Zoom", "Zoom for lectures, office hours, and study sessions."),
      toolkit("googlemeet", "Google Meet", "Google Meet for video calls and virtual office hours."),
      toolkit("microsoft_teams", "Microsoft Teams", "Microsoft Teams for class meetings and group chats."),
      toolkit("slack", "Slack", "Slack is a channel-based messaging platform."),
      toolkit("discord", "Discord", "Discord connects communities and study groups."),
      toolkit("whatsapp", "WhatsApp", "WhatsApp for messaging groups and contacts."),
    ],
  },
  {
    title: "Social & media",
    toolkits: [
      toolkit("youtube", "YouTube", "YouTube hosts and manages video content."),
      toolkit("spotify", "Spotify", "Spotify for music and podcasts."),
      toolkit("linkedin", "LinkedIn", "LinkedIn for networking, internships, and your career."),
      toolkit("reddit", "Reddit", "Reddit hosts communities and discussion threads."),
      toolkit("twitter", "Twitter", "Twitter connects posts, profiles, and social data."),
    ],
  },
  {
    title: "Design & code",
    toolkits: [
      toolkit("canva", "Canva", "Canva for presentations, posters, and social graphics."),
      toolkit("figma", "Figma", "Figma supports collaborative design workflows."),
      toolkit("github", "GitHub", "GitHub is a code hosting platform."),
      toolkit("supabase", "Supabase", "Supabase is an open-source backend platform.", ["API_KEY"]),
      toolkit("hubspot", "HubSpot", "HubSpot manages CRM, marketing, and sales workflows."),
    ],
  },
  {
    title: "Research & agent tools",
    toolkits: [
      toolkit("perplexityai", "Perplexity AI", "Perplexity AI provides conversational answer search.", ["API_KEY"]),
      toolkit("codeinterpreter", "Code Interpreter", "Code Interpreter runs Python and data analysis tasks.", []),
      toolkit("serpapi", "SerpApi", "SerpApi provides real-time search results.", ["API_KEY"]),
      toolkit("firecrawl", "Firecrawl", "Firecrawl automates web crawling and extraction.", ["API_KEY"]),
      toolkit("tavily", "Tavily", "Tavily offers search and data retrieval for agents.", ["API_KEY"]),
    ],
  },
];

// Flat view of the curated catalog — instant client-side filtering searches this.
export const DEFAULT_INTEGRATION_TOOLKITS: IntegrationToolkit[] = INTEGRATION_CATEGORIES.flatMap(
  (c) => c.toolkits
);

// Pinned at the top of Browse under a "Favorites" heading — David's picks. Order here is
// display order. Edit freely; slugs must exist in the catalog above.
export const FAVORITE_INTEGRATION_SLUGS: string[] = [
  "gmail",
  "googlecalendar",
  "canvas",
  "google_classroom",
  "blackbaud",
  "googledrive",
  "one_drive",
  "dropbox",
  "googletasks",
  "todoist",
  "notion",
  "outlook",
  "microsoft_teams",
  "zoom",
  "youtube",
  "spotify",
  "linkedin",
];
