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
  return `You are an expert fashion stylist. Rate this outfit honestly and specifically.

OVERALL SCORE (0-100):
- 90-100: Stunning. Perfect cohesion, could be on a mood board.
- 83-89: Really strong. Clear aesthetic, great execution.
- 75-82: Solid and well put together. Looks intentional.
- 68-74: Decent. Pieces work but needs more intention.
- Below 68: Clear visible problems (clashing, bad fit, wrong occasion).

BREAKDOWN — score each of these INDEPENDENTLY out of 25:
- fit (1-25): How well the clothes fit and flatter the body
- color (1-25): How well the colors and patterns work together
- style (1-25): How on-trend and cohesive the overall aesthetic is
- occasion (1-25): How appropriate is this specific outfit for "${occasion}"?
  OCCASION RUBRIC — be honest, don't default to 25:
  · 22-25 only if the outfit is clearly made for "${occasion}" (athletic wear for gym, evening dress for date night, business attire for work)
  · 16-21 if it works reasonably well for "${occasion}" without standing out as wrong
  · 10-15 if it's a questionable or awkward choice for "${occasion}"
  · Below 10 if it's clearly the wrong vibe or formality level for "${occasion}"
  Ask yourself: would this outfit look out of place at a "${occasion}"?

Set your "score" equal to fit + color + style + occasion (they must add up exactly).

OUTPUT RULES:
- vibe: 2-4 words, real aesthetic names from TikTok/Pinterest only: "Quiet Luxury", "Dark Academia", "Clean Girl", "Coastal Cowgirl", "Old Money", "Streetwear", "Soft Boy", "Tomboy Chic", "Mob Wife", "Indie Sleaze", "Gorpcore", "Balletcore", "Coquette", "Techwear", "Preppy", "Y2K", "Boho Luxe", "Corporate Baddie", "Skater Grunge", "Athleisure"
- verdict: 1-2 sentences, enthusiastic and specific about the aesthetic
- pros: 2 specific compliments
- cons: 1-2 constructive suggestions
- upgrade: one actionable tip

Reply ONLY with valid JSON, no markdown:
{"score":81,"breakdown":{"fit":22,"color":21,"19":"style","occasion":19},"vibe":"Clean Girl","verdict":"Effortless and put-together — the neutral palette does the heavy lifting here.","tags":["minimal","clean","neutral"],"pros":["Proportions are balanced and flattering","Color story is cohesive"],"cons":["Could use one statement piece"],"upgrade":"Add a simple gold necklace to elevate the whole look."}

The JSON example above has score=81 and fit+color+style+occasion=22+21+19+19=81. Always make them match.`;
}

const AESTHETICS = [
  "Old Money","Quiet Luxury","Dark Academia","Clean Girl","Coastal Cowgirl",
  "Streetwear","Soft Boy","Tomboy Chic","Mob Wife","Indie Sleaze","Gorpcore",
  "Balletcore","Coquette","Techwear","Preppy","Y2K","Boho Luxe","Corporate Baddie",
  "Skater Grunge","Athleisure","Cottagecore","Grunge","Minimalist","Hypebeast",
  "Business Casual","Casual Cool","Smart Casual","Maximalist","Edgy","Vintage"
];

function cleanVibe(vibe) {
  if (!vibe) return "Clean Girl";
  const v = vibe.toLowerCase();
  for (const a of AESTHETICS) {
    if (v.includes(a.toLowerCase())) return a;
  }
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
  return "Clean Girl";
}

function enforceMinimums(rating) {
  let { score, breakdown } = rating;
  let { fit = 17, color = 17, style = 17, occasion = 14 } = breakdown || {};

  // Clamp inputs to valid range
  fit      = Math.max(1, Math.min(25, Math.round(+fit)      || 17));
  color    = Math.max(1, Math.min(25, Math.round(+color)    || 17));
  style    = Math.max(1, Math.min(25, Math.round(+style)    || 17));
  occasion = Math.max(1, Math.min(25, Math.round(+occasion) || 14));

  // Compute sum and use it as the score (breakdown is source of truth)
  let sum = fit + color + style + occasion;

  // Apply floor: if total is too low, scale everything up
  if (sum < 65) {
    const r = 65 / sum;
    fit      = Math.round(fit * r);
    color    = Math.round(color * r);
    style    = Math.round(style * r);
    occasion = Math.round(occasion * r);
    // Re-clamp after scaling up
    fit      = Math.max(1, Math.min(25, fit));
    color    = Math.max(1, Math.min(25, color));
    style    = Math.max(1, Math.min(25, style));
    occasion = Math.max(1, Math.min(25, occasion));
    sum = fit + color + style + occasion;
  }

  // If model gave a separate overall score, use it but reconcile
  score = Math.max(65, Math.round(+score) || sum);

  // If score differs from breakdown sum, scale breakdown to match score
  if (sum !== score && sum > 0) {
    const r = score / sum;
    fit      = Math.round(fit * r);
    color    = Math.round(color * r);
    style    = Math.round(style * r);
    occasion = Math.round(occasion * r);
    // Re-clamp after scaling (values can exceed 25 when scaling up)
    fit      = Math.max(1, Math.min(25, fit));
    color    = Math.max(1, Math.min(25, color));
    style    = Math.max(1, Math.min(25, style));
    occasion = Math.max(1, Math.min(25, occasion));
  }

  // Fix any remaining rounding drift so sub-scores sum exactly to score
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
