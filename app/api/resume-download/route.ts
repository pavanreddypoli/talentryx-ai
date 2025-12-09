// app/api/resume-download/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // ✅ Auth check (recommended)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const path = body.path;

    if (!path) {
      return NextResponse.json(
        { error: "Missing file path" },
        { status: 400 }
      );
    }

    // ✅ MUST match your storage bucket name exactly
    const { data: signedUrlData, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60 * 10); // 10 minutes

    if (error || !signedUrlData) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrlData.signedUrl });
  } catch (err) {
    console.error("Error generating download URL:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
