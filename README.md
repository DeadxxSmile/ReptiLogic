# 🐍 ReptiLogic

> A desktop application for reptile breeders and collectors to manage their animals, track breeding seasons, calculate offspring genetics, and monitor animal health — all stored locally on your machine.

[![Release](https://img.shields.io/github/v/release/DeadxxSmile/reptilogic)](https://github.com/DeadxxSmile/reptilogic/releases/latest) 
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)](https://github.com/DeadxxSmile/reptilogic/releases/latest)

---

## 📦 Installation

Download the latest installer from the [Releases page](https://github.com/DeadxxSmile/reptilogic/releases/latest).

1. Download `ReptiLogic-Setup-1.1.0.exe`
2. Run the installer — choose your install location and create shortcuts
3. Launch ReptiLogic — the first-run wizard will guide you through setup

No additional software required.

---

## ✨ Features

### 🐍 Collection
- Track every animal with photos, morphs/genes, weight, DOB, acquisition info, and notes
- **Auto-generated Animal IDs** — species + sex + counter + morph abbreviation (e.g. `BPF042-AhA`), or enter your own
- Grid and list views with filtering by species, sex, status, and search
- Full per-animal history — breeding records, weight log, feeding log, photo gallery

### 🌳 Lineage Tracking
- Link every animal to its sire and dam when adding or editing
- **Lineage tab** on each animal — clickable family tree going back as many generations as recorded
- 2-generation pedigree block in husbandry print reports

### 🏥 Health
- Per-animal health dashboard with weight trend charts
- Log health issues with category and severity, track medications, record vet visits
- Dashboard reminders for animals overdue on feeding or weighing

### 🥚 Breeding
- Full pairing lifecycle: Planned → Active → Gravid → Laid → Hatched
- Track lock dates, ovulation, pre-lay shed, pairing counts
- **Live-birth species support** — terminology switches automatically (Young/Stillborn/Born vs Eggs/Slugs/Hatched)
- **Add Babies Wizard** — step through each hatchling, set sex/weight/morphs/ID, add them all to your collection at once with parents auto-linked

### 🧬 Genetics Calculator
- Full Punnett square engine — recessive, co-dominant, dominant, line-bred, and **sex-linked** genes
- **Allele complex support** — BEL complex (Lesser, Butter, Mojave, Phantom, Mystic, Russo, Special, Mocha), Yellow Belly complex, 8-Ball complex, Bearded Dragon Scale complex, and more. Any two alleles from the same group produce the correct cross-allele result (e.g. Lesser × Mojave = BEL)
- **Sex-linked Banana/Coral Glow** — Male Maker and Female Maker inheritance modelled correctly (~93% sex ratio skew in Banana offspring)
- Outcome cards showing morph name, probability, expected clutch count per outcome, and sex ratio notes where applicable
- Clutch size projection based on species typical range
- Health warnings for all morphs with known concerns
- Use animals from your collection or enter genes manually

### 📚 Animal & Morph Library
- **4 species with full morph databases:** Ball Python (130+ morphs), Western Hognose (25+ morphs), Leopard Gecko (18 morphs), Bearded Dragon (14 morphs)
- All morphs include correct inheritance type, health concerns, super form names, and allele group assignments
- Add custom species and custom morphs for any species

### 🖨️ Husbandry Print Reports
- Professional PDF-ready document per animal — photo, morphs, lineage, weight log, feeding history
- Breeder profile header with name, logo, website, and social links

### 💾 Backup & Data
- Automatic compressed zip backups on open or close, with configurable retention
- One-click restore from any saved backup
- CSV export for collection, breeding records, and morphs
- CSV import with auto format detection

---

## 🚀 First Run

The setup wizard walks you through database location, automatic backups, and app preferences. All settings are adjustable later.

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

Output: `dist/ReptiLogic-Setup-1.1.0.exe`

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
├── resources/
│   ├── art/                     ← App icons
│   └── templates/               ← CSV import template
├── src/
│   ├── index.jsx                ← React entry + router
│   ├── main/                    ← Electron main process
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── database/
│   │   │   ├── db.js            ← SQLite init + auto-migration
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
