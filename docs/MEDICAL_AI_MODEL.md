# Medical AI Segmentation Models

> **Atomorphic Mini Hackathon — Pre-Hackathon Reading**  
> Estimated reading time: ~10 minutes

---

## Overview

This guide covers three AI tools commonly used for automatic anatomical segmentation of CT images. Understanding these tools will help you during the hackathon, where one of the tasks involves running an AI segmentation model and displaying its output.

| Tool | What it does | GitHub | Speed (CPU) |
|------|-------------|--------|-------------|
| **TotalSegmentator** | Segments 117+ anatomical structures in CT/MR | [wasserth/TotalSegmentator](https://github.com/wasserth/TotalSegmentator) | ~10 min (fast mode) |
| **MONAI Label** | Server-based interactive labeling + AI inference | [Project-MONAI/MONAILabel](https://github.com/Project-MONAI/MONAILabel) | Variable |

All three tools natively work with **NIfTI** (`.nii.gz`) files as input/output. Since DICOM is the clinical standard and what Cornerstone3D loads, a conversion step is needed:

```
DICOM slices → NIfTI (for AI model) → Segmentation NIfTI → DICOM SEG (for display)
```

> **Hackathon note:** Pre-computed segmentation results are provided as **DICOM SEG** files (the clinical standard). If you run a model yourself during the hackathon, you'll produce NIfTI output that can be converted to DICOM SEG — or you can load NIfTI directly if you find a way. The pre-computed files are always available as a fallback.

---

## DICOM ↔ NIfTI Conversion

### Why Convert?

| DICOM | NIfTI |
|-------|-------|
| Clinical standard, used by scanners and PACS | ML/research standard, used by PyTorch models |
| One file per slice (hundreds of files per scan) | Single file for entire 3D volume |
| Rich metadata (patient info, geometry, etc.) | Minimal header (dimensions, spacing, affine) |

SimpleITK's `ImageSeriesReader` handles DICOM → NIfTI conversion, preserving spatial metadata (origin, spacing, orientation). The hackathon workspace includes a ready-made script at `scripts/dicom_to_nifti.py`.

---

## TotalSegmentator

**GitHub:** [https://github.com/wasserth/TotalSegmentator](https://github.com/wasserth/TotalSegmentator) (2.5k stars, Apache-2.0)  
**Paper:** [Wasserthal et al., *Radiology: AI*, 2023](https://pubs.rsna.org/doi/10.1148/ryai.230024)  
**What it does:** Segments 117 anatomical structures from CT images — organs, bones, muscles, vessels — using an [nnU-Net](https://github.com/MIC-DKFZ/nnUNet) backbone. Also supports MR images (50 structures) and specialized subtasks (lung nodules, liver vessels, brain structures, etc.).

### Installation

```bash
pip install TotalSegmentator
```

Requires Python >= 3.9 and [PyTorch](https://pytorch.org/) >= 2.0. First run downloads model weights (~1.5 GB).

### Usage

```bash
# Full segmentation — 117 structures (slow: ~10 min CPU, ~1 min GPU)
TotalSegmentator -i ct_volume.nii.gz -o segmentations/

# Fast mode — lower resolution, ~3x faster
TotalSegmentator -i ct_volume.nii.gz -o segmentations/ --fast

# Specific structures only — saves time and memory
TotalSegmentator -i ct_volume.nii.gz -o segmentations/ --roi_subset lung_upper_lobe_left lung_lower_lobe_left heart

# DICOM SEG output (requires: pip install highdicom)
TotalSegmentator -i ct_volume.nii.gz -o segmentations/ --fast --output_type dicom_seg
```

### Python API

The Python API accepts a SimpleITK image object and returns a segmentation image. See the [TotalSegmentator README](https://github.com/wasserth/TotalSegmentator#readme) for usage details.

### Output

By default, creates one `.nii.gz` file per structure:

```
segmentations/
├── lung_upper_lobe_left.nii.gz
├── lung_lower_lobe_left.nii.gz
├── lung_upper_lobe_right.nii.gz
├── lung_middle_lobe_right.nii.gz
├── lung_lower_lobe_right.nii.gz
├── heart.nii.gz
├── aorta.nii.gz
├── trachea.nii.gz
└── ... (117 total for task "total")
```

Use `--ml` flag to save all labels in a single multi-label NIfTI file instead.

### Key Chest CT Labels

| Index | Structure |
|-------|-----------|
| 10 | lung_upper_lobe_left |
| 11 | lung_lower_lobe_left |
| 12 | lung_upper_lobe_right |
| 13 | lung_middle_lobe_right |
| 14 | lung_lower_lobe_right |
| 51 | heart |
| 52 | aorta |
| 16 | trachea |

Full class mapping: [totalsegmentator/map_to_binary.py](https://github.com/wasserth/TotalSegmentator/blob/master/totalsegmentator/map_to_binary.py)

### Relevant Subtask: Lung Nodules

TotalSegmentator includes a `lung_nodules` subtask specifically trained on LIDC-IDRI data:

```bash
TotalSegmentator -i ct_volume.nii.gz -o seg/ --task lung_nodules
```

This produces `lung.nii.gz` and `lung_nodules.nii.gz` — directly relevant to the LIDC dataset used in the hackathon.

---

## MONAI Label

**GitHub:** [https://github.com/Project-MONAI/MONAILabel](https://github.com/Project-MONAI/MONAILabel) (812 stars, Apache-2.0)  
**Docs:** [monai.readthedocs.io/projects/label](https://monai.readthedocs.io/projects/label/en/latest/)  
**What it does:** An intelligent server-based platform for interactive medical image annotation with AI. It runs as a REST API server that integrates with viewers like 3D Slicer, OHIF, QuPath, and CVAT. Supports active learning — the model improves as users annotate.

### Key Concepts

Unlike TotalSegmentator (which is a one-shot inference tool), MONAI Label is a **server-client system**:

1. A Python server runs the AI model and exposes a REST API
2. A viewer (3D Slicer, OHIF, etc.) connects as a client
3. Users annotate interactively; the server re-trains in the background

This makes it powerful for production workflows but more complex to set up than the command-line tools above.

### Installation

```bash
pip install monailabel
```

### Starting the Server

```bash
# Download a sample app (radiology segmentation)
monailabel apps --download --name radiology --output apps

# Download sample data
monailabel datasets --download --name Task09_Spleen --output datasets

# Start the server
monailabel start_server \
  --app apps/radiology \
  --studies datasets/Task09_Spleen/imagesTr \
  --conf models segmentation
```

The server runs at `http://localhost:8000` by default.

### REST API

Once the server is running, send HTTP requests to trigger inference. The response is a segmentation file. See the [MONAI Label docs](https://monai.readthedocs.io/projects/label/en/latest/) for the full API reference.

### Supported Applications

| App | Task | Models |
|-----|------|--------|
| **Radiology** | Organ segmentation in CT/MR | DeepEdit, DeepGrow, UNet, UNETR |
| **Pathology** | Nuclei segmentation in WSI | NuClick, DeepEdit |
| **Endoscopy** | Tool tracking in video | DeepEdit, ToolTracking |
| **MONAI Bundles** | Any task from the [Model Zoo](https://github.com/Project-MONAI/model-zoo) | Whole body, brain, lung nodule detection, etc. |

### MONAI Bundles + TotalSegmentator

MONAI Label can run [TotalSegmentator as a MONAI Bundle](https://github.com/Project-MONAI/MONAILabel/tree/main/sample-apps/monaibundle), providing the server-based workflow on top of TotalSegmentator's inference.

---

## Loading Results in Cornerstone3D

### The End-to-End Pipeline

```
DICOM slices (CT scan)
    │
    ▼ (SimpleITK: dicom_to_nifti)
NIfTI file (.nii.gz)
    │
    ▼ (AI model: TotalSegmentator / MONAI Label)
Segmentation NIfTI (.nii.gz)
    │
    ▼ (convert to DICOM SEG — or use pre-computed file)
DICOM SEG (.dcm)
    │
    ▼ (load into Cornerstone3D segmentation API)
Coloured overlay on CT images
```

**In the hackathon**, pre-computed DICOM SEG files are provided at:

```
data/LIDC-IDRI-0001/annotations/LIDC-IDRI-0001_lung_nodules_seg.dcm
data/LIDC-IDRI-0001/annotations/LIDC-IDRI-0001_Combined_SEG.dcm
```

See `CORNERSTONE_GUIDE.md` — Segmentation section for how to load and display these using the Cornerstone3D `segmentation` API.

---

## Tips

1. **Use `--fast` or `--roi_subset`** for TotalSegmentator to reduce runtime on CPU
2. **Pre-compute results** if the model is too slow to run live — the hackathon provides pre-computed files
3. **Verify alignment** — the segmentation must share the same origin, spacing, and direction as the source CT. If the overlay appears on the wrong slices, the coordinate systems don't match
4. **Check orientation** — DICOM typically uses LPS (Left-Posterior-Superior), while NIfTI uses RAS (Right-Anterior-Superior). SimpleITK handles this conversion automatically, but be aware of it when debugging
5. **DICOM SEG output** — TotalSegmentator supports `--output_type dicom_seg` directly (requires `pip install highdicom`)

---

## Further Reading

- [TotalSegmentator README](https://github.com/wasserth/TotalSegmentator#readme) — full class list, advanced options, Docker usage
- [MONAI Label docs](https://monai.readthedocs.io/projects/label/en/latest/) — full API reference, tutorials, viewer integration
- [MONAI Label tutorials](https://github.com/Project-MONAI/tutorials/tree/main/monailabel) — Jupyter notebooks for radiology, pathology, and endoscopy workflows
- [highdicom](https://github.com/ImagingDataCommons/highdicom) — Python library for creating DICOM SEG files from numpy arrays

---

## Next Steps

You're done with the reading materials! Open `simple-viewer/` and run `npm install && npm run dev` to experiment hands-on.
