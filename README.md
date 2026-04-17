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

- **Node.js 22 or 24 LTS** — https://nodejs.org
- **Visual Studio 2022** with the **"Desktop development with C++"** workload
  (required to compile `better-sqlite3` for Electron)

### Install and run

```bash
git clone https://github.com/your-username/reptilogic.git
cd reptilogic
npm install
npm start
```

`npm install` runs `electron-builder install-app-deps` automatically via the `postinstall` script, which compiles `better-sqlite3` for your Electron version.

If you see a **"Could not find Visual Studio"** error, the `.npmrc` in this repo sets `msvs_version=2022` which should resolve it. If the issue persists, make sure the C++ workload is installed in Visual Studio 2022 via the Visual Studio Installer.

### Build a distributable installer

```bash
npm run build
```

Output: `dist/ReptiLogic Setup 0.2.0.exe`

---

## Project structure

```
reptilogic/
├── index.html                        ← Vite entry HTML
├── vite.config.js                    ← Vite + Electron config
├── src/
│   ├── index.jsx                     ← React app entry point
│   ├── main/                         ← Electron main process (Node.js)
│   │   ├── main.js                   ← Window creation, IPC registration
│   │   ├── preload.js                ← Secure renderer ↔ main bridge
│   │   ├── database/
│   │   │   ├── db.js                 ← SQLite connection + auto-migration
│   │   │   └── migrations/           ← SQL migration files (run in order)
│   │   ├── genetics/
│   │   │   └── calculator.js         ← Punnett square engine
│   │   └── ipc/                      ← IPC handlers (one file per domain)
│   │       ├── animalHandlers.js
│   │       ├── breedingHandlers.js
│   │       ├── healthHandlers.js
│   │       ├── morphHandlers.js
│   │       ├── utilHandlers.js
│   │       └── exportHandlers.js
│   └── renderer/                     ← React frontend
│       ├── App.jsx                   ← Shell + sidebar navigation
│       ├── pages/                    ← One file per page
│       ├── components/               ← Shared UI components
│       ├── hooks/                    ← Data fetching hooks
│       ├── utils/                    ← Formatting helpers
│       └── styles/                   ← Global CSS + design tokens
└── public/
    └── icon.ico
```

---

## Database

The SQLite database is created automatically on first launch and migrations run in order. In development it lives in the project root as `reptilogic.db`. In a packaged build it's stored at:

```
Windows: C:\Users\<Name>\AppData\Roaming\ReptiLogic\reptilogic.db
```

### Adding species or morphs

Create a new migration file in `src/main/database/migrations/` following the existing naming pattern (e.g. `007_corn_snake_morphs.sql`). It will run automatically on next launch.

---

## Species supported

| Species | Status |
|---|---|
| Ball Python | ✅ Full morph database (130+ morphs) |
| Western Hognose | ✅ Full morph database (25+ morphs) |
| Corn Snake | 🔧 Species entry included, morphs can be added |
| Boa Constrictor | 🔧 Species entry included |
| Carpet Python | 🔧 Species entry included |
| Kenyan Sand Boa | 🔧 Species entry included |
| Blood Python | 🔧 Species entry included |
| + more | 🔧 Schema is fully extensible |

---

## Roadmap

- [ ] Mobile companion app (React Native) with sync via PocketBase
- [ ] Weight chart export to image/PDF
- [ ] Breeding season planner with calendar view
- [ ] Offspring kept → auto-add to collection
- [ ] Multi-user / shared collection support

---

## License

MIT
