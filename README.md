# Multi-Agent-Research

An AI research assistant where multiple agents collaborate to turn a topic into a sourced, scored report.

**Live demo:** https://multi-agent-research-peach.vercel.app/

## How the agent works

![Agent workflow](docs/agent-workflow.png)

1. **Search agent** takes the research topic and uses the Tavily API to pull live web results.
2. **Reader agent** picks the most relevant result and scrapes the page with Beautiful Soup.
3. **Writer chain** drafts a report (Introduction, Key Findings, Conclusion, Sources).
4. **Critic chain** reviews the report and gives a score out of 10 with feedback.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, JWT auth, MongoDB
- **AI:** LangChain, OpenAI (`gpt-4o-mini`), Tavily, Beautiful Soup
