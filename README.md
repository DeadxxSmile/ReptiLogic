# 🐍 ReptiLogic

A desktop application for reptile breeders and collectors to manage their animals, plan breeding seasons, track health records, and calculate offspring genetics.

Built with **Electron**, **React**, **Vite**, and **SQLite** — all data is stored locally on your machine.

---

## Features

### 🐍 Collection
- Track your full animal collection with photos, morphs, weights, and notes
- Grid and list views with filtering by species, sex, and status
- Full animal history — breeding records, weight log, feeding log, photos

### 🏥 Health
- Per-animal health dashboard with weight trend charts
- Log health issues with category, severity, and treatment
- Track medications (current and past) with dosage and frequency
- Record vet visits with diagnosis, treatment, and follow-up dates
- Feeding reminders for animals overdue by 14+ days
- Weighing reminders for animals not measured in 30+ days

### 🥚 Breeding
- Pairing records with full status pipeline (Planned → Active → Gravid → Laid → Hatched)
- Clutch tracking — egg count, slug count, hatch count, incubation details
- Individual offspring logging with sex, weight, disposition, and sale tracking
- Suggested pairings based on complementary genetics in your collection

### 🧬 Genetics Calculator
- Punnett square engine supporting all inheritance types:
  - Recessive, Co-dominant, Dominant, Line-bred
- Multi-gene calculations — handles any combination of genes simultaneously
- Shows every possible offspring outcome with accurate probabilities
- Health warnings for morphs with known concerns (e.g. Spider wobble)
- Works from your collection or with manually entered genes

### 📖 Morph Library
- 130+ ball python morphs with inheritance type, gene symbol, super form names, and health flags
- 25+ western hognose morphs
- Schema supports easy addition of corn snake, boa, carpet python, and more
- Browsable, searchable reference built into the app

### ⚙️ Settings & Export
- Export collection to CSV (opens in Excel / Google Sheets)
- Export breeding records to CSV
- Full database backup (.db file)
- Configurable feeding and weighing reminder thresholds

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 41 |
| Frontend | React 18 + Vite 7 |
| Routing | React Router 6 |
| Database | SQLite via better-sqlite3 |
| Dates | date-fns 4 |
| IDs | uuid 11 |
| Packaging | electron-builder 26 |

---

## Getting started

### Prerequisites

- **Node.js 22 or 24 LTS**
- **Visual Studio 2022** with the **Desktop development with C++** workload
  (required to compile `better-sqlite3` for Electron)

### Install and run

```bash
git clone https://github.com/your-username/reptilogic.git
cd reptilogic
npm install
npm start
```

`npm install` runs `electron-builder install-app-deps` automatically via the `postinstall` script so `better-sqlite3` is rebuilt against the Electron version used by the app.

---

## Building a Windows installer

```bash
npm run build
```

Output:

```text
dist/ReptiLogic Setup 0.2.0.exe
```

### If `npm run build` gets stuck or fails on `winCodeSign`

This project is configured for **unsigned local Windows builds**. The build now uses a dedicated `electron-builder.json` file with `signAndEditExecutable` disabled so local packaging does not try to edit/sign the executable during the build step.

If you still hit a `Cannot create symbolic link` / `A required privilege is not held by the client` error while `electron-builder` is unpacking `winCodeSign`, the fix is environmental, not a code bug:

1. Turn on **Windows Developer Mode**, or
2. Run your terminal / VS Code **as Administrator**, then retry the build.

The failure in your log happened after the renderer build completed successfully and while `electron-builder` was extracting its `winCodeSign` helper archive with 7-Zip, which failed on symlink creation under a non-elevated Windows session.

---

## Project structure

```text
reptilogic/
├── index.html
├── vite.config.js
├── electron-builder.json
├── src/
│   ├── index.jsx
│   ├── main/
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── database/
│   │   │   ├── db.js
│   │   │   └── migrations/
│   │   ├── genetics/
│   │   │   └── calculator.js
│   │   └── ipc/
│   └── renderer/
│       ├── App.jsx
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── styles/
└── public/
    └── icon.ico
```

---

## Database

The SQLite database is created automatically on first launch and migrations run in order. In development it lives in the project root as `reptilogic.db`. In a packaged build it is stored in the user's roaming app data folder.

---

## License

Distributed under the GNU GPL-3.0 license; please check the `LICENSE` file in the GitHub repository for more information.

## Disclaimer

The following is the disclaimer that applies to all scripts, functions, one-liners, etc. This disclaimer supersedes any disclaimer included in any script, function, one-liner, etc. You running this script/function means you will not blame the author(s) if this breaks your stuff. This script/function is provided **AS IS** without warranty of any kind.

Author(s) disclaim all implied warranties including, without limitation, any implied warranties of merchantability or of fitness for a particular purpose. The entire risk arising out of the use or performance of the sample scripts and documentation remains with you.

In no event shall author(s) be held liable for any damages whatsoever (including, without limitation, damages for loss of business profits, business interruption, loss of business information, or other pecuniary loss) arising out of the use of or inability to use the script or documentation. Neither this script/function, nor any part of it other than those parts that are explicitly copied from others, may be republished without author(s) express written permission.

The author(s) retain the right to alter this disclaimer at any time. For the most up to date version of the disclaimer, see: https://ucunleashed.com/code-disclaimer
