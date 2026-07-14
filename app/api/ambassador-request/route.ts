import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { limit } from "@/lib/rate-limit";

type AmbassadorRequest = {
  // Personal Information
  fullName?: string;
  university?: string;
  graduationYear?: string;
  major?: string;
  email?: string;
  mobile?: string;

  // About You
  whyInterested?: string;
  whyAI?: string;
  whyGreat?: string;

  // Your Network
  involvements?: string[];

  // Social handles
  instagram?: string;
  linkedin?: string;
  facebook?: string;

  // Tell us more
  anythingElse?: string;

  // Agreements
  agreeIndependent?: boolean;
  agreeCommissions?: boolean;
  agreeProfessional?: boolean;
};

const RECIPIENTS = [
  { email: "david@apolloclaw.ai", name: "David", type: "to" },
  { email: "jilloralevich@gmail.com", name: "Jill Oralevich", type: "to" },
  { email: "avashaw777@gmail.com", name: "Ava Shaw", type: "to" },
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:7px 18px 7px 0;font-weight:700;color:#555;vertical-align:top;width:32%">${escapeHtml(label)}</td>
      <td style="padding:7px 0;color:#111;vertical-align:top">${escapeHtml(value || "—").replace(/\n/g, "<br />")}</td>
    </tr>
  `;
}

function sectionHeading(label: string) {
  return `
    <tr>
      <td colspan="2" style="padding:18px 0 4px;font-family:sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3d8b3d;border-bottom:1px solid #eee">
        ${escapeHtml(label)}
      </td>
    </tr>
  `;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await limit(req, "ambassador-request", { max: 5, windowSeconds: 60 }))) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
    const data = (await req.json()) as AmbassadorRequest;

    // Required fields per the application spec.
    const fullName = clean(data.fullName);
    const university = clean(data.university);
    const graduationYear = clean(data.graduationYear);
    const major = clean(data.major);
    const email = clean(data.email);
    const mobile = clean(data.mobile);
    const whyInterested = clean(data.whyInterested);
    const whyAI = clean(data.whyAI);
    const whyGreat = clean(data.whyGreat);

    if (!fullName || !university || !graduationYear || !major || !email || !mobile || !whyInterested || !whyAI || !whyGreat) {
      return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
    }

    // All three agreements must be checked — the program terms hinge on them.
    if (!data.agreeIndependent || !data.agreeCommissions || !data.agreeProfessional) {
      return NextResponse.json({ error: "Please confirm all three agreements." }, { status: 400 });
    }

    // The application IS the ambassador record: stored as `pending` for admin review.
    // Approval (in /admin/ambassadors) mints the Stripe promo code and /r link.
    try {
      const db = createAdminClient();
      await db.from("ambassadors").upsert(
        [
          {
            full_name: fullName,
            email: email.toLowerCase(),
            phone: mobile,
            school: university,
            notes: [`Grad year: ${graduationYear}`, `Major: ${major}`, whyInterested && `Why: ${whyInterested}`]
              .filter(Boolean)
              .join("\n")
              .slice(0, 2000),
          },
        ],
        { onConflict: "email", ignoreDuplicates: true }
      );
    } catch (dbErr) {
      // The email to David below is the fallback record; never fail the application.
      console.error("ambassador-request: db insert failed", dbErr);
    }

    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (!mandrillKey) {
      return NextResponse.json({ error: "Email is not configured yet." }, { status: 503 });
    }

    const involvements = Array.isArray(data.involvements)
      ? data.involvements.map(clean).filter(Boolean).join(", ")
      : "";

    const socials: [string, string][] = [
      ["Instagram", clean(data.instagram)],
      ["LinkedIn", clean(data.linkedin)],
      ["Facebook", clean(data.facebook)],
    ];
    const socialRows = socials.filter(([, v]) => v).map(([label, v]) => row(label, v)).join("");

    await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: mandrillKey,
        message: {
          from_email: "noreply@thecollegeagent.ai",
          from_name: "The College Agent",
          to: RECIPIENTS,
          headers: { "Reply-To": email },
          subject: `College Agent Ambassador Application: ${fullName} (${university})`,
          html: `
            <h2 style="font-family:sans-serif;color:#111;margin-bottom:8px">New Ambassador Application</h2>
            <p style="font-family:sans-serif;font-size:14px;color:#555;margin-top:0">
              Submitted from the ambassador application page.
            </p>
            <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:640px">
              ${sectionHeading("Personal Information")}
              ${row("Full Name", fullName)}
              ${row("University", university)}
              ${row("Graduation Year", graduationYear)}
              ${row("Major", major)}
              ${row("Email", email)}
              ${row("Mobile", mobile)}

              ${sectionHeading("About You")}
              ${row("Why they're interested", whyInterested)}
              ${row("What interests them about AI", whyAI)}
              ${row("Why they'd be great", whyGreat)}

              ${sectionHeading("Your Network")}
              ${row("Campus involvements", involvements)}
              ${socialRows || row("Social handles", "")}

              ${sectionHeading("Tell Us More")}
              ${row("Anything else", clean(data.anythingElse))}

              ${sectionHeading("Agreements")}
              ${row("Independent opportunity", "Confirmed")}
              ${row("Commission terms", "Confirmed")}
              ${row("Represent professionally", "Confirmed")}
            </table>
            <p style="margin-top:16px;font-family:sans-serif;font-size:13px;color:#888">
              Source: thecollegeagent.ai/ambassador
            </p>
          `,
        },
      }),
    });

    // Thank-you email to the applicant
    await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: mandrillKey,
        message: {
          from_email: "noreply@thecollegeagent.ai",
          from_name: "The College Agent",
          to: [{ email, name: fullName, type: "to" }],
          subject: "We received your College Agent Ambassador application!",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#0B1729;padding:32px 36px;border-radius:8px 8px 0 0">
                <p style="color:#22C55E;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">The College Agent</p>
                <h1 style="color:#fff;font-size:26px;font-weight:800;margin:0;line-height:1.2">Thanks for applying, ${escapeHtml(fullName.split(" ")[0])}.</h1>
              </div>
              <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:32px 36px;border-radius:0 0 8px 8px">
                <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                  We got your application for the College Agent Campus Ambassador Program at ${escapeHtml(university)}. We review every application personally and will be in touch within a few days if it's a match.
                </p>
                <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                  In the meantime, feel free to explore your own College Agent at <a href="https://thecollegeagent.ai/build" style="color:#22C55E;text-decoration:none">thecollegeagent.ai/build</a>.
                </p>
                <p style="color:#333;font-size:15px;line-height:1.6;margin:0">
                  Talk soon,<br />
                  <strong>The College Agent Team</strong>
                </p>
              </div>
              <p style="color:#aaa;font-size:12px;text-align:center;margin-top:20px">
                thecollegeagent.ai &nbsp;&middot;&nbsp; A Division of Apollo Claw
              </p>
            </div>
          `,
        },
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ambassador-request error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
