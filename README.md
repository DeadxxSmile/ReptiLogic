# 🐍 ReptiLogic

> A desktop application for reptile breeders and collectors to manage their animals, track breeding seasons, calculate offspring genetics, and monitor animal health — all stored locally on your machine.

[![Release](https://img.shields.io/github/v/release/DeadxxSmile/reptilogic)](https://github.com/DeadxxSmile/reptilogic/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)](https://github.com/DeadxxSmile/reptilogic/releases/latest)

---

## 📦 Installation

Download the latest installer from the [Releases page](https://github.com/DeadxxSmile/reptilogic/releases/latest).

1. Download `ReptiLogic-Setup-1.1.1.exe`
2. Run the installer — choose your install location and create shortcuts
3. Launch ReptiLogic — the first-run wizard will guide you through setup

No additional software required.

---

## ✨ Features

### 🐍 Collection
- Track animals with photos, morphs, weight, DOB, acquisition info, and notes
- **Auto-generated Animal IDs** (e.g. `BPF042-AhA`) or enter your own to match an existing system
- Grid and list view with filtering by species, sex, status, and search
- Full animal history — breeding records, weight log, feeding log, photo gallery
- Link parents at time of adding — lineage builds automatically over time
- Clickable **family tree** on the Lineage tab, going back as many generations as recorded
- Bulk import from CSV (Settings → Import)

### 🏥 Health
- Per-animal health dashboard with weight trend chart
- Log health issues with category and severity, track medications, record vet visits
- Dashboard reminders for animals overdue on feeding or weighing

### 🥚 Breeding
- Full pairing lifecycle: Planned → Active → Gravid → Laid → Hatched
- Terminology adapts for live-birth species (Born instead of Hatched, etc.)
- Log clutches with egg count, incubation details, and individual offspring records
- **Add Babies Wizard** — step through each hatchling, assign name/sex/weight/morphs/ID, add them all to your collection at once with parents auto-linked
- **Suggested Pairings** — scans your active collection and recommends pairings based on genetics

### 🧬 Genetics Calculator
- Full Punnett square engine: recessive, co-dominant, dominant, line-bred, and sex-linked
- **Allele complex support** — BEL complex (Lesser, Butter, Mojave, Phantom, Mystic, Russo, Special, Mocha), Yellow Belly complex, 8-Ball complex, Bearded Dragon Scale complex, and more. Two alleles from the same complex automatically produce the correct result (e.g. Lesser × Mojave = BEL)
- **Sex-linked Banana/Coral Glow** — Male Maker and Female Maker inheritance modelled correctly (~93% sex ratio skew). Maker type stored per animal and used automatically in From Collection mode
- Outcome cards showing morph name, probability, expected clutch count range, and sex ratio notes
- Clutch size projection based on species typical range
- Health warnings for all morphs with known concerns
- Use animals from your collection or enter genes manually

### 📖 Morph Library
- **Ball Python** — 130+ morphs with full allele groups, health concerns, sex-linked Banana/Coral Glow
- **Western Hognose** — 25+ morphs with corrected inheritance types (Anaconda = incomplete dominant, Toffee Belly = incomplete dominant, Lavender = recessive, Pastel RBE = dominant)
- **Leopard Gecko** — 18 morphs including all three non-allelic albino strains (Tremper, Bell, Rainwater), Mack Snow, Giant, Enigma and Lemon Frost with ethical health warnings
- **Bearded Dragon** — 14 morphs including Leatherback/Silkback (health flagged), Dunner, Zero, Witblits, American Smoothie
- Add custom morphs for any species — included in the calculator automatically

### 🖨️ Husbandry Print Reports
- Professional print-ready document from any animal's detail page
- Animal photo, morphs, 2-generation lineage pedigree, weight log, feeding history
- Breeder header with name, logo, website, and social links (Instagram, X, YouTube, TikTok, Facebook)

### 💾 Backup & Data
- Automatic compressed ZIP backups on app open or close, configurable retention and folder
- One-click restore from any saved backup
- Export collection, breeding records, and morphs to CSV
- CSV import with auto format detection

### ⚙️ Settings
- Breeder profile with logo and social links (used in print reports)
- Auto-generate or manual Animal IDs
- Light and dark mode
- Configurable feeding and weighing reminder thresholds
- Move database to any folder (OneDrive, Dropbox, etc.)

### 🧭 First-Run Wizard
5-step setup covering database location and automatic backup configuration. All settings adjustable later.

---

## 🛠️ Building from Source

### Prerequisites
- **Node.js 22 or 24 LTS** — https://nodejs.org
- **Visual Studio 2022** with the **"Desktop development with C++"** workload

### Setup

```bash
git clone https://github.com/DeadxxSmile/reptilogic.git
cd reptilogic
npm install
npm start
```

### Build the installer

```bash
npm run build
```

Output: `dist/ReptiLogic-Setup-1.1.1.exe`

### Scripts

| Command | Description |
|---|---|
| `npm start` | Run in development mode |
| `npm run build` | Build distributable installer |
| `npm run rebuild` | Recompile native modules |
| `npm run clean` | Wipe build artifacts and node_modules |

---

## 📁 Project Structure

```
reptilogic/
├── dev/                         ← Dev tools and scripts (not shipped)
├── pages/                       ← GitHub Pages / reptilogic.com website
├── resources/
│   ├── art/                     ← App icons
│   ├── screenshots/             ← Screenshots for README and website
│   └── templates/               ← CSV import template
├── src/
│   ├── index.jsx                ← React entry + router
│   ├── main/                    ← Electron main process
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── database/
│   │   │   ├── db.js            ← SQLite init + auto-migration runner
│   │   │   └── migrations/      ← SQL files applied in order on launch
│   │   ├── genetics/
│   │   │   └── calculator.js    ← Punnett square + allele complex engine
│   │   └── ipc/                 ← IPC handlers by domain
│   └── renderer/                ← React frontend
│       ├── App.jsx
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── styles/
└── public/
```

---

## 🗺️ Roadmap

- [ ] reptilogic.com landing page
- [ ] Mobile companion / local network web access
- [ ] Breeding season calendar view
- [ ] Additional species morph databases (corn snake, boa)
- [ ] Sale and customer tracking
- [ ] Weight chart image export

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

Provided **AS IS** without warranty of any kind.

---

> ⚠️ **v1.1.0 users:** A database migration bug in v1.1.0 could cause startup failures on some systems. Please upgrade to v1.1.1. See the [release notes](dev/RELEASE_NOTES.md) for details.
