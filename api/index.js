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
- Monochrome or neutral palette (all black, all white, beige/cream tones, navy): score 80+
- Clear aesthetic (streetwear, old money, clean girl, Y2K, athleisure, techwear, etc.): score 78+
- Fitted clothes with good silhouette: fit score 21+/25
- Neutral color palette: color score 22+/25
- Accessories visible: add 3 to score
- Shoes match the vibe: add 2 to score
- Layering present: add 3 to score

BREAKDOWN — each sub-score out of 25, they MUST sum to the total score:
- fit: how well clothes fit and flatter the body
- color: how well colors work together
- style: how on-trend and aesthetic the outfit is
- occasion: how appropriate for "${occasion}"

OUTPUT RULES:
- Be enthusiastic and specific in the verdict — name the exact aesthetic you see
- vibe: 3-5 punchy words (e.g. "Dark Academia Clean Edge", "Coastal Old Money", "Y2K Streetwear")
- pros: 2 specific compliments about what's working
- cons: 1-2 gentle, constructive suggestions (frame positively)
- upgrade: one specific actionable tip to push the score higher

Analyze this "${occasion}" outfit. Reply ONLY with valid JSON, no markdown fences:
{"score":84,"breakdown":{"fit":22,"color":21,"style":21,"occasion":20},"vibe":"Clean Quiet Luxury","verdict":"You nailed the quiet luxury brief — neutral palette, clean proportions, nothing fighting for attention. This is the kind of effortless that actually takes taste.","tags":["minimalist","clean","elevated"],"pros":["Color story is tight and intentional","Proportions are doing serious work here"],"cons":["One texture element could add depth"],"upgrade":"A slim leather belt or gold chain would push this into the 90s instantly."}`;
}

// Enforce score minimums server-side so the model can't ignore the rules
function enforceMinimums(rating) {
  let { score, breakdown } = rating;
  const { fit, color, style, occasion } = breakdown || {};

  // Floor: nothing below 68 unless we have a reason (we can't detect a reason, so just floor at 68)
  if (score < 68) score = 68;

  // Rebuild breakdown proportionally if it doesn't sum to score
  const sum = (fit || 0) + (color || 0) + (style || 0) + (occasion || 0);
  let bd = { fit, color, style, occasion };
  if (sum !== score && sum > 0) {
    const ratio = score / sum;
    bd = {
      fit: Math.round(fit * ratio),
      color: Math.round(color * ratio),
      style: Math.round(style * ratio),
      occasion: Math.round(occasion * ratio),
    };
    // Fix rounding drift
    const newSum = bd.fit + bd.color + bd.style + bd.occasion;
    bd.fit += score - newSum;
  }

  // Clamp each sub-score to 1-25
  for (const k of ['fit','color','style','occasion']) {
    bd[k] = Math.max(1, Math.min(25, bd[k] || 17));
  }

  return { ...rating, score, breakdown: bd };
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
