import { redirect } from "next/navigation";

// PRD names the route /ambassadors; the site's landing lives at /ambassador.
export default function AmbassadorsAlias() {
  redirect("/ambassador");
}
