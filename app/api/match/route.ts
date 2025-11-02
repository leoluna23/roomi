import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
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
  const body = await req.json();
  const { me, candidates, user_id } = body as { me: Profile; candidates?: Profile[]; user_id?: string };
  
  if (!me) {
    return NextResponse.json({ error: "Provide { me } or { me, candidates[] }" }, { status: 400 });
  }

  let candidateList: Profile[] = [];

  // If candidates are provided, use them (backwards compatibility)
  if (Array.isArray(candidates)) {
    candidateList = candidates;
  } else if (user_id && supabase) {
    // Fetch candidates from database, excluding the current user
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .neq("user_id", user_id)
        .not("name", "is", null); // Only profiles with names
      
      if (error) {
        console.error("Error fetching candidates:", error);
        return NextResponse.json({ error: "Failed to fetch candidates from database" }, { status: 500 });
      }
      
      // Convert database profiles to Profile format
      candidateList = (data || []).map((p: any) => ({
        name: p.name || "",
        major: p.major || "",
        bio: p.bio || "",
        sleep_sched: p.sleep_sched || "normal",
        cleanliness: p.cleanliness || "medium",
        noise: p.noise || "moderate",
        guests: p.guests || "sometimes",
        budget_min: p.budget_min ? parseFloat(p.budget_min) : undefined,
        budget_max: p.budget_max ? parseFloat(p.budget_max) : undefined,
        interests: p.interests || [],
      }));
    } catch (err) {
      console.error("Error processing candidates:", err);
      return NextResponse.json({ error: "Failed to process candidates" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Provide either candidates[] or user_id to fetch from database" }, { status: 400 });
  }

  if (candidateList.length === 0) {
    return NextResponse.json({ 
      results: [],
      message: "No candidates found. Try adding some profiles to the database first."
    }, { status: 200 });
  }

  const top = candidateList
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
