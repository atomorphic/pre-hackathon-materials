# Simple DICOM Viewer

A minimal, self-contained DICOM viewer for learning Cornerstone3D.

## How to Run

```bash
# Option 1: Open directly in browser
open index.html        # Mac
xdg-open index.html    # Linux
start index.html       # Windows

# Option 2: Serve locally (if Option 1 has CORS issues)
python -m http.server 8080
# Then open http://localhost:8080
```

## Features

- Load DICOM files via button
- Scroll through slices (mouse wheel)
- Window/Level adjustment
- Pan and Zoom
- Length and Rectangle annotation tools

## Getting DICOM Files

If you don't have any:
- [LIDC-IDRI Dataset](https://wiki.cancerimagingarchive.net/display/Public/LIDC-IDRI)
- [OsiriX Sample Data](https://www.osirix-viewer.com/resources/dicom-image-library/)

## Study the Code

The `index.html` file is **heavily commented**. Read through it to understand:

1. **Initialization** - Setting up Cornerstone3D
2. **Viewport Creation** - Creating display area
3. **Tool Setup** - Adding and configuring tools
4. **File Loading** - Converting files to imageIds
5. **Tool Switching** - Changing active tool

## This is NOT the Hackathon

This is for **learning only**. The hackathon provides a different, complete starter workspace.
