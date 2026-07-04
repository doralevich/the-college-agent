import { AmbassadorsAdmin } from "@/components/admin/AmbassadorsAdmin";

// Ambassador program operations: applications, codes, fraud review, payout runs.
// Gated by the admin layout (email allowlist).
export default function AdminAmbassadorsPage() {
  return <AmbassadorsAdmin />;
}
