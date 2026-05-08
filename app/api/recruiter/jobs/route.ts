import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (status && !["open", "closed", "archived"].includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: open, closed, archived" },
      { status: 400 }
    );
  }

  let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/recruiter/jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(req: Request) {
  const email = req.headers.get("x-user-email");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, location, experience_level, status } = body as {
    title?: string;
    description?: string;
    location?: string;
    experience_level?: string;
    status?: string;
  };

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "description is required" }, { status: 400 });
  if (status && !["open", "closed", "archived"].includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: open, closed, archived" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userErr || !user) {
    return NextResponse.json({ error: "Recruiter account not found" }, { status: 404 });
  }

  const { data: job, error: insertErr } = await supabase
    .from("jobs")
    .insert({
      recruiter_id: user.id,
      title,
      description,
      location: location ?? null,
      experience_level: experience_level ?? null,
      status: status ?? "open",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("POST /api/recruiter/jobs:", insertErr);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}
