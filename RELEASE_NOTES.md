# 🐍 ReptiLogic v1.0.0 — Initial Release

First public release of ReptiLogic — a desktop application for reptile breeders and collectors to manage their animals, track breeding records, calculate offspring genetics, and monitor animal health. All data is stored locally on your machine.

---

## ✨ What's included

### 🐍 Collection management
- Track your full animal collection with photos, morphs, weights, dates, and notes
- Grid and list views with filtering by species, sex, and status
- Full animal history — breeding records, weight log, feeding log, and photo gallery
- Add animals with health information at intake (conditions, medications, initial weight)

### 🏥 Health tracking
- Per-animal health dashboard with weight trend charts
- Log health issues with category (respiratory, parasite, injury, etc.) and severity
- Track current and past medications with dosage, frequency, and route
- Record vet visits with diagnosis, treatment, cost, and follow-up dates
- Dashboard reminders for animals overdue for feeding (14 days) or weighing (30 days)

### 🥚 Breeding records
- Full pairing lifecycle: Planned → Active → Gravid → Laid → Hatched
- Track lock date, ovulation, and pre-lay shed
- Clutch logging — egg count, slug count, hatch count, incubation temp and humidity
- Individual offspring tracker with sex, hatch weight, disposition, and sale info
- Suggested pairings based on complementary genetics in your active collection

### 🧬 Genetics calculator
- Full Punnett square engine — recessive, co-dominant, dominant, and line-bred genes
- Multi-gene calculations across any combination simultaneously
- Every possible offspring outcome shown with accurate probabilities
- Automatic health warnings for morphs with known concerns (e.g. Spider wobble)
- Manual gene entry or pull directly from animals in your collection

### 📖 Morph library
- 130+ ball python morphs — recessive, co-dominant, dominant, and line-bred
- 25+ western hognose morphs
- Each morph includes inheritance type, gene symbol, super form name, health flags, and description
- Fully searchable and browsable reference

### ⚙️ Settings & export
- Export collection to CSV
- Export breeding records to CSV
- Full database backup (.db file)
- Configurable reminder thresholds

---

## 🖥️ System requirements

- **Windows 10 or later** (x64)
- ~200 MB disk space

---

## 📦 Installation

1. Download `ReptiLogic-Setup-1.0.0.exe` below
2. Run the installer — no additional software required
3. The database is created automatically on first launch

> **Building from source?** See [SETUP.md](SETUP.md) — you'll need Node.js 22+, Visual Studio 2022 with the "Desktop development with C++" workload, and `npm install && npm start`.

---

## 🗒️ Known limitations in this release

- Windows only (Mac and Linux builds planned)
- No cloud sync — data is stored locally only
- Mobile companion app not yet available
- Offspring kept from a clutch must be manually added to the collection

---

## 🔭 What's coming

- Mobile companion app (iOS/Android) with sync
- Offspring → auto-add to collection
- Breeding season calendar view
- Weight chart image export
- Additional species morph databases (corn snake, boa, carpet python)
