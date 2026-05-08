import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function PATCH(req: Request) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { full_name } = body as { full_name?: string };

  if (typeof full_name !== "string" || !full_name.trim()) {
    return NextResponse.json({ error: "full_name must be a non-empty string" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("users")
    .update({ full_name: full_name.trim() })
    .eq("email", email);

  if (error) {
    console.error("PATCH /api/recruiter/settings:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
