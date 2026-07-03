import "server-only";

// Send a plain-text Telegram message through the student's own bot (the token + chat id
// they connected during setup). Best-effort by design: alerts must never fail a caller
// because a bot was deleted or blocked, so all failures resolve to false.
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
