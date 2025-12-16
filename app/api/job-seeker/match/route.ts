import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobDesc } = body;

    if (!jobDesc) {
      return NextResponse.json(
        { error: "Missing job description" },
        { status: 400 }
      );
    }

    // 🧪 TEMP MOCK LOGIC (Phase 1)
    const score = Math.floor(60 + Math.random() * 30);

    return NextResponse.json({
      score,
      summary: "Your resume matches many of the core requirements.",
      strengths: [
        "Relevant technical skills",
        "Clear experience section",
      ],
      gaps: [
        "Missing cloud keywords",
        "Leadership examples could be stronger",
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process match request" },
      { status: 500 }
    );
  }
}
