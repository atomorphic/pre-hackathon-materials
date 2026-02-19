# Pre-Hackathon Learning Materials

> **Atomorphic Mini Hackathon - NUS Q1 2026**  
> Read and explore these materials **before** the hackathon day

---

## What's In This Folder

This folder contains **learning materials only** - no hackathon code to submit.

| Item | Type | Time | Description |
|------|------|------|-------------|
| `docs/BACKGROUND.md` | Reading | 30-45 min | Medical imaging fundamentals |
| `docs/CORNERSTONE_GUIDE.md` | Reading | 45-60 min | Cornerstone3D concepts & APIs |
| `docs/LIDC_DATA_GUIDE.md` | Reading | 20-30 min | LIDC dataset and XML format |
| `docs/AI_INTEGRATION.md` | Reading | 20-30 min | MONAI/TotalSegmentator concepts |
| `simple-viewer/` | Hands-on | 30-60 min | Working viewer to play with |

---

## Recommended Order

1. **Start with** `docs/BACKGROUND.md` - understand medical imaging basics
2. **Then read** `docs/CORNERSTONE_GUIDE.md` - learn the viewer library
3. **Play with** `simple-viewer/` - hands-on experimentation
4. **Skim** the other docs as needed

---

## The Simple Viewer

We've provided a complete, working DICOM viewer for you to **study and experiment with**.

```bash
cd simple-viewer

# Option 1: Open directly
open index.html        # Mac
xdg-open index.html    # Linux  
start index.html       # Windows

# Option 2: Serve locally (if Option 1 has issues)
python -m http.server 8080
# Then open http://localhost:8080
```

**Features:**
- Load DICOM files
- Scroll through slices
- Window/Level, Pan, Zoom
- Length & Rectangle tools

**Study the code** - it's heavily commented to explain each step!

---

## Important Notes

1. **This is NOT the hackathon code** - you'll receive a different workspace on hackathon day
2. **No head start possible** - hackathon tasks are secret and require building NEW features
3. **Focus on understanding** - concepts matter more than memorizing code
4. **You'll have AI assistants** - during hackathon, use your coding agent freely

---

## Getting Sample DICOM Files

To play with the simple viewer, you need DICOM files:

- Download from [LIDC-IDRI](https://www.cancerimagingarchive.net/collection/lidc-idri/)
- Or search "sample DICOM files download" online
- Or use [OsiriX sample data](https://www.osirix-viewer.com/resources/dicom-image-library/)

---

## Questions?

Review the materials thoroughly. The hackathon will test your ability to **apply** these concepts to build new features.

Good luck with your preparation!
