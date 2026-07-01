# CF GitHub Pusher 🚀

A **Brave/Chrome browser extension** that adds a floating **"Push to GitHub"** button on every Codeforces problem page. After solving a problem, push your solution directly to your private GitHub repo — organized by concept (e.g., `digit-dp`, `diameter`, `bitmask`, etc.).

---

## ✨ Features

- **Floating button** on all CF problem pages (problemset + contest + gym)
- **Auto-fetches** your latest accepted submission via CF API
- **Concept folder picker** — create a new folder or add to an existing one
- **Lists existing folders** from your GitHub repo (live)
- **Multi-language support** — `.cpp`, `.py`, `.java`, `.rs`, `.go`, `.kt`, and more
- **Custom commit messages**
- **Secure** — GitHub PAT stored locally in extension storage (never sent anywhere except GitHub API)
- **Premium dark UI** — GitHub-inspired dark mode modal

---

## 📁 Folder Structure in Your Repo

```
my-cf-solutions/
├── digit-dp/
│   ├── 1553E_Carr_Partition.cpp
│   └── 1372E_Omkar_Beautiful_Permutations.cpp
├── diameter/
│   └── 1156G_Lucky_Path.cpp
├── bitmask-dp/
│   └── 1209G_Across_the_Universe.cpp
└── graphs/
    └── 1076E_Vasyas_Function.cpp
```

---

## 🔧 Installation

### Step 1 — Load the extension in Brave

1. Open Brave → go to `brave://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select this folder: `cf-github-pusher/`

### Step 2 — Configure settings

1. Click the **CF GitHub Pusher** icon in the toolbar
2. Fill in:
   - **GitHub PAT** — Create one at [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=repo) with `repo` scope
   - **GitHub Repo** — e.g. `yourname/cf-solutions` (must exist, can be private)
   - **CF Handle** — your Codeforces username (e.g. `tourist`)
3. Click **Save Settings**

### Step 3 — Use it!

1. Go to any Codeforces problem page and **solve it** (get Accepted)
2. Click the floating green **"Push to GitHub"** button (bottom-right corner)
3. In the modal:
   - Pick **"Create new folder"** → type a concept name (e.g. `digit-dp`)
   - OR pick **"Add to existing"** → choose from dropdown (populated from your repo)
   - OR pick **"No folder"** → pushes to repo root
4. Click **🚀 Push Solution**
5. Done! Check your repo on GitHub.

---

## ⚠️ Notes

- You must be **logged in to Codeforces** in the same browser — source code is fetched from your submission page
- The CF API only returns submissions for the last 30 results — make sure your AC is recent
- If CF handle fetch fails, make sure your CF profile is public
- Icons directory (`icons/`) is referenced in `manifest.json` but not included — the extension works without them, or add your own 16×16, 48×48, 128×128 PNG files

---

## 📜 File Overview

| File | Purpose |
|------|---------|
| `manifest.json` | MV3 extension manifest |
| `background.js` | Service worker: CF API, GitHub API, submission code extraction |
| `content.js` | Injected into CF problem pages: floating button + modal UI |
| `content.css` | Styles for the button and modal |
| `popup.html` | Extension settings popup |
| `popup.js` | Settings save/load logic |
| `popup.css` | Popup styling |
