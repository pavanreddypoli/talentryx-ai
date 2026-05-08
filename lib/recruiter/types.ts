export type Candidate = {
  id: string;
  session_id: string;
  candidate_name: string;
  file_name: string;
  score: number; // 0–1 decimal; display as Math.round(score * 100)
  keyword_match_percent: number;
  matched_keywords: string[] | null;
  missing_keywords: string[] | null;
  summary: string[] | null; // stored strengths array
  status: string; // "pending" | "shortlisted" | "rejected"
  recruiter_notes: string | null;
  storage_path: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  experience_level: string | null;
  status: string;
  created_at: string;
  recruiter_id: string;
};

export type FilterState = {
  score: "all" | "80plus" | "60to79" | "below60";
  status: "all" | "pending" | "shortlisted" | "rejected";
  search: string;
};
