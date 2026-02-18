# Background Knowledge: Medical Imaging & DICOM

> **Pre-Hackathon Reading Material**  
> Estimated reading time: 30-45 minutes

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

### Building from DICOM

```python
import numpy as np

def build_affine(ds):
    ipp = np.array(ds.ImagePositionPatient)      # Origin
    iop = np.array(ds.ImageOrientationPatient)   # Orientations
    ps = np.array(ds.PixelSpacing)               # Spacing
    
    row_dir = iop[0:3]
    col_dir = iop[3:6]
    slice_dir = np.cross(row_dir, col_dir)
    
    affine = np.eye(4)
    affine[0:3, 0] = row_dir * ps[1]
    affine[0:3, 1] = col_dir * ps[0]
    affine[0:3, 2] = slice_dir * ds.SliceThickness
    affine[0:3, 3] = ipp
    
    return affine
```

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

Sort by **Image Position Patient** projected onto slice normal:

```python
def sort_slices(slices):
    # Get normal direction from first slice
    iop = slices[0].ImageOrientationPatient
    normal = np.cross(iop[0:3], iop[3:6])
    
    # Sort by position along normal
    def position(s):
        ipp = np.array(s.ImagePositionPatient)
        return np.dot(ipp, normal)
    
    return sorted(slices, key=position)
```

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
| DICOM SEG | .dcm | Clinical standard |
| NIfTI | .nii.gz | Research/ML |
| NRRD | .nrrd | 3D Slicer |

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

### Coordinate Conversion

```python
# Pixel to World
world = affine @ [i, j, k, 1]

# World to Pixel  
pixel = np.linalg.inv(affine) @ [x, y, z, 1]
```

### Python Libraries

```bash
pip install pydicom nibabel SimpleITK numpy
```

```python
import pydicom       # Read DICOM
import nibabel       # Read NIfTI
import SimpleITK     # Image processing
```

---

## Next Steps

Continue to `CORNERSTONE_GUIDE.md` to learn how web viewers work.
