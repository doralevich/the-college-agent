// The chat apps a student can have their agent answer in, and what each one takes to set up.
//
// Where you TALK to your agent and what your agent can REACH are different questions.
// Integrations is a catalogue of tools the agent acts on (Canvas, Gmail, Drive). This is a short,
// fixed list of places it can answer you. Nobody else can reach the agent through them: the first
// person to message it becomes its owner, and every message from anyone else is dropped.
//
// EVERY CHANNEL CONNECTS BY PASTING A CREDENTIAL THE STUDENT MADE IN THEIR OWN ACCOUNT, and
// nothing else. No "Sign in with Slack", no OAuth redirect, no hosted app they join. A token
// minted in their own account is one they can see, audit and revoke without asking us; an OAuth
// app in the middle would quietly make us the owner of that access instead.
//
// The setup copy is deliberately literal. Each of these sends someone into another product's
// developer settings, and vague instructions there cost far more than the two lines they save.
//
// WHERE THE MESSAGES ARRIVE. None of this runs on the agent's box. Every channel delivers to a
// webhook in this app, which runs a turn through Agent37's API and sends the answer back. That is
// what makes them work on any runtime - the College Agent's boxes no longer run a Hermes gateway
// that could poll Telegram itself.

export type ChannelId = "telegram" | "slack" | "whatsapp";

export type ChannelField = {
  key: string;
  label: string;
  placeholder: string;
};

export type ChannelDef = {
  id: ChannelId;
  name: string;
  /** One line under the name: whose account this is, so "is this shared?" never has to be asked. */
  tagline: string;
  /** Numbered setup steps, rendered above the form. Plain strings; no markup. */
  steps: string[];
  fields: ChannelField[];
  /** Shown once connected, when there's something worth saying about living with it. */
  connectedNote?: string;
  /**
   * Show this agent's inbound webhook URL on the card, with a copy button.
   *
   * Only for channels where the student has to paste it somewhere themselves. Telegram doesn't
   * need it - we register the URL for them through setWebhook - but Slack and Meta have no
   * equivalent API, so without this their setup simply cannot be completed.
   */
  showWebhookUrl?: boolean;
  /**
   * Mark this as the one to pick.
   *
   * Telegram, and the setup bears it out: it is the only one of the three needing nothing but a
   * bot token from BotFather - no Meta business verification, no Slack workspace admin, and no
   * webhook URL to paste anywhere. A student choosing between three logos with no other
   * information picks the one they recognise, which is WhatsApp, which is the longest setup of
   * the three and needs a phone number that isn't already on WhatsApp.
   */
  recommended?: boolean;
};

export const CHANNELS: ChannelDef[] = [
  {
    id: "telegram",
    name: "Telegram",
    recommended: true,
    tagline: "Your own private bot",
    steps: [
      "In Telegram, open @BotFather and send /newbot to create a bot.",
      "Copy the bot token it gives you and paste it below.",
      "Press Connect, then send your new bot any message so it knows it's you.",
    ],
    fields: [
      { key: "botToken", label: "Bot token", placeholder: "123456789:ABCdef..." },
    ],
    connectedNote:
      "Message your bot in Telegram and your agent answers there. The first person to message it becomes its owner - anyone else who finds the bot gets nothing back.",
  },
  {
    id: "slack",
    name: "Slack",
    tagline: "A private app in your own workspace",
    // No Socket Mode: it needs a process holding a WebSocket open, and there is nothing on Vercel
    // to hold one. The Events API does the same job over a webhook, the way Telegram does.
    steps: [
      "Create an app at api.slack.com/apps - choose From scratch, and pick your workspace.",
      "Under OAuth & Permissions, add the chat:write and im:history bot scopes, then Install to Workspace. Copy the Bot User OAuth Token - it starts xoxb-.",
      "Under Basic Information, copy the Signing Secret.",
      "Paste both below and press Connect.",
      "Back in Slack, under Event Subscriptions, turn events on and paste the Request URL shown here after you connect. Slack will tick it green.",
      "Still under Event Subscriptions, expand Subscribe to bot events and add message.im. Save, then reinstall the app if Slack asks.",
      "Under App Home -> Show Tabs, turn on the Messages Tab and tick \"Allow users to send Slash commands and messages from the messages tab\". Without this Slack refuses to send your message at all.",
    ],
    fields: [
      { key: "botToken", label: "Bot token", placeholder: "xoxb-..." },
      { key: "signingSecret", label: "Signing secret", placeholder: "From Basic Information" },
    ],
    // Slack has no API for "deliver to this URL" - the student pastes it themselves, so the card
    // has to show it.
    showWebhookUrl: true,
    connectedNote:
      "Direct-message the app in Slack and your agent answers there. The first person to DM it becomes its owner - anyone else in the workspace gets nothing back.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    tagline: "A separate business number, through Meta",
    // Meta's Cloud API, not device linking. Linking a personal WhatsApp needs a process holding a
    // socket open per student, and leans on libraries Meta bans accounts for using. The trade is
    // stated in the tagline rather than buried: this is a SEPARATE number, not your own WhatsApp.
    steps: [
      "At developers.facebook.com, create an app of type Business and add the WhatsApp product to it.",
      "In WhatsApp -> API Setup, add the phone number the agent should answer on. It has to be a number that isn't already on WhatsApp.",
      "Copy the Phone number ID from that page.",
      "Create a permanent access token: Business Settings -> Users -> System users, add a system user with access to the app, then Generate token with the whatsapp_business_messaging permission.",
      "In App Settings -> Basic, copy the App secret.",
      "Paste all three below and press Connect.",
      "Back in Meta, under WhatsApp -> Configuration, edit the webhook: paste the Callback URL and Verify token shown here after you connect, then subscribe to the messages field.",
    ],
    fields: [
      { key: "accessToken", label: "Access token", placeholder: "Permanent access token" },
      { key: "phoneNumberId", label: "Phone number ID", placeholder: "A long number" },
      { key: "appSecret", label: "App secret", placeholder: "From App Settings -> Basic" },
    ],
    showWebhookUrl: true,
    connectedNote:
      "Message that number on WhatsApp and your agent answers there. The first number to message it becomes its owner - anyone else gets nothing back.",
  },
];

const BY_ID = new Map<ChannelId, ChannelDef>(CHANNELS.map((c) => [c.id, c]));

export function channelDef(id: string): ChannelDef | undefined {
  return BY_ID.get(id as ChannelId);
}

/** Guard for route params - the only way a ChannelId enters the server from a URL. */
export function isChannelId(value: string): value is ChannelId {
  return BY_ID.has(value as ChannelId);
}
