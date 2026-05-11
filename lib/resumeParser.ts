export type ParsedEntry = {
  heading?: string;
  subheading?: string;
  bullets: string[];
  body?: string;
};

export type ParsedSection = {
  title: string;
  entries: ParsedEntry[];
};

export type ParsedResume = {
  name?: string;
  contact?: string;
  sections: ParsedSection[];
};

// ── Regexes ──────────────────────────────────────────────────────────────────

const SECTION_MD_RE = /^#{1,2}\s+(.+)/;
const BOLD_WHOLE_RE = /^\*\*([^*]+)\*\*\s*$/;
const ITALIC_WHOLE_RE = /^\*([^*]+)\*\s*$|^_([^_]+)_\s*$/;
const BULLET_RE = /^[-•*]\s+(.+)/;
const DATE_RE = /\b(\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|present|current)\b/i;
const CONTACT_RE = /@|\blinkedin\b|\bgithub\b|\(\d{3}\)|\d{3}[-.\s]\d{3}/i;
const ALLCAPS_SECTION_RE = /^[A-Z][A-Z\s&/\-]{2,}$/;

function clean(text: string): string {
  return text
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/^\*|\*$/g, "")
    .replace(/^#+\s*/, "")
    .trim();
}

// ── Parser ────────────────────────────────────────────────────────────────────

export function parseRewrittenResume(rawText: string): ParsedResume {
  const lines = rawText.split("\n");

  let name: string | undefined;
  let contact: string | undefined;
  const sections: ParsedSection[] = [];

  let inHeader = true;
  let currentSection: ParsedSection | null = null;
  let currentEntry: ParsedEntry | null = null;

  function flushEntry() {
    if (!currentEntry || !currentSection) return;
    const hasContent =
      currentEntry.heading ||
      currentEntry.subheading ||
      currentEntry.bullets.length > 0 ||
      currentEntry.body;
    if (hasContent) currentSection.entries.push(currentEntry);
    currentEntry = null;
  }

  function flushSection() {
    flushEntry();
    if (currentSection) sections.push(currentSection);
    currentSection = null;
  }

  function startSection(title: string) {
    flushSection();
    currentSection = {
      title: title.replace(/\*/g, "").trim().toUpperCase(),
      entries: [],
    };
    inHeader = false;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // ── Markdown section heading: ## Experience  ──────────────────────────
    const mdSection = line.match(SECTION_MD_RE);
    if (mdSection) {
      const title = mdSection[1].trim();
      if (inHeader && !name) {
        name = clean(title);
      } else {
        startSection(title);
      }
      continue;
    }

    // ── ALL-CAPS section line: EXPERIENCE, EDUCATION ──────────────────────
    if (
      ALLCAPS_SECTION_RE.test(line) &&
      !BOLD_WHOLE_RE.test(line) &&
      !BULLET_RE.test(line)
    ) {
      startSection(line);
      continue;
    }

    // ── Whole-line bold: **Job Title** ────────────────────────────────────
    const boldMatch = line.match(BOLD_WHOLE_RE);
    if (boldMatch) {
      const text = boldMatch[1].trim();
      if (inHeader && !name) {
        name = text;
        inHeader = false;
        continue;
      }
      if (!currentSection) {
        currentSection = { title: "EXPERIENCE", entries: [] };
        inHeader = false;
      }
      flushEntry();
      currentEntry = { heading: text, bullets: [] };
      continue;
    }

    // ── Header phase ──────────────────────────────────────────────────────
    if (inHeader) {
      if (!name) {
        name = clean(line);
      } else if (!contact && (CONTACT_RE.test(line) || line.includes("|"))) {
        contact = clean(line);
      }
      continue;
    }

    // ── Bullet ────────────────────────────────────────────────────────────
    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      if (!currentSection) currentSection = { title: "EXPERIENCE", entries: [] };
      if (!currentEntry) currentEntry = { bullets: [] };
      currentEntry.bullets.push(bulletMatch[1].trim());
      continue;
    }

    // ── Whole-line italic → subheading ────────────────────────────────────
    const italicMatch = line.match(ITALIC_WHOLE_RE);
    if (italicMatch && currentEntry && !currentEntry.subheading) {
      currentEntry.subheading = (italicMatch[1] || italicMatch[2]).trim();
      continue;
    }

    // ── Short date-pattern line → subheading ──────────────────────────────
    if (
      currentEntry &&
      !currentEntry.subheading &&
      DATE_RE.test(line) &&
      line.length < 80
    ) {
      currentEntry.subheading = clean(line);
      continue;
    }

    // ── Body text ─────────────────────────────────────────────────────────
    if (currentSection) {
      if (!currentEntry) currentEntry = { bullets: [] };
      currentEntry.body = currentEntry.body
        ? currentEntry.body + "\n" + clean(line)
        : clean(line);
    }
  }

  flushSection();
  return { name, contact, sections };
}

// ── Filename helper ───────────────────────────────────────────────────────────

export function sanitizeFilename(
  name: string | undefined,
  ext: "docx" | "pdf"
): string {
  if (!name) return `resume.${ext}`;
  const sanitized = name
    .toLowerCase()
    .replace(/['"'‘’`]/g, "")  // remove apostrophes/quotes
    .replace(/[\s\-]+/g, "_")             // spaces and hyphens → underscore
    .replace(/[^a-z0-9_]/g, "")           // remove remaining special chars
    .replace(/_+/g, "_")                  // collapse multiple underscores
    .replace(/^_+|_+$/g, "")              // trim leading/trailing underscores
    .slice(0, 50);
  return sanitized ? `${sanitized}_resume.${ext}` : `resume.${ext}`;
}
