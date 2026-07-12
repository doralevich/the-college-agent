"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  PLAN_AMOUNT_CENTS,
  HOSTING_AMOUNT_CENTS,
  PRO_PLAN_AMOUNT_CENTS,
  PRO_HOSTING_AMOUNT_CENTS,
} from "@/lib/pricing/intro-cutoff";

// The interactive walkthrough: pick who you are (student vs. faculty/administration/
// athletics) and the six steps rewrite themselves — pricing included — then click
// through the steps accordion-style. "Choose Your Plan" only makes sense once we know
// which buyer is reading, so the audience toggle comes first.

function price(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
}

type Audience = "student" | "staff";
type Step = { title: string; body: string };

const STEP_GUYS = [
  "/avatars/guy-01.webp",
  "/avatars/guy-05.webp",
  "/avatars/guy-12.webp",
  "/avatars/guy-08.webp",
  "/avatars/guy-02.webp",
  "/avatars/guy-07.webp",
];

function stepsFor(audience: Audience): Step[] {
  const plan = price(PLAN_AMOUNT_CENTS);
  const hosting = price(HOSTING_AMOUNT_CENTS);
  const proPlan = price(PRO_PLAN_AMOUNT_CENTS);
  const proHosting = price(PRO_HOSTING_AMOUNT_CENTS);

  if (audience === "staff") {
    return [
      {
        title: "Start Your Build",
        body: `Head to thecollegeagent.ai/build and choose "Faculty, Administration, or Athletic Department." Enter your name, work email, and phone — your account is created automatically during checkout.`,
      },
      {
        title: "The Professional Build",
        body: `${proPlan} one-time to build and personalize your professional agent, plus ${proHosting}/month education-rate hosting. Secure checkout with Stripe and a 7-day money-back guarantee. Rolling out to a whole staff or department? Book a consultation and we'll structure it for your program.`,
      },
      {
        title: "A Role-Geared Intake",
        body: `In about five minutes, tell your agent who you are: your title, your office or team, what seasons crunch your calendar, and what you want off your plate — travel, scheduling, recruiting coordination, compliance deadlines, communications.`,
      },
      {
        title: "We Build Your Agent",
        body: `Once your intake is complete, we configure your agent behind the scenes. Within about 30 minutes it's live in your dashboard and on your phone — before your next staff meeting.`,
      },
      {
        title: "Put It to Work",
        body: `Hand it the itinerary that needs rebuilding, the week's schedule changes, the recruiting follow-ups, the emails waiting on you. It drafts in your voice, tracks the deadlines, and checks in proactively.`,
      },
      {
        title: "Connect Your Office Tools",
        body: `Your agent works with what your campus already runs on: Outlook, Microsoft Teams, Gmail, Google Calendar, Google Drive, Blackbaud, and hundreds more. The more you connect, the more it can carry.`,
      },
    ];
  }

  return [
    {
      title: "Create Your Account",
      body: `Start at thecollegeagent.ai/build and enter your name, school email, and phone number. Your account is automatically created during checkout, so there's nothing extra to set up.`,
    },
    {
      title: "Choose Your Plan",
      body: `${plan} one-time to build and personalize your College Agent, plus secure cloud hosting: your choice of ${hosting}/month or $250/year (two months free). Includes $20 in AI credits to get started. Secure checkout with Stripe, and a 7-day money-back guarantee.`,
    },
    {
      title: "Personalize Your Agent",
      body: `In about five minutes, tell your College Agent about yourself. Choose its name and appearance, then share your school, classes, goals, schedule, and how you like to work. You can update your information anytime as your college life evolves.`,
    },
    {
      title: "We Build Your Agent",
      body: `Once your intake is complete, we configure your personalized College Agent behind the scenes. Within about 30 minutes, it's live and ready in your dashboard and on your phone.`,
    },
    {
      title: "Start Using Your Agent",
      body: `Upload your syllabi, class schedule, notes, and other important information. From there, simply talk to your agent. Ask questions. Plan your week. Draft emails. Prepare for exams. Track internships. Manage your entire college life.`,
    },
    {
      title: "Connect the Tools You Already Use",
      body: `Your College Agent works with the apps students rely on every day, including Canvas, Gmail, Google Calendar, Google Drive, Outlook, Notion, Microsoft Teams, Dropbox, Telegram, and hundreds more. The more you connect, the more your agent can help.`,
    },
  ];
}

export default function HowItWorksSteps() {
  const [audience, setAudience] = useState<Audience>("student");
  const [open, setOpen] = useState(0);

  const steps = stepsFor(audience);

  const pick = (a: Audience) => {
    setAudience(a);
    setOpen(0);
  };

  return (
    <div className="hiw">
      {/* WHO ARE YOU — the answer rewrites every step below, pricing included. */}
      <div className="hiw-toggle" role="tablist" aria-label="Who is this agent for?">
        <button
          role="tab"
          aria-selected={audience === "student"}
          className={`hiw-tab ${audience === "student" ? "on" : ""}`}
          onClick={() => pick("student")}
        >
          <img src="/avatars/guy-03.webp" alt="" />
          <span>
            <strong>I&apos;m a College Student</strong>
            <em>Your whole college life, organized</em>
          </span>
        </button>
        <button
          role="tab"
          aria-selected={audience === "staff"}
          className={`hiw-tab ${audience === "staff" ? "on" : ""}`}
          onClick={() => pick("staff")}
        >
          <img src="/avatars/guy-09.webp" alt="" />
          <span>
            <strong>Faculty &middot; Administration &middot; Athletics</strong>
            <em>A professional agent for your office or program</em>
          </span>
        </button>
      </div>

      {/* THE STEPS — click a step to expand it; one open at a time. */}
      <div className="hiw-steps">
        {steps.map(({ title, body }, i) => {
          const isOpen = open === i;
          return (
            <div key={`${audience}-${title}`} className={`hiw-step ${isOpen ? "open" : ""}`}>
              <button className="hiw-step-head" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                <span className="hiw-node">{i + 1}</span>
                <span className="hiw-step-title">{title}</span>
                <svg className="hiw-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="hiw-body">
                <div>
                  <div className="hiw-body-inner">
                    <p>{body}</p>
                    <img src={STEP_GUYS[i]} alt="" className="hiw-guy" loading="lazy" />
                  </div>
                  {i < steps.length - 1 && (
                    <button className="hiw-next" onClick={() => setOpen(i + 1)}>
                      Next step &darr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA follows the audience. */}
      <div className="hiw-cta">
        {audience === "student" ? (
          <a href="/build" className="hiw-btn">Build My Agent</a>
        ) : (
          <>
            <a href="/build?plan=pro" className="hiw-btn">Build a Professional Agent</a>
            <a href="/consultation" className="hiw-btn-outline">Book a Consultation</a>
          </>
        )}
      </div>

      <style>{`
        .hiw { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .hiw-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 34px; }
        .hiw-tab {
          display: flex; align-items: center; gap: 14px; text-align: left;
          background: #fff; border: 2px solid rgba(11,23,41,.1); border-radius: 16px;
          padding: 14px 18px; cursor: pointer;
          transition: border-color .15s, box-shadow .15s, transform .15s;
        }
        .hiw-tab:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(11,23,41,.08); }
        .hiw-tab.on { border-color: var(--green); box-shadow: 0 10px 26px rgba(61,139,61,.16); }
        .hiw-tab img { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
        .hiw-tab strong { display: block; font-size: 14.5px; font-weight: 800; color: var(--navy); letter-spacing: -.01em; }
        .hiw-tab em { display: block; font-style: normal; font-size: 12px; color: rgba(11,23,41,.55); margin-top: 3px; line-height: 1.4; }
        .hiw-steps { position: relative; }
        .hiw-steps::before {
          content: ""; position: absolute; left: 17px; top: 20px; bottom: 20px; width: 2px;
          background: linear-gradient(rgba(61,139,61,.35), rgba(61,139,61,.1));
        }
        .hiw-step {
          position: relative; background: #fff; border: 1px solid rgba(11,23,41,.08);
          border-radius: 14px; margin: 0 0 12px 52px;
          box-shadow: 0 4px 16px rgba(11,23,41,.04);
          transition: border-color .18s, box-shadow .18s;
        }
        .hiw-step.open { border-color: rgba(61,139,61,.4); box-shadow: 0 14px 36px rgba(11,23,41,.08); }
        .hiw-node {
          position: absolute; left: -52px; top: 10px;
          width: 36px; height: 36px; border-radius: 50%;
          background: #fff; border: 2px solid var(--green); color: var(--green);
          font-family: var(--font-mono); font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; z-index: 1;
          transition: background .18s, color .18s;
        }
        .hiw-step.open .hiw-node { background: var(--green); color: #fff; }
        .hiw-step-head {
          width: 100%; display: flex; align-items: center; gap: 12px;
          background: none; border: none; cursor: pointer; text-align: left;
          padding: 16px 18px; font: inherit;
        }
        .hiw-step-title { flex: 1; font-size: 17px; font-weight: 800; color: var(--navy); letter-spacing: -.015em; }
        .hiw-chev { color: rgba(11,23,41,.4); transition: transform .22s; flex-shrink: 0; }
        .hiw-step.open .hiw-chev { transform: rotate(180deg); color: var(--green); }
        .hiw-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .28s ease; }
        .hiw-step.open .hiw-body { grid-template-rows: 1fr; }
        .hiw-body > div { overflow: hidden; }
        .hiw-body-inner { display: flex; gap: 18px; align-items: center; padding: 0 18px; }
        .hiw-body-inner p { flex: 1; font-size: 14.5px; line-height: 1.75; color: rgba(11,23,41,.7); margin: 0 0 4px; }
        .hiw-guy { width: 86px; height: auto; flex-shrink: 0; filter: drop-shadow(0 10px 18px rgba(27,94,42,.2)); }
        .hiw-next {
          display: inline-flex; align-items: center; margin: 8px 18px 16px;
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase; color: var(--green);
        }
        .hiw-next:hover { text-decoration: underline; }
        .hiw-cta { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 34px; }
        .hiw-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; text-decoration: none;
        }
        .hiw-btn:hover { filter: brightness(1.1); }
        .hiw-btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; text-decoration: none;
        }
        .hiw-btn-outline:hover { border-color: var(--navy); }
        @media (max-width: 640px) {
          .hiw-toggle { grid-template-columns: 1fr; }
          .hiw-body-inner { flex-direction: column-reverse; align-items: flex-start; }
          .hiw-guy { width: 70px; }
        }
      `}</style>
    </div>
  );
}
