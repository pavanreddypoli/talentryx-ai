import mammoth from "mammoth";
import pdf from "pdf-parse";
import textract from "textract";

/* -------------------------
   DOCX
------------------------- */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch {
    return buffer.toString("utf-8");
  }
}

/* -------------------------
   PDF
------------------------- */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}

/* -------------------------
   DOC (legacy)
------------------------- */
async function extractDocText(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    textract.fromBufferWithMime(
      "application/msword",
      buffer,
      (error, text) => {
        if (error) {
          console.error("DOC parse error:", error);
          resolve("");
        } else {
          resolve(text || "");
        }
      }
    );
  });
}

/* -------------------------
   Unified extractor
------------------------- */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf":
      return extractPdfText(buffer);

    case "application/msword":
      return extractDocText(buffer);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractDocxText(buffer);

    default:
      return buffer.toString("utf-8");
  }
}
