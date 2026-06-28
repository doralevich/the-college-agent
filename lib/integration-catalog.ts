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
export const DEFAULT_INTEGRATION_TOOLKITS: IntegrationToolkit[] = [
  toolkit("googledrive", "Google Drive", "Google Drive stores and shares cloud files."),
  toolkit("googledocs", "Google Docs", "Google Docs is a collaborative document editor."),
  toolkit("googlecalendar", "Google Calendar", "Google Calendar helps manage schedules and events."),
  toolkit("gmail", "Gmail", "Gmail is Google's email service."),
  toolkit("notion", "Notion", "Notion centralizes notes, docs, wikis, and tasks."),
  toolkit("airtable", "Airtable", "Airtable merges spreadsheets with databases."),
  toolkit("googlesheets", "Google Sheets", "Google Sheets is a cloud spreadsheet tool."),
  toolkit("googletasks", "Google Tasks", "Google Tasks helps track tasks and to-dos."),
  toolkit("figma", "Figma", "Figma supports collaborative design workflows."),
  toolkit("discord", "Discord", "Discord connects communities and study groups."),
  toolkit("github", "GitHub", "GitHub is a code hosting platform."),
  toolkit("supabase", "Supabase", "Supabase is an open-source backend platform.", ["API_KEY"]),
  toolkit("outlook", "Outlook", "Outlook is Microsoft's email and calendar platform."),
  toolkit("perplexityai", "Perplexity AI", "Perplexity AI provides conversational answer search.", ["API_KEY"]),
  toolkit("twitter", "Twitter", "Twitter connects posts, profiles, and social data."),
  toolkit("hubspot", "HubSpot", "HubSpot manages CRM, marketing, and sales workflows."),
  toolkit("linear", "Linear", "Linear tracks issues and product work."),
  toolkit("codeinterpreter", "Code Interpreter", "Code Interpreter runs Python and data analysis tasks.", []),
  toolkit("serpapi", "SerpApi", "SerpApi provides real-time search results.", ["API_KEY"]),
  toolkit("jira", "Jira", "Jira tracks bugs, issues, and project work."),
  toolkit("firecrawl", "Firecrawl", "Firecrawl automates web crawling and extraction.", ["API_KEY"]),
  toolkit("tavily", "Tavily", "Tavily offers search and data retrieval for agents.", ["API_KEY"]),
  toolkit("youtube", "YouTube", "YouTube hosts and manages video content."),
  toolkit("canvas", "Canvas", "Canvas is a learning management system."),
];
