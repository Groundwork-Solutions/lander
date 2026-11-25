# Master prompt: build your own Grok Bot-style agent desk

How to use it: open an empty folder in your AI coding agent, paste **Part 0**, then paste the other
parts one at a time. Don't move on until the part's "Done when" list is true. Each part builds on the last.

---

## Part 0: what we're building (paste this first)

```
I want to build my own AI agent desk: a desktop app where I create bots, chat with them, and each bot can use its
own web browser, remember things, learn skills, and run jobs on a schedule. Think of the layout of xAI's Grok Bot,
but built from scratch by us: don't copy anyone's code, name or logo.

Ground rules for the whole project:
- Keep it simple. Pick the simplest stack you can recommend: a small local backend, a plain web frontend and a
  single-file database. No heavy frameworks, no build step unless we really need one.
- It runs on my computer first. Later we'll add an always-on cloud server.
- Explain what you're doing in plain English as you go, and give me a README with the exact commands to run it.
- Build one part at a time. After each part, run it yourself, test it, and tell me what works and what doesn't.
- Never store API keys in plain text, never log them, never send them back to the screen.
- Ask me before adding anything I didn't ask for.

Don't write code yet. First, read this, then reply with: the folder layout you'd use, the database tables you'd
need, and any questions you have.
```

---

## Part 1: the app, bots and chat

```
Build the core app.

1. A local web server (only reachable from my own computer) and a desktop window that opens it, so it feels like a
   real app. Add a build script that makes a double-clickable app with an icon.
2. Bots: create, rename, delete. Each bot has a name, a shape and a color for its avatar, a "main job" (its
   instructions), and its own workspace folder. Left sidebar lists the bots.
3. Chat: one bot open at a time, with chats I can start, switch between, pin, rename and delete. Show only one empty
   "New chat", always at the top. Messages render Markdown with code blocks (each with a Copy button).
4. AI providers: let each bot pick a provider and model. Support:
   - my own AI subscription, by running the official app/command-line program I signed into myself, never
     reading or copying my login;
   - API keys for the main AI providers.
   Keys are stored encrypted (a master key file readable only by my user), shown only as the last 4 characters,
   with Save / Replace / Remove / Test buttons.
5. Stream the reply into the chat word by word while it's being written, like a normal AI chat app.
6. Show a timer while it works, and under each reply: the model, output tokens and how long it took.
7. If I send a message while the bot is working, it waits its turn (I can edit or unsend it before it starts).
   A Stop button stops the bot.

Done when: I can create two bots on different models, chat with both, see replies stream in, stop one mid-answer,
and my keys are encrypted on disk.
```

---

## Part 2: each bot gets its own computer

```
Give every bot its own browser and files.

1. A dedicated browser space per bot: a real browser with its own saved profile so logins persist. Only one runs at a time
   on my computer to save memory; it turns itself off after 15 idle minutes.
2. Browser tools the model can call: open a URL, read the page (text + a numbered list of clickable elements),
   click, type, press a key, scroll, go back, upload a file, take a screenshot. Bots that can see images get the
   screenshot.
3. A "Computer" panel in the app with a live view of the bot's screen. A "Take control" button hands me the mouse and
   keyboard (for logins and payments); "Give control back" lets the bot carry on from where I left it.
   Only show "Take over" / "Watch" in the chat when the bot is actually using its browser.
4. Browse like a careful person: short pauses between actions, normal typing speed, small scroll steps, and a limit
   of 150 actions per website per hour.
5. Robot checks / CAPTCHAs: the bot never tries to solve or get around them. It hands me the browser with a notice,
   waits up to 15 minutes for me to solve it, then continues.
6. Workspace files: tools to list, read and write files inside the bot's own folder only (no paths outside it).
7. Connect the browser and file tools to the subscription program too, so subscription bots get the same tools.
8. No shell commands for bots by default.

Done when: I ask a bot to search a site and summarize a page, I watch it in the live view, I take control and give it
back, and it saves a summary file in its workspace.
```

---

## Part 3: the brain (memory, skills, dreaming, jobs)

```
Give each bot a brain it can grow.

1. Memory: a folder per bot with MEMORY.md (a short index, loaded into every chat, first 200 lines) plus topic
   notes. Tools: memory_read, memory_write, memory_delete. A Brain screen where I can read, edit and delete notes.
   Teach the bot: if it doesn't know a key fact, go find it (web search for the outside world, its own files for
   itself) instead of saying "I can't tell".
2. Skills: step-by-step how-tos in skills/<name>/SKILL.md. I can run one from the chat box with /name. Shared skills
   for every bot live in one shared folder.
3. Dreaming ("sleep"): a button (and an optional nightly time) where the bot rereads its chats since the last dream,
   checks its notes against what happened, and PROPOSES fixes, new notes and skills. I approve each change by default
   (a wrong note gets trusted in every later chat), with an optional auto-apply switch per bot.
4. Scheduled jobs: a time of day (daily or weekdays) or every N minutes. The bot posts the job into its chat and works
   until it's done.
5. Autonomy switch per bot: "can post, send messages and submit forms without asking". Even with it on, it never
   buys, pays or types passwords.
6. Bots asking bots: a tool to ask another bot for help. A card pops up and nothing happens until I press Allow; the
   answer comes back to the first bot.
7. Slash commands in the chat box: /new /memory /skills /dream /jobs /computer /stop /settings /help.

Done when: a bot saves a lesson to memory, a dream proposes a change I approve, a job runs on schedule, and one bot
asks another for help after I allow it.
```

---

## Part 4: make it feel like a pro tool

```
Add the polish that makes it pleasant to use every day.

1. A live task list: for any job with 3+ steps, the bot writes a checklist (todo_write tool) that ticks off in the
   chat as it works.
2. Files changed: when a bot edits files, show "N files changed +12 −3" with a diff view (green added, red removed).
3. Retry and Edit: retry the last reply; edit any message I typed (what came after is hidden, not deleted).
4. Folded thinking: the bot's steps and visible reasoning fold into one "Thinking" line above its answer.
5. A usage meter above the chat box: for my subscription, how much of my plan's limits this used (from the
   program's own limit reports); for API providers, real dollars. Also how full the model's context is, and a
   "Clear + continue" button that summarizes the chat and starts fresh.
6. Search across all chats (Cmd+K), an @ file picker, keyboard shortcuts (Cmd+N new chat, Cmd+. stop), and a Mac
   notification when a long run finishes in the background.
7. A Code mode: pick a project folder on my computer and a model, and it reads, writes and edits code there. Several
   Code sessions can run side by side; New session works while another one is busy.
8. Optional support for open models through any standard API, with the same tools (including web search). If a model uses tools and then stops without answering, ask it once to finish, and
   show a clear error instead of "(no reply)".

Done when: I can watch a checklist tick off, see a diff, retry and edit, run two Code sessions at once, and the meter
shows my plan usage.
```

---

## Part 5: always on (cloud server + phone)

```
Make the bots work while my computer is closed.

1. A dedicated always-on computer space (a small cloud server of your choice) that runs the same app, the agent
   bots, their browsers, jobs and dreams 24/7. A script with: status, push (send code changes and restart, and NEVER
   overwrite the server's bots, chats or memory), and connect.
2. My desktop app talks to the server through a private, encrypted connection. Nothing is open to the public
   internet.
3. Code mode stays on my computer (it edits my local folders).
4. Phone access through a private network: only my own devices can open it; add it to the home screen like an app.
5. Optional per-bot dedicated browser spaces (its own small server, or one shared server with a separate browser per bot) that
   turn off after idle time to save money, and get deleted with the bot.
6. Sign in to my AI subscription on the server myself (a small helper script), so the server never sees my
   password.

Done when: I close my laptop, a scheduled job still runs on the server, and I can check its result from my phone.
```

---

## Part 6: safety check (paste this last)

```
Audit everything we built, then fix what's missing:
- Keys encrypted at rest, never logged, never sent to the screen, scrubbed from error messages.
- The app only listens on 127.0.0.1; changes require a special header other websites can't send.
- No shell for bots unless I turn it on for one server; file tools can't escape the bot's folder, and bots can't read
  the app's own data folder (keys, database).
- Robot checks are always handed to me, never bypassed. Bots never buy, pay or type passwords.
- Anything a bot does to the outside world (post, send, submit) asks me first unless I turned on autonomy for it.
- Deleting is rare and asks first; "hide" instead of delete where possible.
Then write tests for the risky parts and run them. Give me a short report: what's protected, what isn't, and what
you'd do next.
```
