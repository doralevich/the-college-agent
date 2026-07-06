"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Client wrapper so the (server) authed layout can mount next-themes. Class strategy:
// `.dark` lands on <html>, which flips the token variables in app/agent-ui.css. Only the
// authed surface responds to the class — the marketing site uses fixed colors.
// Day-only for now: forcedTheme pins light and ignores the system preference, so there is
// no night mode anywhere on the authed surface (the appearance toggle is removed too).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
