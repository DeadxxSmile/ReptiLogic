# ReptiLogic v1.0.0

Desktop reptile collection and breeding manager built with Electron, React, Vite, and SQLite.

## Current Features
- Local SQLite-backed collection management for reptiles
- Animal records with sex, weight, dates, source, price, morphs, notes, and photos
- Breeding records with pairings, clutch tracking, offspring tracking, and outcomes
- Health tracking for issues, medications, and vet visits
- Genetics calculator for keeper-friendly offspring odds
- Morph library for built-in reference data
- Settings page with:
  - export of collection CSV
  - export of breeding CSV
  - full database backup export
  - collection CSV import for bulk starting data
  - backup restore import
  - exportable CSV template for spreadsheet-based onboarding
- Resources folder for app art, logos, and CSV templates
- App data stored locally on the user's machine

## Resources Folder
This project includes a `resources` folder for app assets and starter files.

Included items:
- `resources/art/ReptiLogic.ico`
- `resources/art/ReptiLogic.png`
- `resources/templates/collection-import-template.csv`

## Running
```bash
npm install
npm start
```

## Building
```bash
npm run build
```

Typical build output:
- `dist/ReptiLogic-Setup-1.0.0.exe`

If Windows packaging fails while extracting `winCodeSign`, that is usually caused by Windows symlink privileges. Turning on Windows Developer Mode or running the terminal as Administrator is commonly required for unsigned local Electron builds on some systems.

## Collection CSV Import Notes
The collection importer is meant to help a keeper bring in an existing spreadsheet without typing every animal by hand.

Supported columns in the included template/export format:
- Name
- Species
- Sex
- DOB
- DOB Estimated
- Weight (g)
- Status
- Acquired Date
- Acquired From
- Purchase Price
- Morphs
- Notes

Morph examples:
- `Clown`
- `Het Pied`
- `50% Poss Het Lavender`
- `Proven Het Albino`
- `Super Pastel`

## License
Distributed under the GNU GPL-3.0 license; please check the `LICENSE` file in the GitHub repository for more information.

## Disclaimer
The following is the disclaimer that applies to all scripts, functions, one-liners, etc. This disclaimer supersedes any disclaimer included in any script, function, one-liner, etc. You running this script/function means you will not blame the author(s) if this breaks your stuff. This script/function is provided **AS IS** without warranty of any kind.

Author(s) disclaim all implied warranties including, without limitation, any implied warranties of merchantability or of fitness for a particular purpose. The entire risk arising out of the use or performance of the sample scripts and documentation remains with you.

In no event shall author(s) be held liable for any damages whatsoever (including, without limitation, damages for loss of business profits, business interruption, loss of business information, or other pecuniary loss) arising out of the use of or inability to use the script or documentation. Neither this script/function, nor any part of it other than those parts that are explicitly copied from others, may be republished without author(s) express written permission.

The author(s) retain the right to alter this disclaimer at any time. For the most up to date version of the disclaimer, see:
https://ucunleashed.com/code-disclaimer
