import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { status: "error", error: "missing_env_vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { status: "error", error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
