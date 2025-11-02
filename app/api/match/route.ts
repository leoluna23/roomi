import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Profile } from "@/lib/types";

function ruleScore(a: Profile, b: Profile) {
  let s = 50;
  if (a.sleep_sched && b.sleep_sched && a.sleep_sched === b.sleep_sched) s += 8;
  if (a.cleanliness && b.cleanliness && a.cleanliness === b.cleanliness) s += 10;
  if (a.noise && b.noise && a.noise === b.noise) s += 7;
  if (a.guests && b.guests && a.guests === b.guests) s += 5;

  if (
    a.budget_min != null && a.budget_max != null &&
    b.budget_min != null && b.budget_max != null
  ) {
    const overlap = Math.max(0, Math.min(a.budget_max, b.budget_max) - Math.max(a.budget_min, b.budget_min));
    s += overlap > 0 ? 10 : -10;
  }

  const ai = new Set(a.interests || []);
  const bi = new Set(b.interests || []);
  const common = [...ai].filter(x => bi.has(x)).length;
  s += Math.min(15, common * 5);

  return Math.max(0, Math.min(100, s));
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: NextRequest) {
  const { me, candidates } = await req.json() as { me: Profile; candidates: Profile[] };
  if (!me || !Array.isArray(candidates)) {
    return NextResponse.json({ error: "Provide { me, candidates[] }" }, { status: 400 });
  }

  const top = candidates
    .map(p => ({ p, score: ruleScore(me, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const results = await Promise.all(top.map(async ({ p, score }) => {
    const prompt = `
Compare two student roommate profiles. Use ONLY this JSON.
Output strict JSON: {summary:string, friction:string[], tips:string[]}.
Keep it friendly and concise.

ME:
${JSON.stringify(me)}
CANDIDATE:
${JSON.stringify(p)}
SCORE: ${score}
`;
    try {
      const res = await model.generateContent(prompt);
      const parsed = JSON.parse(res.response.text().trim());
      return { profile: p, score, ...parsed };
    } catch {
      return {
        profile: p,
        score,
        summary: "Looks like a decent match overall.",
        friction: [],
        tips: ["Set expectations early about chores and quiet hours."]
      };
    }
  }));

  return NextResponse.json({ results }, { status: 200 });
}
