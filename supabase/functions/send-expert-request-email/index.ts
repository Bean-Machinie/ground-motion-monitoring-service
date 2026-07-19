// POST /functions/v1/send-expert-request-email
//
// Emails the specialist team about a new expert-assisted request. The
// request row has already been inserted by the app before this runs —
// this function is notification only, so a failure here must never be
// reported to the customer as a lost submission (the app throws a
// distinct "saved, but email failed" message for that case).
//
// Invoked from the app via supabase.functions.invoke("send-expert-request-email").
// Deploy with: supabase functions deploy send-expert-request-email
// Requires the RESEND_API_KEY secret:
//   supabase secrets set RESEND_API_KEY=...

// Test-phase recipient; swap for the team inbox before launch.
const RECIPIENT = "thomasbenfer@gmail.com";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return json({ error: "RESEND_API_KEY is not configured" }, 500);
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload.email !== "string") {
    return json({ error: "Invalid payload" }, 400);
  }

  const {
    name = "Unknown",
    email,
    organization = "Not provided",
    projectAreaDescription = "General specialist support",
    projectObjective = "",
    preferredOutputFormat = "Both",
    comments = "",
  } = payload;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${organization}`,
    `Support topic: ${projectAreaDescription}`,
    `Preferred output format: ${preferredOutputFormat}`,
    "",
    "Message:",
    projectObjective,
    "",
    comments,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Resend's shared onboarding sender works without domain
      // verification — fine for testing, replace with a verified
      // HELIOSYN domain sender for production.
      from: "GMMS Expert Requests <onboarding@resend.dev>",
      to: [RECIPIENT],
      reply_to: email,
      subject: `Expert request: ${projectAreaDescription} — ${name}`,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return json({ error: `Resend request failed: ${detail}` }, 502);
  }

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
