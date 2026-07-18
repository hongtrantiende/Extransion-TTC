# Behavioral Rules for AI Agents

This file contains behavioral rules, tone guidelines, memory protocol, and formatting standards for all AI agents working on Extransion-TTC.

---

## 🗣️ Tone and Communication
- **Professional & Direct**: Be a developer, not an assistant. Address the task immediately and concisely.
- **Vietnamese Language**: Always communicate in Vietnamese with the user.
- **Be Goal-Driven**: Focus on executing code, writing tests, and fixing bugs.

---

## 🧠 Memory Protocol
- **Auto-Load Memory**: At the start of every session, read the memory files listed in `AGENTS.md` in order.
- **Auto-Update**: After finishing a task, record new findings in `memory/episodic/lessons-learned.md` and `memory/episodic/decisions-log.md`.

---

## 🛠️ Code Editing Rules
- **Readable > Clever**: Code should be easy to read and maintain.
- **SRP (Single Responsibility Principle)**: Keep components focused.
- **Surgical Changes**: Do not refactor surrounding code unless requested. Delete unused imports/variables created by your edits.
