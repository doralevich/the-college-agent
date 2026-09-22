"use client";

import Image from "next/image";

// The agent introducing itself, on an empty chat.
//
// This card came off the old "Start Here" page, which is gone. It replaced a plain
// "Hi David, good afternoon. / How can I help you today?" heading — true, but it is the
// dashboard talking. This is the AGENT talking, by name, with its face next to the words, and
// that is the whole point of a product a student names and gives a face to.
//
// It shows on every empty chat, not only the first. It is the top of a blank page, and the
// alternative is that the agent stops introducing itself after day one for no reason.

const INK = "#1a2421";
const INK_SOFT = "rgba(26,36,33,.72)";
const GREEN = "#2d7a3a";

export function ChatGreetingCard({
  firstName,
  agentName,
  avatarUrl,
}: {
  firstName?: string | null;
  agentName?: string | null;
  avatarUrl?: string | null;
}) {
  const name = firstName?.trim() || "there";
  const bot = agentName?.trim() || "your College Agent";
  const avatar = avatarUrl?.trim();

  return (
    <div className="mx-auto w-full max-w-[620px] rounded-3xl border bg-background px-8 py-8 text-left shadow-sm sm:px-10">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
        <div className="shrink-0">
          {avatar ? (
            // A student-uploaded avatar is a photo or a picked face: crop it round.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={bot}
              className="h-[104px] w-[104px] rounded-full object-cover"
            />
          ) : (
            // The house mascot has its own transparent silhouette — contain, never crop.
            <Image
              src="/thecollegeagent.png"
              alt={bot}
              width={104}
              height={104}
              className="h-[104px] w-auto object-contain"
              priority
            />
          )}
        </div>

        <div className="min-w-0 text-center sm:text-left">
          <h1
            style={{
              // Self-hosted in the root layout; the bare name covers the marketing pages
              // that still inject it from Google Fonts themselves.
              fontFamily: "var(--font-serif), 'Fraunces', Georgia, serif",
              fontSize: 30,
              lineHeight: 1.12,
              fontWeight: 600,
              letterSpacing: "-.01em",
              margin: "0 0 10px",
              color: INK,
            }}
          >
            Hey <span style={{ color: GREEN }}>{name}</span>, I&apos;m {bot}.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: INK_SOFT, margin: 0 }}>
            Think of me as your sidekick for everything college throws at you, from your first
            syllabus all the way to graduation and whatever comes after.
          </p>
        </div>
      </div>
    </div>
  );
}
