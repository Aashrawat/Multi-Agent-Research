import { useState, type FormEvent } from "react";

interface Props {
  disabled: boolean;
  onSubmit: (topic: string) => void;
}

const SUGGESTIONS = [
  "Impact of AI on software jobs",
  "State of fusion energy",
  "Future of electric vehicles",
];

export default function TopicForm({ disabled, onSubmit }: Props) {
  const [topic, setTopic] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = topic.trim();
    if (value) onSubmit(value);
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={disabled}
          placeholder="Enter a research topic…"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !topic.trim()}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "Researching…" : "Run research"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => setTopic(s)}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-200 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
