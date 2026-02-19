# Simple DICOM Viewer — Pre-Hackathon Learning

A working React + Cornerstone3D DICOM viewer with **three small TODOs** for you to complete.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173, click **Load DICOM**, and select some `.dcm` files.

## Your Tasks

| # | File | What to do |
|---|------|------------|
| TODO 1 | `src/cornerstone.ts` | Activate `StackScrollTool` with the Wheel binding so the scroll wheel changes slices |
| TODO 2 | `src/App.tsx` | Add an Ellipse tool button to the toolbar |
| TODO 3 | `src/App.tsx` | Listen for `VOI_MODIFIED` and display live Window/Level values in the info panel |

Each TODO has a comment in the code explaining exactly what to do.

## What's Already Working

- Load DICOM files via file picker
- W/L, Pan, Zoom tools
- Length and Rectangle annotation tools
- Slice counter
- Reset view

## Stack

- React 18 + TypeScript
- Vite 5
- Cornerstone3D v4 (`@cornerstonejs/core`, `@cornerstonejs/tools`, `@cornerstonejs/dicom-image-loader`)

## Getting Sample DICOM Files

- [LIDC-IDRI on TCIA](https://www.cancerimagingarchive.net/collection/lidc-idri/) — the dataset used on hackathon day
- [OsiriX sample data](https://www.osirix-viewer.com/resources/dicom-image-library/) — quick alternative
