import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        connected: false, 
        error: "Supabase not configured",
        hint: "Check your SUPABASE_URL and SUPABASE_API in .env.local"
      }, { status: 500 });
    }
    
    // Test connection by querying a table (will fail gracefully if table doesn't exist)
    const { data, error } = await supabase.from("groups").select("count").limit(1);
    
    if (error) {
      return NextResponse.json({ 
        connected: false, 
        error: error.message,
        hint: "Make sure you've created the tables using supabase-schema.sql"
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      connected: true, 
      message: "Successfully connected to Supabase!",
      tables: "groups table is accessible"
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      connected: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      hint: "Check your SUPABASE_URL and SUPABASE_API in .env.local"
    }, { status: 500 });
  }
}

