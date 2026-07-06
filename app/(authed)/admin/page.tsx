import { AdminWorkspacesView } from "@/components/admin/AdminWorkspacesView";
import { MarkupEarnings } from "@/components/admin/MarkupEarnings";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <MarkupEarnings />
      <AdminWorkspacesView />
    </div>
  );
}
