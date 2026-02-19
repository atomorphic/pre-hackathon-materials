# Background Knowledge: Medical Imaging & DICOM

> **Atomorphic Mini Hackathon - Pre-Hackathon Reading**  
> Estimated reading time: ~20 minutes

---

## Table of Contents

1. [What is DICOM?](#1-what-is-dicom)
2. [DICOM File Structure](#2-dicom-file-structure)
3. [Essential DICOM Tags](#3-essential-dicom-tags)
4. [Coordinate Systems](#4-coordinate-systems)
5. [Affine Transformations](#5-affine-transformations)
6. [3D Volume Construction](#6-3d-volume-construction)
7. [Annotation & Segmentation Formats](#7-annotation--segmentation-formats)
8. [Quick Reference](#8-quick-reference)

---

## 1. What is DICOM?

**DICOM** (Digital Imaging and Communications in Medicine) is the international standard for medical imaging. It defines:

- **File format**: How medical images and metadata are stored
- **Network protocol**: How imaging devices communicate

### Why DICOM Matters

```
Traditional Image (JPEG/PNG)          DICOM File
┌─────────────────────────┐          ┌─────────────────────────┐
│                         │          │  Patient: John Doe      │
│   Just pixel data       │          │  Study: CT Chest        │
│   No medical context    │          │  Date: 2026-02-18       │
│                         │          │  Slice: 45 of 200       │
│                         │          │  Position: [-120, 50, 0]│
│                         │          │  Spacing: 0.5mm         │
│                         │          │  ─────────────────────  │
│                         │          │  [Pixel Data]           │
└─────────────────────────┘          └─────────────────────────┘
```

DICOM preserves the **clinical context** needed for diagnosis and AI model training.

---

## 2. DICOM File Structure

A DICOM file has three parts:

```
┌─────────────────────────────────────────────────────┐
│  128-byte Preamble + "DICM" Prefix                  │
├─────────────────────────────────────────────────────┤
│  File Meta Information (encoding info)              │
├─────────────────────────────────────────────────────┤
│  Data Set (actual content)                          │
│  ┌─────────────────────────────────────────────┐   │
│  │  Tag (0008,0060) = "CT"     (Modality)      │   │
│  │  Tag (0010,0010) = "Doe^John" (Patient)     │   │
│  │  Tag (0020,0032) = "-120\50\0" (Position)   │   │
│  │  ...more tags...                            │   │
│  │  Tag (7FE0,0010) = [pixel data]             │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Elements (Tags)

Each piece of information is a **tag** with format `(Group, Element)`:

| Tag | Name | Example |
|-----|------|---------|
| `(0010,0010)` | Patient Name | `Doe^John` |
| `(0008,0060)` | Modality | `CT` |
| `(0020,0032)` | Image Position | `-120\50\0` |

---

## 3. Essential DICOM Tags

### Patient & Study Info

| Tag | Name | Description |
|-----|------|-------------|
| `(0010,0010)` | Patient Name | Format: Last^First^Middle |
| `(0010,0020)` | Patient ID | Unique identifier |
| `(0008,0020)` | Study Date | YYYYMMDD format |
| `(0008,0060)` | Modality | CT, MR, US, XR, etc. |

### Image Geometry (Critical!)

| Tag | Name | Description |
|-----|------|-------------|
| `(0028,0010)` | Rows | Image height in pixels |
| `(0028,0011)` | Columns | Image width in pixels |
| `(0028,0030)` | Pixel Spacing | Size of pixels [row, col] in mm |
| `(0020,0032)` | Image Position | XYZ of first pixel in mm |
| `(0020,0037)` | Image Orientation | Direction cosines |
| `(0018,0050)` | Slice Thickness | Thickness in mm |

---

## 4. Coordinate Systems

### Two Coordinate Spaces

```
  VOXEL/PIXEL SPACE                    WORLD/PATIENT SPACE
  ┌───────────────────────────┐       ┌───────────────────────────┐
  │  Array indices [i, j, k]  │       │  Physical position [x,y,z]│
  │  Unitless integers        │  ───► │  Units in millimeters     │
  │  Origin at array corner   │       │  Origin at patient ref    │
  └───────────────────────────┘       └───────────────────────────┘
```

**Key insight**: The same pixel index in two scans can be completely different anatomical locations!

### Anatomical Directions (LPS)

DICOM uses **LPS+** (Left, Posterior, Superior):

```
                Superior (+Z)
                     ▲
                     │
    Right ───────────┼──────────► Left (+X)
                    /│
                   / │
                  ▼
            Posterior (+Y)
```

---

## 5. Affine Transformations

The **affine matrix** converts between pixel and world coordinates:

```
┌   ┐     ┌                         ┐   ┌   ┐
│ x │     │ a11  a12  a13  │  tx   │   │ i │
│ y │  =  │ a21  a22  a23  │  ty   │ × │ j │
│ z │     │ a31  a32  a33  │  tz   │   │ k │
│ 1 │     │  0    0    0   │   1   │   │ 1 │
└   ┘     └                         ┘   └   ┘

world_coordinate = Affine × pixel_coordinate
```

The affine is built from three DICOM tags: **Image Position Patient** (origin), **Image Orientation Patient** (row/column directions), and **Pixel Spacing** (mm per pixel). You don't need to build it manually — Cornerstone3D handles this internally when loading DICOM files.

---

## 6. 3D Volume Construction

Medical scanners produce 2D slices that must be assembled:

```
DICOM Files              3D Volume
┌─────────────┐         ┌───────────────────┐
│  slice_001  │         │                   │
│  slice_002  │  Sort   │   volume[x,y,z]   │
│  slice_003  │  ────►  │                   │
│     ...     │  Stack  │                   │
│  slice_200  │         │                   │
└─────────────┘         └───────────────────┘
```

### Sorting Slices

**Important**: Filename order ≠ spatial order!

Sort slices by projecting each slice's **Image Position Patient** onto the slice normal direction (derived from **Image Orientation Patient**). SimpleITK's `ImageSeriesReader` does this automatically.

---

## 7. Annotation & Segmentation Formats

### Annotations (Points, Lines, Contours)

Stored as coordinates with metadata:

```json
{
  "type": "contour",
  "points": [[x1,y1,z1], [x2,y2,z2], ...],
  "label": "Nodule 1",
  "slice_z": -122.5
}
```

### Segmentation (Labelmaps)

3D arrays where each value = a structure:

```
0 = Background
1 = Liver
2 = Spleen
3 = Tumor
...
```

### Common Formats

| Format | Extension | Use |
|--------|-----------|-----|
| **DICOM SEG** | **.dcm** | **Clinical standard — used in the hackathon** |
| NIfTI | .nii.gz | Research/ML pipelines (intermediate format) |
| NRRD | .nrrd | 3D Slicer |

> **Note:** During the hackathon, AI segmentation results are provided as **DICOM SEG** files. NIfTI may appear as an intermediate format in some pipelines, but the final output you will load into Cornerstone3D is DICOM SEG.

---

## 8. Quick Reference

### DICOM Tags Cheat Sheet

```
Patient:     (0010,0010) Name, (0010,0020) ID
Study:       (0008,0020) Date, (0008,0060) Modality
Geometry:    (0020,0032) Position, (0020,0037) Orientation
             (0028,0030) Pixel Spacing
Pixels:      (0028,0010) Rows, (0028,0011) Columns
             (7FE0,0010) Pixel Data
```

### Python Libraries (for AI scripts)

```bash
pip install pydicom SimpleITK numpy
```

---

## Next Steps

Continue to `CORNERSTONE_GUIDE.md` to learn how web viewers work.
