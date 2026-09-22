import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { AMBASSADOR_PROGRAM_ENABLED } from "@/lib/ambassador";

// PRD names the route /ambassadors; the site's landing lives at /ambassador.
export default function AmbassadorsAlias() {
  // The ambassador program is switched off (lib/ambassador.ts). 404 rather than
  // redirect: these URLs are shared publicly and a redirect loop would be worse
  // than an honest "not here right now".
  if (!AMBASSADOR_PROGRAM_ENABLED) notFound();
  redirect("/ambassador");
}
