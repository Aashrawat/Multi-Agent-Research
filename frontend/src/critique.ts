export interface Critique {
  score: number | null;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

const bullets = (block: string): string[] =>
  block
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

/**
 * Parses the critic chain output, which follows the format:
 *   Score: X/10 / Strength: ... / Areas to improve: ... / One line verdict: ...
 * Returns null if the text doesn't look like that format.
 */
export function parseCritique(text: string): Critique | null {
  const score = text.match(/Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const strength = text.match(/Strengths?:\s*([\s\S]*?)(?=Areas to improve:|One line verdict:|$)/i);
  const improve = text.match(/Areas to improve:\s*([\s\S]*?)(?=One line verdict:|$)/i);
  const verdict = text.match(/One line verdict:\s*([\s\S]*)$/i);

  if (!score && !strength && !improve && !verdict) return null;

  return {
    score: score ? Number(score[1]) : null,
    strengths: strength ? bullets(strength[1]) : [],
    improvements: improve ? bullets(improve[1]) : [],
    verdict: verdict ? verdict[1].replace(/^\s*[-*•]\s*/, "").trim() : "",
  };
}
