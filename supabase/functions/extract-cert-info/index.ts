import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CERT_TYPES = [
  "Competent Climber (NWSA)", "Tower Crew Lead (NWSA)", "Tower Site Manager (NWSA)",
  "Tower Rescue / Competent Rescuer", "Fall Protection Competent Person",
  "RF Safety / EME Awareness", "Antenna Installation", "Fiber Optic Technician",
  "Telecommunications Technician", "OSHA 10-Hour", "OSHA 30-Hour",
  "Electrical Safety (NFPA 70E)", "Confined Space Entry", "Excavation & Trenching Safety",
  "Hazard Communication (HazCom)", "HAZWOPER 40-Hour", "Fire Extinguisher / Fire Safety",
  "Aerial Lift / Boom Lift Operator", "Scissor Lift Operator", "Forklift Operator",
  "Rigging & Signaling", "First Aid / CPR / AED", "DOT Physical / Medical Card",
  "CDL (Commercial Driver's License)", "FAA Part 107 Drone Pilot", "Other",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { imageBase64, mediaType } = await req.json();

  const prompt = `Look at this certificate/card image and extract the following. Return ONLY a valid JSON object, no other text:
{
  "holder_name": "full name of the certificate holder, or null",
  "issued_at": "issue date in YYYY-MM-DD format, or null",
  "expires_at": "expiry/expiration date in YYYY-MM-DD format, or null",
  "cert_type": "best matching type from the list below, or null"
}

Certificate types (match exactly one, or return null):
${CERT_TYPES.join(", ")}

If a year-only date is shown (e.g. "2025"), use YYYY-01-01. If month+year only, use YYYY-MM-01.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType ?? "image/jpeg", data: imageBase64 },
          },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });

  const result = await res.json();
  const raw = result.content?.[0]?.text?.trim() ?? "{}";

  try {
    const parsed = JSON.parse(raw);
    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "parse_failed", raw }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
