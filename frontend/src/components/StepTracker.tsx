interface Props {
  /** 0 = starting, 1-4 = running that step, 5 = all done */
  step: number;
  failed?: boolean;
}

const STEPS = [
  { title: "Search agent", desc: "Searching the web" },
  { title: "Reader agent", desc: "Scraping top resource" },
  { title: "Writer", desc: "Drafting the report" },
  { title: "Critic", desc: "Reviewing the report" },
];

export default function StepTracker({ step, failed = false }: Props) {
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n && !failed;
        const errored = step === n && failed;

        return (
          <li
            key={s.title}
            className={`rounded-xl border p-4 transition ${
              errored
                ? "border-red-500/60 bg-red-500/10"
                : active
                  ? "border-indigo-500 bg-indigo-500/10"
                  : done
                    ? "border-emerald-600/50 bg-emerald-500/5"
                    : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  errored
                    ? "bg-red-500 text-white"
                    : done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-800 text-slate-400"
                }`}
              >
                {done ? "✓" : errored ? "!" : n}
              </span>
              <span className="text-sm font-medium">{s.title}</span>
              {active && (
                <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">{s.desc}</p>
          </li>
        );
      })}
    </ol>
  );
}
