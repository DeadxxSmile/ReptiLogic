# 🐍 ReptiLogic

> A desktop application for reptile breeders and collectors to manage their animals, track breeding seasons, calculate offspring genetics, and monitor animal health — all stored locally on your machine.

[![Release](https://img.shields.io/github/v/release/DeadxxSmile/ReptiLogic)](https://github.com/DeadxxSmile/ReptiLogic/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)](https://github.com/DeadxxSmile/ReptiLogic/releases/latest)

---

## 📦 Installation

Download the latest installer from the [Releases page](https://github.com/DeadxxSmile/ReptiLogic/releases/latest).

1. Download `ReptiLogic-Setup-1.0.0.exe`
2. Run the installer — choose your install location and create shortcuts
3. Launch ReptiLogic — your database is created automatically on first run

No additional software required for the installed version.

---

## ✨ Features

### 🐍 Collection
- Track every animal with photos, morphs/genes, weight, DOB, acquisition info, and notes
- Grid and list views with filtering by species, sex, and status
- Full per-animal history — breeding records, weight log, feeding log, photo gallery
- Capture health information at intake when adding a new animal

### 🏥 Health
- Per-animal health dashboard with weight trend charts
- Log health issues with category (respiratory, parasite, injury, etc.) and severity level
- Track current and past medications — dosage, frequency, and route
- Record vet visits with diagnosis, treatment, cost, and follow-up dates
- Dashboard care reminders for animals overdue on feeding or weighing (thresholds configurable)

### 🥚 Breeding
- Full pairing lifecycle: Planned → Active → Gravid → Laid → Hatching → Hatched
- Track lock dates, ovulation, pre-lay shed, and pairing counts
- Clutch logging — egg count, slug count, hatch count, incubation temp and humidity
- Individual offspring tracker with sex, hatch weight, disposition, and sale info
- Suggested pairings engine based on complementary genetics across your active collection

### 🧬 Genetics Calculator
- Full Punnett square engine — recessive, co-dominant, dominant, and line-bred genes
- Multi-gene calculations with accurate probabilities for every possible outcome
- Automatic health warnings for morphs with known concerns (e.g. Spider wobble)
- Use animals directly from your collection or enter genes manually

### 📖 Morph Library
- 130+ ball python morphs and 25+ western hognose morphs built in
- Add your own custom morphs for any species
- Searchable and filterable reference used automatically by the genetics calculator

### ⚙️ Settings, Export & Import
- Export collection, breeding records, and health records to CSV
- Full database backup (.db file) and restore
- Import collection from CSV using the included template
- Configurable feeding and weighing reminder thresholds

---

## 📦 Getting the installer

Head to the [**Releases page**](https://github.com/DeadxxSmile/ReptiLogic/releases/latest) and download the `.exe` from the latest release. Run it and follow the installer wizard — it will ask where to install and optionally create desktop and Start Menu shortcuts.

---

## 🛠️ Building from Source

### Prerequisites

- **Node.js 22 or 24 LTS** — https://nodejs.org
- **Visual Studio 2022** with the **"Desktop development with C++"** workload

### Setup

```bash
git clone https://github.com/DeadxxSmile/ReptiLogic.git
cd reptilogic
npm install
npm start
```

`npm install` automatically compiles `better-sqlite3` for your Electron version via the `postinstall` script.

> **VS2022 detection issues?** The `.npmrc` sets `msvs_version=2022`. If you still get a gyp error, open **Visual Studio Installer → Modify** and confirm the **"Desktop development with C++"** workload is installed.

### Build the installer

```bash
npm run build
```

Output: `dist/ReptiLogic-Setup-1.0.0.exe`

> **Unsigned local builds on Windows:** If the build fails extracting `winCodeSign`, enable **Windows Developer Mode** (`Settings → Privacy & Security → Developer Mode`) or run your terminal as Administrator.

### Scripts

| Command | Description |
|---|---|
| `npm start` | Run in development mode |
| `npm run build` | Build distributable installer |
| `npm run rebuild` | Manually recompile native modules |
| `npm run clean` | Wipe `node_modules`, `dist`, `build`, `.vite`, `package-lock.json` |

---

## 📁 Project Structure

```
reptilogic/
├── resources/
│   ├── art/                     ← App icons (.ico and .png)
│   └── templates/               ← collection-import-template.csv
├── src/
│   ├── index.jsx                ← React entry point
│   ├── main/                    ← Electron main process
│   │   ├── main.js              ← Window creation, IPC registration
│   │   ├── preload.js           ← Renderer ↔ main bridge
│   │   ├── database/
│   │   │   ├── db.js            ← SQLite init + auto-migration runner
│   │   │   └── migrations/      ← SQL files, applied in order on launch
│   │   ├── genetics/
│   │   │   └── calculator.js    ← Punnett square engine
│   │   └── ipc/                 ← IPC handlers, one file per domain
│   └── renderer/                ← React frontend
│       ├── App.jsx              ← Shell + sidebar + custom title bar
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── styles/
└── public/                      ← Static assets
```

---

## 📋 Collection CSV Import

The importer helps migrate an existing spreadsheet without re-entering every animal. Download the template via **Settings → Export → CSV Template**, fill it in, then import via **Settings → Import → Collection CSV**.

**Supported columns:** Name, Species, Sex, DOB, DOB Estimated, Weight (g), Status, Acquired Date, Acquired From, Purchase Price, Morphs, Notes

**Morph format examples:**
```
Clown
Het Pied
50% Poss Het Lavender
Proven Het Albino
Super Pastel
Pastel, Het Pied
```

---

## 🗺️ Roadmap

- [ ] Mobile companion app (iOS/Android) with local network sync
- [ ] Offspring kept → auto-add to collection
- [ ] Breeding season calendar view
- [ ] Weight chart image export
- [ ] Additional species morph databases (corn snake, boa, carpet python)
- [ ] Multi-collection / shared collection support

---

## 🖥️ Tech Stack

| | |
|---|---|
| Desktop shell | Electron 41 |
| Frontend | React 18 + Vite 7 |
| Routing | React Router 6 |
| Database | SQLite via better-sqlite3 |
| Packaging | electron-builder 26 |

---

## 📄 License

GNU GPL-3.0 — see [`LICENSE`](LICENSE) for details.

## ⚠️ Disclaimer

This software is provided **AS IS** without warranty of any kind. The author(s) shall not be held liable for any damages arising from its use.
