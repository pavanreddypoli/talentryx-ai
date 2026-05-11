import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
} from "docx";
import type { ParsedResume } from "./resumeParser";

const FONT = "Calibri";

// Half-point sizes (docx uses half-points): 11pt=22, 10pt=20, 13pt=26, 18pt=36
const SZ = { name: 36, contact: 20, section: 26, heading: 22, sub: 20, body: 22 };

export async function generateDocx(parsed: ParsedResume): Promise<Blob> {
  const children: Paragraph[] = [];

  // Name
  if (parsed.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: parsed.name, bold: true, size: SZ.name, font: FONT }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    );
  }

  // Contact
  if (parsed.contact) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: parsed.contact, size: SZ.contact, color: "555555", font: FONT }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // Sections
  for (const section of parsed.sections) {
    // Section title with bottom border
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: section.title, bold: true, size: SZ.section, font: FONT }),
        ],
        spacing: { before: 240, after: 80 },
        border: {
          bottom: { style: "single", size: 6, color: "000000", space: 1 },
        },
      })
    );

    for (const entry of section.entries) {
      // Entry heading
      if (entry.heading) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: entry.heading, bold: true, size: SZ.heading, font: FONT }),
            ],
            spacing: { before: 120, after: 40 },
          })
        );
      }

      // Subheading
      if (entry.subheading) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: entry.subheading,
                italics: true,
                size: SZ.sub,
                color: "444444",
                font: FONT,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }

      // Bullets
      for (const bullet of entry.bullets) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `•  ${bullet}`, size: SZ.body, font: FONT }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
            spacing: { after: 40 },
          })
        );
      }

      // Body
      if (entry.body) {
        for (const line of entry.body.split("\n")) {
          if (!line.trim()) continue;
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line.trim(), size: SZ.body, font: FONT })],
              spacing: { after: 60 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
