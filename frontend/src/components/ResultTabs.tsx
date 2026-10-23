import { useState } from "react";
import type { ResearchResult } from "../types";
import Markdown from "./Markdown";
import CritiqueCard from "./CritiqueCard";

type TabKey = "report" | "critique" | "search" | "scraped";

const TABS: { key: TabKey; label: string }[] = [
  { key: "report", label: "Report" },
  { key: "critique", label: "Critic feedback" },
  { key: "search", label: "Search results" },
  { key: "scraped", label: "Scraped content" },
];

export default function ResultTabs({ result }: { result: ResearchResult }) {
  const [tab, setTab] = useState<TabKey>("report");
  const [copied, setCopied] = useState(false);

  const copyReport = async () => {
    await navigator.clipboard.writeText(result.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab === "report" && (
          <button
            onClick={copyReport}
            className="ml-auto rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
          >
            {copied ? "Copied!" : "Copy report"}
          </button>
        )}
      </div>

      <div className="p-6">
        {tab === "report" && <Markdown>{result.report}</Markdown>}
        {tab === "critique" && <CritiqueCard text={result.feedback} />}
        {tab === "search" && (
          <pre className="whitespace-pre-wrap break-words text-sm text-slate-300">
            {result.search_results}
          </pre>
        )}
        {tab === "scraped" && <Markdown>{result.scraped_content}</Markdown>}
      </div>
    </section>
  );
}
