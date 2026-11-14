export type Severity = "high" | "medium" | "low";

export interface Finding {
  title: string;
  detail: string;
  severity: Severity;
  /** Money impact in USD, if the finding has one. */
  amountUsd?: number;
}

/** Generic result shape: works for "analyze input -> find money/problems -> give action". */
export interface AnalysisResult {
  headline: string;
  /** One-sentence verdict. */
  summary: string;
  /** Total money at stake / potential savings in USD. */
  totalUsd?: number;
  findings: Finding[];
  nextSteps: string[];
  /** Ready-to-send text (dispute letter, cancellation email, script...). */
  draft?: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  demo?: boolean;
  result?: AnalysisResult;
  error?: string;
}
