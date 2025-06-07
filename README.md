# Whop Handle Scanner
Created by **[@rbKeeper](https://x.com/rbkeeper)**

A resilient Node.js + Puppeteer utility that checks if a given list of slugs is free to register on **[Whop](https://whop.com)**. The script respects a one‑request‑per‑second policy, persists progress after every check, and automatically resumes if interrupted.

---

## ✨ Features

* **Headless or visible Chrome** – switch `headless` in `check.mjs`.
* **JavaScript‑rendered detection** – waits for the banner `<h1>Nothing to see here yet` rendered by Whop’s client JS.
* **Fault‑tolerant** – retries each slug, writes `progress.json` and `available.json` after every handle.
* **Polite throttling** – default 1 req / s (`DELAY_MS`).
* **Debug mode** – `--debug` flag prints the exact `<h1>` text read.

---

## 🖥️ Prerequisites

* **Node.js ≥ 18** (ESM support)
* **npm** (comes with Node)
* macOS / Linux / Windows (no special OS dependencies)

---

## 🚀 Quick start

```bash
# 1  Clone the repo
 git clone https://github.com/yourname/whop-handle-scanner.git
 cd whop-handle-scanner

# 2  Install dependencies (Chromium ≈ 120 MB on first run)
 npm install

# 3  Add the slugs you want to test, one per line
 $EDITOR handles.txt

# 4  Run the scanner (opens Chrome so you can watch)
 node check.mjs
#   └─ use `node check.mjs --debug` for verbose output
```

### What you’ll see

```
business                  : ❌  taken
my‑cool‑idea              : ✅  AVAILABLE
...                       : ...

✨  Saved 17 handle(s) to available.json
```

---

## 📂 Files & directories

| Path             | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `check.mjs`      | Main scanner script                       |
| `handles.txt`    | Input list of slugs (one per line)        |
| `progress.json`  | Checkpoint `{ checked:[], available:[] }` |
| `available.json` | Final list of free slugs                  |

> **Tip:** Delete `progress.json` if you ever want to restart from scratch.

---

## ⚙️ Configuration

Open **`check.mjs`** and tweak the constants at the top:

| Constant      | Default  | Meaning                              |
| ------------- | -------- | ------------------------------------ |
| `DELAY_MS`    | `1000`   | Wait time (ms) between slug requests |
| `MAX_RETRIES` | `2`      | Attempts per slug before giving up   |
| `PROTOCOL_MS` | `120000` | Chrome DevTools protocol timeout     |

---

## 💡 Generating slug ideas with ChatGPT

ChatGPT is great for brainstorming short, catchy handles you can pipe straight into `handles.txt`.

### Step‑by‑step

1. **Ask ChatGPT for ideas** using the prompt below.
2. **Copy the returned code‑block** and paste it into `handles.txt`.
3. **Run the scanner** to see which ones are truly free.

### Suggested prompt

```
Generate 150 creative, short, lowercase store slugs that would work on Whop.
➤ Use only letters (a‑z), no spaces, numbers, or hyphens.
➤ Reply *exactly* as a fenced code block with one slug per line, ready to paste.
```

> ChatGPT will respond with:
>
> ```
> gigahustle
> neonforge
> alphapods
> ...
> ```

Paste that block into `handles.txt`, save, and re‑run `node check.mjs`.

---

## 🛠 Troubleshooting

| Symptom                                     | Fix                                                          |
| ------------------------------------------- | ------------------------------------------------------------ |
| **ProtocolError: Network.enable timed out** | Your machine/network is slow. Increase `PROTOCOL_MS`.        |
| The browser closes halfway                  | Script auto‑saves; just rerun – it resumes where it left.    |
| I need faster scanning                      | Lower `DELAY_MS` *carefully* or parallelise on multiple IPs. |

---

## 📄 License

MIT © 2025 **[rBKeeper](https://x.com/rbkeeper)**
