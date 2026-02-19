# Cornerstone3D Guide

> **Atomorphic Mini Hackathon - Pre-Hackathon Reading**  
> Estimated reading time: 45-60 minutes

---

## What is Cornerstone3D?

Cornerstone3D is a JavaScript library for viewing medical images in web browsers. It powers many clinical and research imaging applications.

**Three packages:**
```
@cornerstonejs/core          - Rendering, viewports, volumes
@cornerstonejs/tools         - Interaction, annotations, segmentation
@cornerstonejs/dicom-image-loader  - Loading DICOM files
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   RenderingEngine                     │  │
│  │  - Manages all viewports                              │  │
│  │  - Handles WebGL rendering                            │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│           ┌─────────────┼─────────────┐                     │
│           │             │             │                     │
│           ▼             ▼             ▼                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Viewport 1 │ │  Viewport 2 │ │  Viewport 3 │          │
│  │   (Axial)   │ │  (Sagittal) │ │  (Coronal)  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    ToolGroup                          │  │
│  │  - Groups viewports sharing same tools                │  │
│  │  - Manages tool activation                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. Initialization

All three packages must be initialized before use:

```typescript
import { init as coreInit } from '@cornerstonejs/core';
import { init as toolsInit } from '@cornerstonejs/tools';
import { init as loaderInit } from '@cornerstonejs/dicom-image-loader';

async function initialize() {
  await coreInit();
  await loaderInit();
  await toolsInit();
}
```

### 2. Rendering Engine

The central controller that manages viewports:

```typescript
import { RenderingEngine } from '@cornerstonejs/core';

const renderingEngine = new RenderingEngine('myEngine');
```

### 3. Viewports

Display areas for images. Three types:

| Type | Enum | Use Case |
|------|------|----------|
| Stack | `ViewportType.STACK` | 2D slice viewing |
| Orthographic | `ViewportType.ORTHOGRAPHIC` | MPR views |
| Volume 3D | `ViewportType.VOLUME_3D` | 3D rendering |

```typescript
import { Enums } from '@cornerstonejs/core';

const viewportInput = {
  viewportId: 'myViewport',
  element: document.getElementById('viewer'),
  type: Enums.ViewportType.STACK,
};

renderingEngine.enableElement(viewportInput);
const viewport = renderingEngine.getViewport('myViewport');
```

### 4. Image Loading

DICOM files are referenced by "imageIds":

```typescript
import { wadouri } from '@cornerstonejs/dicom-image-loader';

// Add file to get imageId
const imageId = wadouri.fileManager.add(file);

// Set images on viewport
await viewport.setStack([imageId1, imageId2, ...]);
viewport.render();
```

---

## Tools System

### Tool States

| State | Behavior |
|-------|----------|
| **Active** | Responds to mouse, creates new annotations |
| **Passive** | Can edit existing, won't create new |
| **Enabled** | Visible but no interaction |
| **Disabled** | Hidden, no interaction |

### Setting Up Tools

```typescript
import {
  addTool,
  ToolGroupManager,
  WindowLevelTool,
  LengthTool,
  Enums as ToolEnums,
} from '@cornerstonejs/tools';

// 1. Register tools globally
addTool(WindowLevelTool);
addTool(LengthTool);

// 2. Create tool group
const toolGroup = ToolGroupManager.createToolGroup('myGroup');

// 3. Add tools to group
toolGroup.addTool(WindowLevelTool.toolName);
toolGroup.addTool(LengthTool.toolName);

// 4. Associate viewport
toolGroup.addViewport('myViewport', 'myEngine');

// 5. Set active tool
toolGroup.setToolActive(WindowLevelTool.toolName, {
  bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
});
```

### Switching Tools

```typescript
function setActiveTool(toolName) {
  // Deactivate current
  toolGroup.setToolPassive(currentTool);
  
  // Activate new
  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
  });
}
```

---

## Annotations

### Structure

Annotations are stored in global state:

```typescript
interface Annotation {
  annotationUID: string;
  metadata: {
    toolName: string;
    FrameOfReferenceUID: string;
  };
  data: {
    handles: {
      points: [number, number, number][];  // World coordinates!
    };
    cachedStats?: object;
  };
}
```

### Reading Annotations

```typescript
import { annotation } from '@cornerstonejs/tools';

// Get all
const all = annotation.state.getAllAnnotations();

// Get by tool type
const lengths = annotation.state.getAnnotations('Length');
```

### Creating Annotations Programmatically

```typescript
const newAnnotation = {
  annotationUID: 'unique-id',
  metadata: {
    toolName: 'PlanarFreehandROI',
    FrameOfReferenceUID: frameOfRefUID,
  },
  data: {
    handles: {
      points: [
        [x1, y1, z1],  // World coordinates in mm!
        [x2, y2, z2],
        // ... more points
      ],
    },
  },
};

annotation.state.addAnnotation(newAnnotation);
renderingEngine.render();
```

### Important: Coordinate System

Annotations use **world coordinates** (mm), not pixel indices!

```typescript
// Canvas pixel → World mm
const worldPoint = viewport.canvasToWorld([canvasX, canvasY]);

// World mm → Canvas pixel
const canvasPoint = viewport.worldToCanvas([worldX, worldY, worldZ]);
```

---

## Segmentation

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Labelmap** | 3D array of integer labels |
| **Segment** | One label (e.g., 1=liver) |
| **Representation** | Display format (labelmap, contour, surface) |

### Creating a Segmentation

```typescript
import { volumeLoader } from '@cornerstonejs/core';
import { segmentation, Enums as ToolEnums } from '@cornerstonejs/tools';

// 1. Create labelmap volume
const segVolume = volumeLoader.createAndCacheDerivedLabelmapVolume(
  sourceVolumeId,
  { volumeId: 'mySegmentation' }
);

// 2. Register it
segmentation.addSegmentations([{
  segmentationId: 'mySegmentation',
  representation: {
    type: ToolEnums.SegmentationRepresentations.Labelmap,
    data: { volumeId: 'mySegmentation' },
  },
}]);

// 3. Display on viewport
await segmentation.addLabelmapRepresentationToViewportMap({
  [viewportId]: [{ segmentationId: 'mySegmentation' }],
});
```

### Setting Segment Colors

```typescript
segmentation.config.color.setColorForSegmentIndex(
  'mySegmentation',
  1,                    // segment index
  [255, 0, 0, 128]      // RGBA
);
```

---

## Common Patterns

### Loading Images from Files

```typescript
async function loadFiles(files) {
  const imageIds = [];
  
  for (const file of files) {
    const imageId = wadouri.fileManager.add(file);
    imageIds.push(imageId);
  }
  
  await viewport.setStack(imageIds);
  viewport.render();
}
```

### Resetting View

```typescript
viewport.resetCamera();
viewport.render();
```

### Getting Current Slice

```typescript
const index = viewport.getCurrentImageIdIndex();
const total = viewport.getImageIds().length;
console.log(`Slice ${index + 1} of ${total}`);
```

---

## Quick Reference

### Imports

```typescript
// Core
import { init, RenderingEngine, Enums, volumeLoader } from '@cornerstonejs/core';

// Tools
import {
  init, addTool, ToolGroupManager, annotation, segmentation,
  WindowLevelTool, PanTool, ZoomTool, LengthTool,
  Enums as ToolEnums,
} from '@cornerstonejs/tools';

// Loader
import { init, wadouri } from '@cornerstonejs/dicom-image-loader';
```

### Tool Names

```typescript
WindowLevelTool.toolName  // 'WindowLevel'
PanTool.toolName          // 'Pan'
ZoomTool.toolName         // 'Zoom'
LengthTool.toolName       // 'Length'
RectangleROITool.toolName // 'RectangleROI'
PlanarFreehandROITool.toolName  // 'PlanarFreehandROI'
```

---

## Next Steps

Continue to `LIDC_DATA_GUIDE.md` to understand the annotation format you'll work with on hackathon day.
