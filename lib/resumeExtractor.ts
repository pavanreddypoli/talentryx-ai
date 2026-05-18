import mammoth from "mammoth";
import officeParser from "officeparser";

/* -------------------------
   DOCX extraction
------------------------- */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  if (!result?.value?.trim()) {
    throw new Error("DOCX parsed but no text could be extracted");
  }
  return result.value;
}

/* -------------------------
   DOC (legacy) extraction
------------------------- */
export async function extractDocText(buffer: Buffer): Promise<string> {
  try {
    return await new Promise<string>((resolve) => {
      officeParser.parseOffice(buffer, (data, err) => {
        if (err) {
          console.error("DOC parse error:", err);
          resolve("");
        } else {
          resolve(data || "");
        }
      });
    });
  } catch (err) {
    console.error("DOC parse fatal error:", err);
    return "";
  }
}

/* -------------------------
   PDF extraction (Vercel + Next 16 safe)
------------------------- */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require("pdf-parse");
  const parsed = await pdfParse(buffer);
  if (!parsed?.text?.trim()) {
    throw new Error("PDF parsed but no text could be extracted (possibly a scanned/image-only PDF)");
  }
  return parsed.text;
}


/* -------------------------
   Unified extractor (optional)
------------------------- */
export async function extractResumeText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const name = filename.toLowerCase();

  if (name.endsWith(".pdf")) return extractPdfText(buffer);
  if (name.endsWith(".docx")) return extractDocxText(buffer);
  if (name.endsWith(".doc")) return extractDocText(buffer);

  try {
    return buffer.toString("utf-8");
  } catch {
    return "";
  }
}
