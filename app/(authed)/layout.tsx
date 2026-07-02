// Layout for the AUTHED app surface (login, reset-password, dashboard, admin).
// Importing agent-ui.css here scopes Tailwind + the shadcn token layer to these
// routes only — the hand-rolled marketing site (app/globals.css) is untouched.
import "../agent-ui.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </div>
    </ThemeProvider>
  );
}
