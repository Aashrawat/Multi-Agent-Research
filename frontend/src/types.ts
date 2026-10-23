export type JobStatus = "running" | "done" | "error";

export interface ResearchResult {
  search_results: string;
  scraped_content: string;
  report: string;
  feedback: string;
}

export interface Job {
  id: string;
  topic: string;
  status: JobStatus;
  /** 0 = starting, 1-4 = pipeline step, 5 = finished */
  step: number;
  /** true once the report has been stored in the user's history */
  saved: boolean | null;
  result: ResearchResult | null;
  error: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
}

export interface HistoryItem {
  id: string;
  topic: string;
  score: number | null;
  created_at: string;
}

export interface HistoryDetail extends HistoryItem {
  result: ResearchResult;
}
