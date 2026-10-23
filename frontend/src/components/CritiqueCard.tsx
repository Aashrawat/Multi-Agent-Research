import { parseCritique } from "../critique";

export default function CritiqueCard({ text }: { text: string }) {
  const critique = parseCritique(text);

  if (!critique) {
    return <pre className="whitespace-pre-wrap text-sm text-slate-300">{text}</pre>;
  }

  const { score, strengths, improvements, verdict } = critique;
  const scoreColor =
    score === null
      ? "text-slate-300"
      : score >= 8
        ? "text-emerald-400"
        : score >= 5
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-2">
        <span className={`text-5xl font-bold ${scoreColor}`}>{score ?? "–"}</span>
        <span className="pb-1 text-lg text-slate-500">/ 10</span>
      </div>

      {verdict && (
        <p className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm italic text-slate-300">
          “{verdict}”
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-emerald-400">Strengths</h4>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-amber-400">Areas to improve</h4>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
            {improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
