const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

function buildPrompt(occasion) {
  return `You are an expert fashion stylist and hype-man. Your job is to rate outfits GENEROUSLY and ACCURATELY. Real people put real effort into their looks — reward that effort.

SCORE SCALE (0-100). Use this EXACTLY:
- 90-100: Stunning. Could be on a mood board. Perfect cohesion, intentional, memorable.
- 83-89: Really strong. Clear aesthetic, great execution, minor tweaks possible.
- 75-82: Solid and well put together. Good foundation, looks intentional.
- 68-74: Decent. Pieces work together, needs a little more intention.
- Below 68: ONLY for outfits with clear visible problems (clashing colors, broken proportions, dirty/damaged clothes).

HARD MINIMUMS — you MUST follow these, no exceptions:
- Any outfit that looks clean and intentional: score 75+
- Monochrome or neutral palette (all black, all white, beige/cream tones, navy): score 79+
- Clear aesthetic (streetwear, old money, clean girl, Y2K, athleisure, techwear, etc.): score 77+
- Fitted clothes with good silhouette: fit score 20+/25
- Neutral color palette: color score 20+/25
- Accessories visible: add 2 to score
- Shoes match the vibe: add 2 to score
- Layering present: add 2 to score
- When in doubt, go slightly higher — it's better to hype someone up than to discourage them

BREAKDOWN — each sub-score out of 25, they MUST sum to the total score:
- fit: how well clothes fit and flatter the body
- color: how well colors work together
- style: how on-trend and aesthetic the outfit is
- occasion: score this STRICTLY based on whether this specific outfit actually works for "${occasion}":
  • 22-25 ONLY if the outfit is clearly built for "${occasion}" (e.g. a party dress for "party night", athletic wear for "gym")
  • 17-21 if it works well but isn't specifically tailored for "${occasion}"
  • 12-16 if it's a passable but awkward choice for "${occasion}"
  • Below 12 if there's a real mismatch in formality, dress code, or vibe for "${occasion}"
  ASK YOURSELF: would this outfit raise eyebrows or feel out of place at "${occasion}"? Be honest.

OUTPUT RULES:
- Be enthusiastic and specific in the verdict — name the exact aesthetic you see
- vibe: 2-4 words MAX, use REAL aesthetic names people actually search on TikTok/Pinterest. Examples: "Quiet Luxury", "Dark Academia", "Clean Girl", "Coastal Cowgirl", "Old Money", "Streetwear Flex", "Soft Boy", "Tomboy Chic", "Mob Wife", "Indie Sleaze", "Gorpcore", "Balletcore", "Coquette", "Techwear", "Preppy Minimal", "Y2K Revival", "Boho Luxe", "Corporate Baddie", "Skater Grunge", "Athleisure Elevated". Pick the ONE that fits best — do NOT make up fake or generic phrases like "Clean Quiet Luxury Edge"
- pros: 2 specific compliments about what's working
- cons: 1-2 gentle, constructive suggestions (frame positively)
- upgrade: one specific actionable tip to push the score higher

Analyze this "${occasion}" outfit. Reply ONLY with valid JSON, no markdown fences:
{"score":84,"breakdown":{"fit":22,"color":21,"style":21,"occasion":20},"vibe":"Clean Quiet Luxury","verdict":"You nailed the quiet luxury brief — neutral palette, clean proportions, nothing fighting for attention. This is the kind of effortless that actually takes taste.","tags":["minimalist","clean","elevated"],"pros":["Color story is tight and intentional","Proportions are doing serious work here"],"cons":["One texture element could add depth"],"upgrade":"A slim leather belt or gold chain would push this into the 90s instantly."}`;
}

const AESTHETICS = [
  "Old Money","Quiet Luxury","Dark Academia","Clean Girl","Coastal Cowgirl",
  "Streetwear","Soft Boy","Tomboy Chic","Mob Wife","Indie Sleaze","Gorpcore",
  "Balletcore","Coquette","Techwear","Preppy","Y2K","Boho Luxe","Corporate Baddie",
  "Skater Grunge","Athleisure","Cottagecore","Grunge","Minimalist","Hypebeast",
  "Business Casual","Casual Cool","Smart Casual","Maximalist","Edgy","Vintage"
];

// If the AI returns a vague or made-up vibe, snap it to the closest real aesthetic
function cleanVibe(vibe) {
  if (!vibe) return "Clean Girl";
  const v = vibe.toLowerCase();
  // Already a known aesthetic (or close enough) — just title-case it and return
  for (const a of AESTHETICS) {
    if (v.includes(a.toLowerCase())) return a;
  }
  // Keyword mapping for common AI outputs
  if (v.includes("luxury") || v.includes("rich") || v.includes("elegant")) return "Old Money";
  if (v.includes("street") || v.includes("urban") || v.includes("hype")) return "Streetwear";
  if (v.includes("academic") || v.includes("scholar") || v.includes("book")) return "Dark Academia";
  if (v.includes("clean") || v.includes("minimal") || v.includes("simple")) return "Clean Girl";
  if (v.includes("athletic") || v.includes("sport") || v.includes("gym")) return "Athleisure";
  if (v.includes("tech") || v.includes("futur")) return "Techwear";
  if (v.includes("vintage") || v.includes("retro") || v.includes("thrift")) return "Vintage";
  if (v.includes("grunge") || v.includes("punk") || v.includes("rock")) return "Grunge";
  if (v.includes("boho") || v.includes("bohemian") || v.includes("earthy")) return "Boho Luxe";
  if (v.includes("preppy") || v.includes("ivy") || v.includes("polo")) return "Preppy";
  if (v.includes("y2k") || v.includes("2000") || v.includes("millennial")) return "Y2K";
  if (v.includes("ballet") || v.includes("dance") || v.includes("feminine")) return "Balletcore";
  if (v.includes("corp") || v.includes("office") || v.includes("work")) return "Corporate Baddie";
  if (v.includes("casual") || v.includes("comfy") || v.includes("everyday")) return "Casual Cool";
  if (v.includes("mob") || v.includes("glam") || v.includes("fur")) return "Mob Wife";
  return "Clean Girl"; // safe fallback
}

function enforceMinimums(rating) {
  let { score, breakdown } = rating;
  let { fit = 17, color = 17, style = 17, occasion = 14 } = breakdown || {};

  // Score floor
  if (score < 65) score = 65;

  // Clamp all sub-scores to valid ranges
  fit      = Math.max(1, Math.min(25, fit));
  color    = Math.max(1, Math.min(25, color));
  style    = Math.max(1, Math.min(25, style));
  occasion = Math.max(1, Math.min(25, occasion));

  // Scale breakdown to match the total score
  const sum = fit + color + style + occasion;
  if (sum > 0 && sum !== score) {
    const r = score / sum;
    fit      = Math.round(fit * r);
    color    = Math.round(color * r);
    style    = Math.round(style * r);
    occasion = Math.round(occasion * r);
  }

  // Fix rounding drift — spread across categories that still have room
  let diff = score - (fit + color + style + occasion);
  for (const k of ['fit', 'color', 'style', 'occasion']) {
    if (diff === 0) break;
    const cur = k === 'fit' ? fit : k === 'color' ? color : k === 'style' ? style : occasion;
    const adj = diff > 0 ? Math.min(25 - cur, diff) : Math.max(1 - cur, diff);
    if (k === 'fit')        fit      += adj;
    else if (k === 'color') color    += adj;
    else if (k === 'style') style    += adj;
    else                    occasion += adj;
    diff -= adj;
  }

  return { ...rating, score, breakdown: { fit, color, style, occasion }, vibe: cleanVibe(rating.vibe) };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let imageB64, occasion;
    try {
      ({ imageB64, occasion } = await request.json());
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    if (!imageB64 || !occasion) {
      return json({ error: "Missing imageB64 or occasion" }, 400);
    }

    const imageBytes = Uint8Array.from(atob(imageB64), c => c.charCodeAt(0));

    let aiResult;
    try {
      aiResult = await env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {
          messages: [{
            role: "user",
            content: [
              { type: "image", image: [...imageBytes] },
              { type: "text", text: buildPrompt(occasion) },
            ],
          }],
          max_tokens: 600,
          temperature: 0,
        }
      );
    } catch (e) {
      console.error("CF AI error:", e);
      return json({ error: "AI service error" }, 502);
    }

    const text = aiResult?.response ?? "";
    const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "Could not parse AI response" }, 502);

    try {
      const raw = JSON.parse(match[0]);
      const rating = enforceMinimums(raw);
      return json(rating);
    } catch {
      return json({ error: "Invalid JSON from AI" }, 502);
    }
  },
};
