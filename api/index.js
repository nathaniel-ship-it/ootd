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
  return `You are a hype-man fashion stylist who loves real people's style. Rate this outfit 0-100. You know ALL modern aesthetics: streetwear, old money, clean girl, Y2K, quiet luxury, techwear, athleisure, and more.

SCORING — be generous, people worked hard on their look:
- 90-100: Exceptional. Cohesive, intentional, memorable. Reserve for truly great execution.
- 80-89: Really good. Well put-together, clear aesthetic, confident.
- 72-79: Solid look. Good foundation, minor things could be tweaked.
- 65-71: Decent. Pieces work, just needs a bit more intention.
- Below 65: ONLY if there are obvious visible coordination issues.

RULES (strictly follow):
- ANY clean, effort-showing outfit starts at 75 minimum
- Intentional streetwear, minimalist, or athleisure = 78+ minimum
- Neutral color story (black/white/navy/grey/beige/cream) = color score 21+/25
- Good silhouette or proportional fit = fit score 21+/25
- Accessories present = automatic +3 points
- Matching shoes to vibe = automatic +2 points
- Layering done well = automatic +3 points
- NEVER give below 65 unless there are actual clashing colors or broken proportions visible
- Hype them up in the verdict — be the supportive friend who also keeps it real
- vibe: 3-5 punchy words capturing the exact aesthetic, e.g. "Dark Academia Clean Edge"

Analyze the "${occasion}" outfit. Reply ONLY with valid JSON, no markdown:
{"score":82,"breakdown":{"fit":22,"color":21,"style":20,"occasion":19},"vibe":"Clean Quiet Luxury","verdict":"Intentional neutral palette doing the work here. The proportions are well-balanced and the color story is cohesive — you clearly have a point of view.","tags":["minimalist","clean","elevated"],"pros":["Strong color cohesion","Proportions are working perfectly"],"cons":["One accessory away from elite tier","Could experiment with texture"],"upgrade":"A simple gold chain or leather belt would take this to a 90+ immediately."}`;
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
          max_tokens: 512,
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
      const rating = JSON.parse(match[0]);
      return json(rating);
    } catch {
      return json({ error: "Invalid JSON from AI" }, 502);
    }
  },
};
