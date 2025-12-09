"use client";

import { Button } from "@/components/ui/button";

export default function DownloadDocxButton({
  text,
  filename = "AI_Rewritten_Resume.docx",
}: {
  text: string;
  filename?: string;
}) {
  const handleDownload = async () => {
    const res = await fetch("/api/ai/download-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, filename }),
    });

    if (!res.ok) {
      alert("Failed to generate DOCX");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Button
      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
      onClick={handleDownload}
    >
      Download DOCX
    </Button>
  );
}
