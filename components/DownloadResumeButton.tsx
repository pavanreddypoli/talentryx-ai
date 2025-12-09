"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

export default function DownloadResumeButton({
  storagePath,
  fileName,
}: {
  storagePath: string;
  fileName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: any) => {
    e.stopPropagation(); // ⛔ prevents row-click opening modal
    setLoading(true);

    try {
      const res = await fetch("/api/resume-download", {
        method: "POST",
        body: JSON.stringify({ path: storagePath }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!data.url) {
        alert("Unable to generate download link.");
        return;
      }

      // Trigger real download
      const link = document.createElement("a");
      link.href = data.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("Download failed:", err);
    }

    setLoading(false);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs flex items-center gap-1"
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="h-3 w-3" />
      {loading ? "Downloading…" : "Resume"}
    </Button>
  );
}
