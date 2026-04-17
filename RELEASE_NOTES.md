# 🐍 ReptiLogic v1.1.0

First public release of ReptiLogic — a desktop app for reptile breeders and collectors. Everything runs locally on your machine: no accounts, no cloud, no subscriptions.

---

## ✨ What's in this release

### 🐍 Collection management
- Track your full animal collection with photos, morphs, weights, dates, and notes
- Grid and list views with filtering by species, sex, status, and search
- Full animal history — breeding records, weight log, feeding log, photo gallery

### 🏷️ Animal IDs
- Auto-generated IDs from species code, sex, counter, and morph abbreviation (e.g. `BPF042-AhA`)
- Or enter your own ID to match an existing tagging system
- IDs shown on cards, detail pages, lineage, and print reports

### 🌳 Lineage tracking
- Link any animal to its sire and dam when adding or editing
- Dedicated **Lineage** tab on every animal — clickable family tree across all recorded generations
- 2-generation pedigree in husbandry print reports

### 🍼 Add Babies Wizard
- When a clutch hatches, step through each baby one at a time
- Set name, sex, hatch weight, morphs, and ID per animal
- All babies added to your collection at once with parents auto-linked

### 🥚 Breeding records
- Full pairing lifecycle: Planned → Active → Gravid → Laid → Hatched
- Live-birth species supported — terminology adapts automatically (Young/Stillborn/Born)
- Clutch and litter logging with incubation details and individual offspring tracking

### 🧬 Genetics Calculator
Full Punnett square engine with:
- **Recessive, co-dominant, dominant, and line-bred** genes
- **Allele complex support** — any two alleles from the same chromosomal locus produce the correct result automatically. BEL complex (Lesser, Butter, Mojave, Phantom, Mystic, Russo, Special, Mocha), Yellow Belly complex (YB/Gravel/Asphalt → Ivory), 8-Ball complex (Cinnamon/Black Pastel), and Bearded Dragon Scale complex (Leatherback × American Smoothie → Microscale)
- **Sex-linked Banana/Coral Glow** — Male Maker (~93% male Banana offspring) and Female Maker (~93% female Banana offspring) modelled correctly. Maker type recorded per animal and used automatically in "from collection" mode
- Outcome cards with morph name, probability percentage, expected clutch count range, and sex ratio notes
- Clutch size projection based on species typical range
- Health warnings for all morphs with known concerns

### 📚 Species with full morph databases
- **Ball Python** — 130+ morphs, full allele groups, sex-linked Banana/Coral Glow, health concerns
- **Western Hognose** — 25+ morphs with corrected inheritance types (Conda/Anaconda = incomplete dominant, Toffee Belly = incomplete dominant, Lavender = recessive, Pastel RBE = dominant)
- **Leopard Gecko** — 18 morphs including all 3 non-allelic albino strains (Tremper, Bell, Rainwater), Mack Snow, Giant, Enigma and Lemon Frost with ethical health warnings
- **Bearded Dragon** — 14 morphs including Leatherback (co-dom, Silkback super — health flagged), Dunner (dominant, no super), Zero, Witblits, Hypo, Trans, American Smoothie

### 🖨️ Husbandry print reports
- Professional PDF-ready document from any animal's detail page
- Animal photo, morphs, lineage pedigree, weight log, feeding history
- Breeder header with name, logo, website, and social links (Instagram, X, YouTube, TikTok, Facebook)

### 📖 Animal Library
- Species reference with clutch/litter ranges, incubation days, live-birth flag
- Add custom species with full detail

### 💾 Automatic backups
- Compressed zip snapshots on app open or close
- Configurable backup folder, timing, and retention count
- One-click restore from any saved backup

### ⚙️ Settings
- Breeder profile — name, logo, website, socials (used in print reports)
- Export: Collection CSV, Breeding CSV, Morphs CSV, Import Template
- Import: auto-detects file type
- Light and dark mode, configurable reminder thresholds, animal ID mode

### 🧭 First-run wizard
5-step setup including database location and backup configuration.

---

## 🖥️ System requirements
- Windows 10 or later (x64)
- ~250 MB disk space

## 📦 Installation
1. Download `ReptiLogic-Setup-1.1.0.exe` from the assets below
2. Run the installer
3. Launch ReptiLogic — the setup wizard opens automatically

---

## 📝 Notes for breeders

The genetics calculator is designed around how breeders actually work with these animals. A few things worth knowing:

**BEL complex** — to produce a BEL from the calculator, add Lesser to one parent and Mojave (or any other BEL allele) to the other parent as separate gene entries. The calculator recognises they share a locus and correctly outputs 25% Normal / 25% Lesser / 25% Mojave / 25% BEL.

**Banana/Coral Glow maker type** — when adding a male Banana or Coral Glow to your collection, you'll see a maker type selector. Set this to Male Maker or Female Maker if you know it — the "from collection" calculator mode will use it automatically to show the correct sex ratios on outcome cards.

**Hognose Conda vs Anaconda** — these are the same gene. The app uses Anaconda as the primary entry (incomplete dominant, super = Superconda). The old Conda entry has been corrected.

**Leopard gecko albinos** — the three albino strains (Tremper, Bell, Rainwater) are **not allelic**. Crossing strains produces normal-looking animals carrying both recessives. This is noted clearly in each morph's description.
