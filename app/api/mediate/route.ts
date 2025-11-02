import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Gemini Key loaded:", !!process.env.GOOGLE_API_KEY);

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: NextRequest) {
  const { issue, tone = "empathetic", conflictType = "general", escalationLevel = "medium" } = await req.json() as { 
    issue?: string; 
    tone?: string;
    conflictType?: string;
    escalationLevel?: string;
  };
  if (!issue) return NextResponse.json({ error: "issue is required" }, { status: 400 });

  // Check if API key is configured
  if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.trim() === "") {
    console.error("GOOGLE_API_KEY is not set in environment variables");
    return NextResponse.json({ 
      error: "API key not configured. Please set GOOGLE_API_KEY in your .env.local file." 
    }, { status: 500 });
  }

  const toneInstructions: Record<string, string> = {
    empathetic: "Use a warm, understanding tone that acknowledges both perspectives",
    direct: "Be clear and straightforward without being harsh",
    "polite-but-firm": "Be courteous while clearly stating boundaries and expectations",
    humorous: "Use light humor to diffuse tension while still addressing the issue",
    "solution-focused": "Emphasize practical solutions and collaborative problem-solving"
  };

  const escalationGuidance: Record<string, string> = {
    low: "Keep it casual and friendly - this is a minor issue",
    medium: "Be respectful but clear - this needs to be addressed",
    high: "Be direct and urgent - this is a serious matter that requires immediate attention"
  };

  const system = `
You rephrase roommate complaints into respectful, solution-focused messages.
Rules: 
- 2–4 sentences, propose 1 concrete next step
- Avoid blame, use "I" statements
- Match the tone: ${toneInstructions[tone] || toneInstructions.empathetic}
- Escalation level: ${escalationGuidance[escalationLevel] || escalationGuidance.medium}
- Conflict type: ${conflictType}
- Return JSON: { message: string, alt_openers: string[] }.
- Provide 2-3 alternative opening lines that are shorter and more casual.
`;

  try {
    const res = await model.generateContent(`${system}\nTONE: ${tone}\nCOMPLAINT: "${issue}"`);
    const text = res.response.text().trim();
    console.log("Gemini raw response:", text);
    
    // Try to extract JSON if it's wrapped in markdown code blocks
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    const parsed = JSON.parse(jsonText);
    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("Error in mediate route:", error);
    // If it's an API key error, return that specifically
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return NextResponse.json({ 
        error: "Invalid API key. Please check your GOOGLE_API_KEY in .env.local" 
      }, { status: 500 });
    }
    return NextResponse.json({
      message: "Hey, could we chat about this and set up a quick plan together? I want us both to feel comfortable here.",
      alt_openers: ["Can we make a small schedule?", "What would work for you?"]
    }, { status: 200 });
  }
}
