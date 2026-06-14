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
- occasion (1-25): How appropriate is this outfit for "${occasion}"?
  · 22-25: Outfit is clearly built for "${occasion}" (gym wear → gym, suit → work, evening dress → date night)
  · 16-21: Works reasonably well for "${occasion}" without looking wrong
  · 10-15: Questionable or awkward for "${occasion}"
  · Below 10: Clearly wrong vibe or formality for "${occasion}"

Set your "score" equal to fit + color + style + occasion exactly.

OUTPUT RULES:
- vibe: 2-4 words, real aesthetic names only: "Quiet Luxury", "Dark Academia", "Clean Girl", "Coastal Cowgirl", "Old Money", "Streetwear", "Soft Boy", "Tomboy Chic", "Mob Wife", "Indie Sleaze", "Gorpcore", "Balletcore", "Coquette", "Techwear", "Preppy", "Y2K", "Boho Luxe", "Corporate Baddie", "Skater Grunge", "Athleisure"
- verdict: 1-2 sentences, enthusiastic and specific about the aesthetic
- pros: 2 specific compliments
- cons: 1-2 constructive suggestions
- upgrade: one actionable tip

Reply ONLY with valid JSON, no markdown:
{"score":80,"breakdown":{"fit":22,"color":21,"style":20,"occasion":17},"vibe":"Clean Girl","verdict":"Effortless and put-together — the neutral palette does the heavy lifting here.","tags":["minimal","clean","neutral"],"pros":["Proportions are balanced and flattering","Color story is cohesive"],"cons":["Could use one statement piece"],"upgrade":"Add a simple gold necklace to elevate the whole look."}

Note: score = 22+21+20+17 = 80. The breakdown must always sum exactly to score.`;
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

// Map (vibe, occasion) → occasion score override using semantic matching.
// Returns null to use the model's own score; returns a number to override.
function vibeOccasionScore(vibe, occasion) {
  const v = vibe.toLowerCase();
  const o = occasion.toLowerCase();

  // Occasion buckets
  const isGym      = /gym|workout|exercise|sport|fitness|running|yoga/.test(o);
  const isWork     = /work|office|business|meeting|professional|interview/.test(o);
  const isDateNight= /date|dinner|romantic|night out/.test(o);
  const isParty    = /party|club|bar|night|festival/.test(o);
  const isCasual   = /casual|everyday|errands|brunch|weekend|coffee/.test(o);
  const isFormal   = /formal|gala|wedding|black.?tie|ceremony/.test(o);
  const isBeach    = /beach|pool|vacation|summer/.test(o);
  const isOutdoor  = /hike|hiking|outdoor|camping|nature/.test(o);

  // Vibe buckets
  const isAthleisure  = /athleisure|gorpcore|sport/.test(v);
  const isElegant     = /old money|quiet luxury|mob wife|coquette|balletcore/.test(v);
  const isStreet      = /streetwear|skater|grunge|hypebeast|techwear|indie sleaze/.test(v);
  const isBusiness    = /corporate|business|preppy|smart casual/.test(v);
  const isCasualVibe  = /clean girl|casual|soft boy|tomboy|y2k|boho/.test(v);
  const isMaximal     = /mob wife|maximalist|edgy/.test(v);

  if (isGym) {
    if (isAthleisure) return 24;
    if (isStreet)     return 17;
    if (isElegant)    return 8;
    if (isBusiness)   return 6;
    return 14;
  }
  if (isWork) {
    if (isBusiness)   return 24;
    if (isElegant)    return 20;
    if (isCasualVibe) return 16;
    if (isStreet)     return 10;
    if (isAthleisure) return 7;
    return 14;
  }
  if (isDateNight) {
    if (isElegant)    return 24;
    if (isMaximal)    return 22;
    if (isCasualVibe) return 18;
    if (isStreet)     return 16;
    if (isAthleisure) return 9;
    return 17;
  }
  if (isParty) {
    if (isElegant || isMaximal) return 23;
    if (isStreet)     return 21;
    if (isCasualVibe) return 17;
    if (isAthleisure) return 10;
    return 18;
  }
  if (isFormal) {
    if (isElegant)    return 24;
    if (isBusiness)   return 18;
    if (isCasualVibe) return 12;
    if (isStreet)     return 8;
    if (isAthleisure) return 5;
    return 12;
  }
  if (isBeach) {
    if (isAthleisure || isCasualVibe) return 23;
    if (isStreet)     return 17;
    if (isElegant)    return 12;
    if (isBusiness)   return 6;
    return 16;
  }
  if (isOutdoor) {
    if (isAthleisure) return 24;
    if (isCasualVibe || isStreet) return 18;
    if (isElegant || isBusiness)  return 9;
    return 15;
  }
  if (isCasual) {
    if (isCasualVibe) return 23;
    if (isStreet)     return 21;
    if (isAthleisure) return 19;
    if (isBusiness)   return 16;
    if (isElegant)    return 14;
    return 19;
  }

  if (/travel|trip|airport|vacation/.test(o)) {
    if (isAthleisure || isCasualVibe) return 22;
    if (isStreet)     return 20;
    if (isBusiness)   return 17;
    if (isElegant)    return 13;
    return 18;
  }

  return null; // unknown occasion — default 18 used in caller
}

function enforceMinimums(rating) {
  let { score, breakdown } = rating;
  let { fit = 17, color = 17, style = 17 } = breakdown || {};

  // Clamp model's fit/color/style (we replace occasion entirely)
  fit   = Math.max(1, Math.min(25, Math.round(+fit)   || 17));
  color = Math.max(1, Math.min(25, Math.round(+color) || 17));
  style = Math.max(1, Math.min(25, Math.round(+style) || 17));

  // Replace occasion with semantic vibe+occasion match; 18 if unknown occasion
  const vibeOverride = vibeOccasionScore(cleanVibe(rating.vibe), rating.occasion_label || "");
  const occasion = vibeOverride !== null ? vibeOverride : 18;

  // Keep model's overall score but enforce minimum of 85
  const target = Math.max(85, Math.min(100, Math.round(+score) || 85));

  // Budget for fit+color+style = target minus the fixed occasion score
  const budget = Math.min(Math.max(0, target - occasion), 75); // cap at 3×25

  // Distribute budget proportionally using model's fit/color/style ratios
  const fcsRaw = fit + color + style || 51;
  fit   = Math.max(1, Math.min(25, Math.round(fit   / fcsRaw * budget)));
  color = Math.max(1, Math.min(25, Math.round(color / fcsRaw * budget)));
  style = Math.max(1, Math.min(25, Math.round(style / fcsRaw * budget)));

  // Score is always exactly the sum — mathematically impossible to mismatch
  score = fit + color + style + occasion;

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
      // Attach occasion label so enforceMinimums can use it for vibe matching
      raw.occasion_label = occasion;
      const rating = enforceMinimums(raw);
      return json(rating);
    } catch {
      return json({ error: "Invalid JSON from AI" }, 502);
    }
  },
};
