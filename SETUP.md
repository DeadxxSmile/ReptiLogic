# ReptiLogic setup

## Requirements
- Node.js 22 or newer
- Visual Studio 2022 C++ build tools if `better-sqlite3` needs to rebuild

## Install
1. Extract the project to a normal local folder.
2. Open a terminal in the project root.
3. Run `npm install`.
4. Run `npm start`.

The Electron window waits for the Vite dev server before launching.

## Helpful commands
- `npm run clean` removes local build artifacts and `node_modules`
- `npm run rebuild` rebuilds `better-sqlite3` against your Electron version
- `npm run build` creates the renderer bundle and then builds the installer
- `set OPEN_DEVTOOLS=true && npm start` opens DevTools automatically in development
- `set DEBUG_SQL=true && npm start` turns on verbose SQL logging in development

## Notes
- The local development database is created in the project root as `reptilogic.db`.
- Production builds store the database in Electron's `userData` folder.
- The renderer now uses Vite instead of Create React App, so `react-scripts` is no longer part of the toolchain.
