import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { AMBASSADOR_PROGRAM_ENABLED } from "@/lib/ambassador";

export default function AmbassadorsDashboardAlias() {
  // The ambassador program is switched off (lib/ambassador.ts). 404 rather than
  // redirect: these URLs are shared publicly and a redirect loop would be worse
  // than an honest "not here right now".
  if (!AMBASSADOR_PROGRAM_ENABLED) notFound();
  redirect("/ambassador/dashboard");
}
