# Simple DICOM Viewer — Pre-Hackathon Learning

A working React + Cornerstone3D DICOM viewer with **three small TODOs** for you to complete.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — the viewer will **auto-load sample DICOM images** from `data/sample_dicom/` on startup (once TODO 1 is fixed, you can scroll through them with the mouse wheel).

You can also click **Load DICOM** to load your own `.dcm` files.

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

- React 19 + TypeScript 5.8
- Vite 7
- Cornerstone3D v4 (`@cornerstonejs/core`, `@cornerstonejs/tools`, `@cornerstonejs/dicom-image-loader`)

## Getting Sample DICOM Files

Sample data is already included in `data/sample_dicom/` — 133 slices from LIDC-IDRI-0001, the same dataset used on hackathon day. No download needed.

If you want to experiment with other cases: [LIDC-IDRI on TCIA](https://www.cancerimagingarchive.net/collection/lidc-idri/)
