"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OnboardForm = {
  agent_name: string;
  first_name: string;
  last_name: string;
  school_email: string;
  personal_email: string;
  phone: string;
  school: string;
  year: string;
  major: string;
};

type SetupForm = {
  telegram_token: string;
  telegram_user_id: string;
  telegram_username: string;
  anthropic_key: string;
  openai_key: string;
};

const EMPTY_ONBOARD: OnboardForm = {
  agent_name: "", first_name: "", last_name: "", school_email: "", personal_email: "",
  phone: "", school: "", year: "", major: "",
};
const EMPTY_SETUP: SetupForm = {
  telegram_token: "", telegram_user_id: "", telegram_username: "", anthropic_key: "", openai_key: "",
};

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

// Admin editor over a workspace owner's intake. Writes the SAME onboard_submissions /
// setup_submissions rows the student's own forms do, so edits persist and every "Create
// Hermes" reads the latest values. Can save alone, or save-and-create in one go.
export function IntakeDialog({
  open,
  onOpenChange,
  workspaceId,
  ownerEmail,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  ownerEmail: string | null;
  onSaved: () => void;
}) {
  const { busy, run } = useAsyncAction();
  const [loading, setLoading] = useState(false);
  const [onboard, setOnboard] = useState<OnboardForm>(EMPTY_ONBOARD);
  const [setup, setSetup] = useState<SetupForm>(EMPTY_SETUP);
  const [questionnaire, setQuestionnaire] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !workspaceId) return;
    let ignore = false;
    // Reset on entry, then load. The dialog is mounted once and reused across rows, so a
    // superseded (out-of-order) or failed fetch must never leave a *different* workspace's
    // intake — including its Telegram token / API keys — sitting in the form. The cleanup
    // flag drops stale resolves; the reset guarantees a failed load shows blanks, not A's data.
    /* eslint-disable react-hooks/set-state-in-effect */
    setOnboard(EMPTY_ONBOARD);
    setSetup(EMPTY_SETUP);
    setQuestionnaire("");
    setResumeUrl(null);
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    apiFetch<{ onboard: Record<string, unknown> | null; setup: Record<string, unknown> | null }>(
      `/api/admin/workspaces/${workspaceId}/intake`
    )
      .then((d) => {
        if (ignore) return;
        const o = d.onboard ?? {};
        const st = d.setup ?? {};
        setOnboard({
          agent_name: s(o.agent_name), first_name: s(o.first_name), last_name: s(o.last_name),
          school_email: s(o.school_email), personal_email: s(o.personal_email), phone: s(o.phone),
          school: s(o.school), year: s(o.year), major: s(o.major),
        });
        setSetup({
          telegram_token: s(st.telegram_token), telegram_user_id: s(st.telegram_user_id),
          telegram_username: s(st.telegram_username), anthropic_key: s(st.anthropic_key),
          openai_key: s(st.openai_key),
        });
        setQuestionnaire(o.questionnaire ? JSON.stringify(o.questionnaire, null, 2) : "");
        setResumeUrl((o.resume_url as string) ?? null);
      })
      .catch((e) => { if (!ignore) toast.error((e as Error).message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [open, workspaceId]);

  function buildBody() {
    let parsed: Record<string, unknown> | null = null;
    const t = questionnaire.trim();
    if (t) {
      let val: unknown;
      try {
        val = JSON.parse(t);
      } catch {
        throw new Error("Questionnaire is not valid JSON");
      }
      if (typeof val !== "object" || Array.isArray(val)) throw new Error("Questionnaire must be a JSON object");
      parsed = val as Record<string, unknown>;
    }
    return { onboard: { ...onboard, questionnaire: parsed }, setup: { ...setup } };
  }

  function submit(create: boolean) {
    if (!workspaceId) return;
    return run(async () => {
      const body = buildBody(); // throws on invalid JSON -> caught by run -> toast
      await apiFetch(`/api/admin/workspaces/${workspaceId}/intake`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (!create) {
        toast.success("Intake saved");
        onSaved();
        onOpenChange(false);
        return;
      }

      // Intake is now persisted. Report the create step separately so a create failure never
      // reads as "nothing saved", and surface whether the new agent got wired or came up bare.
      try {
        const res = await apiFetch<{ configured?: boolean; config_detail?: string }>("/api/agents", {
          method: "POST",
          body: JSON.stringify({ workspace_id: workspaceId }),
        });
        toast.success(
          res.configured
            ? "Saved. Agent provisioning (Telegram + persona wired up)"
            : `Saved. Agent provisioning, left unconfigured (${res.config_detail ?? "no Telegram on file"})`
        );
        onSaved();
        onOpenChange(false);
      } catch (e) {
        toast.error(`Intake saved, but agent creation failed: ${(e as Error).message}`);
        onSaved(); // intake changed — refresh, but keep the dialog open to retry the create
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit intake &amp; create agent</DialogTitle>
          <DialogDescription>
            These write the student&apos;s own onboarding &amp; setup records{ownerEmail ? ` for ${ownerEmail}` : ""}.
            Creating reads the latest values to wire up Telegram and the persona.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading intake…</p>
        ) : (
          <div className="space-y-6">
            <Section title="Persona">
              <Grid>
                <Field label="Agent name" value={onboard.agent_name} onChange={(v) => setOnboard((f) => ({ ...f, agent_name: v }))} />
                <Field label="First name" value={onboard.first_name} onChange={(v) => setOnboard((f) => ({ ...f, first_name: v }))} />
                <Field label="Last name" value={onboard.last_name} onChange={(v) => setOnboard((f) => ({ ...f, last_name: v }))} />
                <Field label="School" value={onboard.school} onChange={(v) => setOnboard((f) => ({ ...f, school: v }))} />
                <Field label="Year" value={onboard.year} onChange={(v) => setOnboard((f) => ({ ...f, year: v }))} />
                <Field label="Major" value={onboard.major} onChange={(v) => setOnboard((f) => ({ ...f, major: v }))} />
                <Field label="School email" value={onboard.school_email} onChange={(v) => setOnboard((f) => ({ ...f, school_email: v }))} />
                <Field label="Personal email" value={onboard.personal_email} onChange={(v) => setOnboard((f) => ({ ...f, personal_email: v }))} />
                <Field label="Phone" value={onboard.phone} onChange={(v) => setOnboard((f) => ({ ...f, phone: v }))} />
              </Grid>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline underline-offset-2">
                  Résumé on file
                </a>
              )}
            </Section>

            <Section title="Questionnaire (raw JSON: shapes the persona)">
              <Textarea
                value={questionnaire}
                onChange={(e) => setQuestionnaire(e.target.value)}
                placeholder="{ }"
                spellCheck={false}
                className="min-h-[140px] font-mono text-xs"
              />
            </Section>

            <Section title="Telegram">
              <Grid>
                <Field label="Bot token" value={setup.telegram_token} onChange={(v) => setSetup((f) => ({ ...f, telegram_token: v }))} mono />
                <Field label="User ID" value={setup.telegram_user_id} onChange={(v) => setSetup((f) => ({ ...f, telegram_user_id: v }))} mono />
                <Field label="Username" value={setup.telegram_username} onChange={(v) => setSetup((f) => ({ ...f, telegram_username: v }))} />
              </Grid>
            </Section>

            <Section title="BYO API keys">
              <p className="-mt-1 mb-2 text-xs text-muted-foreground">
                Stored only, not used at provisioning yet (the agent runs on the metered gateway).
              </p>
              <Grid>
                <Field label="Anthropic key" value={setup.anthropic_key} onChange={(v) => setSetup((f) => ({ ...f, anthropic_key: v }))} mono />
                <Field label="OpenAI key" value={setup.openai_key} onChange={(v) => setSetup((f) => ({ ...f, openai_key: v }))} mono />
              </Grid>
            </Section>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => submit(false)} disabled={busy || loading}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button onClick={() => submit(true)} disabled={busy || loading}>
            {busy ? "Working…" : "Save & create agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className={mono ? "font-mono text-xs" : ""} autoComplete="off" />
    </div>
  );
}
