import { NextResponse } from "next/server";
import { Document, Packer, Paragraph } from "docx";

export async function POST(req: Request) {
  try {
    const { content, filename } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Missing resume content" },
        { status: 400 }
      );
    }

    const doc = new Document({
      sections: [
        {
          children: content.split("\n").map(
            (line: string) =>
              new Paragraph({
                children: [],
                text: line,
              })
          ),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename || "resume.docx"}"`,
      },
    });
  } catch (err) {
    console.error("DOCX generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
