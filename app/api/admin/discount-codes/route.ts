import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("email", user.email!)
    .single();
  return data?.is_admin ? user : null;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { code, discount_percent, description, max_uses, expires_at } = body;

  if (!code?.trim() || !discount_percent) {
    return NextResponse.json(
      { error: "code and discount_percent are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .insert({
      code: code.trim().toUpperCase(),
      discount_percent,
      description: description ?? null,
      max_uses: max_uses ?? null,
      expires_at: expires_at ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A code with that name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
