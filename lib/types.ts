export type Role = "admin";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: Role;
}

export interface WorkspaceMember {
  user_id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Invitation {
  token: string;
  workspace_id: string;
  role: Role;
  created_at: string;
  expires_at: string;
  // Full shareable link, computed server-side (honors NEXT_PUBLIC_SITE_URL).
  url: string;
}

export interface AgentRow {
  agent37_id: string;
  workspace_id: string;
  name: string | null;
  status: string | null;
  template: string | null;
  cpu: number | null;
  memory: number | null;
  disk: number | null;
  created_by: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  status: string;
  status_reason: {
    code: string;
    message: string;
    operation: string;
    at: number;
  } | null;
  template: string;
  image_ref: string;
  resources: { cpu: number; memory: number; disk: number };
  ports: { port: number; default: boolean; url: string }[];
  user: string | null;
  name: string | null;
  metadata: Record<string, unknown> | null;
  paid_through: number | null;
  past_due: boolean;
  created: number | null;
}

export interface Template {
  name: string;
  scope: "system" | "workspace";
  image_ref: string;
  agents: string[];
  description: string;
  ports: { port: number; default: boolean }[];
  created: number | null;
  updated: number | null;
}

export interface Budget {
  monthly_cap_micros: number;
  monthly_consumed_micros: number;
  monthly_remaining_micros: number;
  monthly_period: string;
  topup_remaining_micros: number;
  updated_at: number | null;
}

export interface Usage {
  period: string;
  total_micros: number;
  by_integration: {
    llm: { cost_micros: number; calls: number; input_tokens: number; output_tokens: number };
    brave: { cost_micros: number; calls: number };
    composio: { cost_micros: number; calls: number };
  };
}

export interface MergedAgent extends AgentRow {
  live_status: string | null;
  status_reason: Agent["status_reason"];
  past_due: boolean;
  ports: Agent["ports"];
  update_available: boolean;
}

// ---- Read-only intake summaries shown on the student Settings tab ----

// A serializable slice of the student's latest onboard_submissions row. NEVER includes
// the questionnaire blob's secrets; just the structured fields the Settings card renders.
export interface OnboardSummary {
  first_name: string | null;
  last_name: string | null;
  school_email: string | null;
  personal_email: string | null;
  phone: string | null;
  school: string | null;
  year: string | null;
  major: string | null;
  agent_name: string | null;
  resume_url: string | null;
}

// The student's Telegram connection — username + numeric id only. NEVER the bot token.
export interface TelegramSummary {
  telegram_username: string | null;
  telegram_user_id: string | null;
}

// ---- Platform admin god-view (/admin) ----

// One row in the all-workspaces table. Counts are computed server-side across every
// tenant via the service-role client (RLS would otherwise hide other people's data).
export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
  created_at: string;
  member_count: number;
  agent_count: number;
  running_count: number;
}

// One instance inside an expanded workspace row. A full MergedAgent (so the same
// AgentActionsMenu — open dashboard/terminal/files, restart, budget, etc. — drives admin
// rows) enriched with per-instance budget/usage, fetched lazily on expand. budget/usage
// are null when the agent37 call fails (e.g. unfunded wallet, instance not yet provisioned).
export interface AdminAgentDetail extends MergedAgent {
  budget: Budget | null;
  usage: Usage | null;
}
