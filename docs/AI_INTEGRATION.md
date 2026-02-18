# AI Integration Guide

> **Pre-Hackathon Reading Material**  
> Estimated reading time: 20-30 minutes

---

## Overview

Two AI tools for automatic segmentation:

| Tool | Description | Speed |
|------|-------------|-------|
| **TotalSegmentator** | 117 structures, local execution | Fast with --fast |
| **MONAI Label** | Customizable, server-based | Variable |

Both work with **NIfTI** format, so conversion is needed.

---

## DICOM ↔ NIfTI Conversion

### Why Convert?

| DICOM | NIfTI |
|-------|-------|
| Clinical standard | ML/research standard |
| Multiple files | Single file |
| Rich metadata | Simple header |

### Conversion Code

```python
import SimpleITK as sitk

def dicom_to_nifti(dicom_dir, output_path):
    reader = sitk.ImageSeriesReader()
    dicom_files = reader.GetGDCMSeriesFileNames(dicom_dir)
    reader.SetFileNames(dicom_files)
    image = reader.Execute()
    sitk.WriteImage(image, output_path)

# Usage
dicom_to_nifti('./dicom_folder', 'output.nii.gz')
```

---

## TotalSegmentator

### Installation

```bash
pip install TotalSegmentator
```

### Usage

```bash
# Full segmentation (slow)
TotalSegmentator -i input.nii.gz -o output_folder

# Fast mode (recommended for hackathon)
TotalSegmentator -i input.nii.gz -o output_folder --fast

# Specific structures only
TotalSegmentator -i input.nii.gz -o output_folder --fast \
  --roi_subset lung_upper_lobe_left lung_lower_lobe_left heart
```

### Output

Creates separate `.nii.gz` file per structure:
```
output_folder/
├── lung_upper_lobe_left.nii.gz
├── lung_lower_lobe_left.nii.gz
├── heart.nii.gz
└── ...
```

### Common Labels (Chest CT)

| Label | Structure |
|-------|-----------|
| lung_upper_lobe_left | Left upper lung |
| lung_lower_lobe_left | Left lower lung |
| lung_upper_lobe_right | Right upper lung |
| lung_middle_lobe_right | Right middle lung |
| lung_lower_lobe_right | Right lower lung |
| heart | Heart |
| aorta | Aorta |
| trachea | Trachea |

---

## MONAI Label

### Starting Server

```bash
# Download app
monailabel apps --download --name radiology --output apps

# Start server
monailabel start_server \
  --app apps/radiology \
  --studies /path/to/studies \
  --conf models segmentation
```

### REST API

```python
import requests

# Get available models
response = requests.get('http://localhost:8000/info')
models = response.json()['models']

# Run inference
with open('input.nii.gz', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/infer/segmentation',
        files={'image': f}
    )

# Save result
with open('segmentation.nii.gz', 'wb') as f:
    f.write(response.content)
```

---

## Loading Results in Cornerstone3D

### Concept

1. Load NIfTI segmentation data
2. Create derived labelmap volume
3. Register with segmentation module
4. Display as overlay

### Key APIs

```typescript
import { volumeLoader } from '@cornerstonejs/core';
import { segmentation, Enums } from '@cornerstonejs/tools';

// 1. Create labelmap volume
const segVolume = volumeLoader.createAndCacheDerivedLabelmapVolume(
  sourceVolumeId,
  { volumeId: 'segmentation' }
);

// 2. Fill with data (from NIfTI)
// ... copy segmentation data into segVolume ...

// 3. Register
segmentation.addSegmentations([{
  segmentationId: 'segmentation',
  representation: {
    type: Enums.SegmentationRepresentations.Labelmap,
    data: { volumeId: 'segmentation' },
  },
}]);

// 4. Display
await segmentation.addLabelmapRepresentationToViewportMap({
  [viewportId]: [{ segmentationId: 'segmentation' }],
});

// 5. Set colors
segmentation.config.color.setColorForSegmentIndex(
  'segmentation', 1, [255, 0, 0, 128]
);
```

---

## Workflow Summary

```
DICOM files
    │
    ▼ (convert)
NIfTI file
    │
    ▼ (AI model)
Segmentation NIfTI
    │
    ▼ (load into Cornerstone3D)
Overlay display
```

---

## Tips

1. Use `--fast` flag for TotalSegmentator during hackathon
2. Pre-compute results if model is slow
3. Verify alignment - segmentation must match source volume
4. Check orientation (RAS vs LPS)
