# Cornerstone3D Guide

> **Atomorphic Mini Hackathon - Pre-Hackathon Reading**  
> Estimated reading time: ~25 minutes

> All code snippets in this guide are taken directly from `simple-viewer/src/cornerstone.ts` and `simple-viewer/src/App.tsx`, which compile and run correctly. Read these files alongside this guide.

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
import { init as coreInit } from '@cornerstonejs/core'
import { init as toolsInit } from '@cornerstonejs/tools'
import * as dicomLoader from '@cornerstonejs/dicom-image-loader'

await coreInit()
await dicomLoader.init()
await toolsInit()
```

Use an `initialised` flag guard to make this idempotent — React StrictMode calls effects twice.

### 2. RenderingEngine + Viewport

```typescript
import { RenderingEngine, Enums } from '@cornerstonejs/core'

const renderingEngine = new RenderingEngine('myEngine')

renderingEngine.enableElement({
  viewportId: 'myViewport',
  element: document.getElementById('viewer') as HTMLDivElement,
  type: Enums.ViewportType.STACK,
})

const viewport = renderingEngine.getViewport('myViewport')
```

Viewport types:

| Type | Use Case |
|------|----------|
| `ViewportType.STACK` | 2D slice viewing — used in the hackathon |
| `ViewportType.ORTHOGRAPHIC` | MPR views |
| `ViewportType.VOLUME_3D` | 3D rendering |

### 3. Loading Images

DICOM files are referenced by **imageId** strings. Two common schemes:

```typescript
import * as dicomLoader from '@cornerstonejs/dicom-image-loader'

// From a File object (user upload)
const imageId = dicomLoader.wadouri.fileManager.add(file)

// From a URL in public/ folder
const imageId = `wadouri:/data/sample_dicom/001.dcm`
```

Set the stack and render:

```typescript
await viewport.setStack([imageId1, imageId2, ...], startIndex)
viewport.render()
```

---

## Tools System

### Tool States

| State | Behavior |
|-------|----------|
| **Active** | Responds to mouse input; creates new annotations |
| **Passive** | Shows existing annotations; won't create new ones |
| **Enabled** | Visible but no interaction |
| **Disabled** | Hidden, no interaction |

### Setting Up Tools

```typescript
import {
  addTool, ToolGroupManager,
  WindowLevelTool, PanTool, ZoomTool, StackScrollTool,
  LengthTool, PlanarFreehandROITool,
  Enums as ToolEnums,
} from '@cornerstonejs/tools'

// 1. Register globally (idempotent)
[WindowLevelTool, PanTool, ZoomTool, StackScrollTool, LengthTool, PlanarFreehandROITool]
  .forEach(t => { try { addTool(t) } catch { /* already registered */ } })

// 2. Create tool group
const toolGroup = ToolGroupManager.createToolGroup('myGroup')

// 3. Add tools to group
toolGroup.addTool(WindowLevelTool.toolName)
toolGroup.addTool(StackScrollTool.toolName)
toolGroup.addTool(PlanarFreehandROITool.toolName)
// ...

// 4. Associate viewport with this group
toolGroup.addViewport('myViewport', 'myEngine')

// 5. Activate tools
toolGroup.setToolActive(WindowLevelTool.toolName, {
  bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
})
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
})
```

### Switching the Active Tool

```typescript
// Passivate old tool, activate new one
toolGroup.setToolPassive(oldToolName)
toolGroup.setToolActive(newToolName, {
  bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
})
```

### Tool Name Strings

```
WindowLevelTool.toolName       → 'WindowLevel'
PanTool.toolName               → 'Pan'
ZoomTool.toolName              → 'Zoom'
StackScrollTool.toolName       → 'StackScroll'
LengthTool.toolName            → 'Length'
RectangleROITool.toolName      → 'RectangleROI'
EllipticalROITool.toolName     → 'EllipticalROI'
PlanarFreehandROITool.toolName → 'PlanarFreehandROI'
```

---

## Annotations

### Structure

Annotations are objects stored in a global state manager:

```typescript
{
  annotationUID: string,           // unique ID
  metadata: {
    toolName: string,              // e.g. 'PlanarFreehandROI'
    referencedImageId: string,     // imageId of the slice
    FrameOfReferenceUID: string,
  },
  data: {
    handles: {
      points: [number, number, number][],  // world coordinates in mm!
    },
  },
}
```

### Reading Annotations

```typescript
import { annotation } from '@cornerstonejs/tools'

const all = annotation.state.getAllAnnotations()
const freehand = annotation.state.getAnnotations('PlanarFreehandROI')
```

### Adding an Annotation Programmatically

```typescript
import { annotation } from '@cornerstonejs/tools'

annotation.state.addAnnotation({
  annotationUID: crypto.randomUUID(),
  metadata: {
    toolName: 'PlanarFreehandROI',
    referencedImageId: imageId,
    FrameOfReferenceUID: viewport.getFrameOfReferenceUID(),
  },
  data: {
    handles: {
      points: [
        [x1, y1, z1],  // world coordinates in mm
        [x2, y2, z2],
        // ...
      ],
    },
  },
})

renderingEngine.render()
```

### Coordinate System

Annotations use **world coordinates** (mm), not pixel indices. Two distinct conversions:

| Source | API | Use when |
|--------|-----|----------|
| DICOM image pixel `(col, row)` | `utilities.imageToWorldCoords(imageId, [col, row])` | Converting LIDC XML pixel coordinates |
| Canvas screen pixel `(x, y)` | `viewport.canvasToWorld([x, y])` | Handling mouse events on the canvas |

> These are **not interchangeable**. Canvas coordinates depend on zoom/pan state; image pixel coordinates are fixed to the DICOM grid.

---

## Segmentation

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Labelmap** | 3D integer array — each value is a segment index (0 = background) |
| **Segment** | One structure (e.g. index 1 = right lung) |
| **Representation** | How it's displayed: labelmap overlay, contour, or surface |

### Loading and Displaying a Segmentation

```typescript
import { segmentation, Enums as ToolEnums } from '@cornerstonejs/tools'

// 1. Register the segmentation (segmentationId links to a loaded volume)
segmentation.addSegmentations([{
  segmentationId: 'mySeg',
  representation: {
    type: ToolEnums.SegmentationRepresentations.Labelmap,
    data: { volumeId: 'mySegVolume' },
  },
}])

// 2. Display it on a viewport
await segmentation.addLabelmapRepresentationToViewportMap({
  myViewport: [{ segmentationId: 'mySeg' }],
})
```

### Segment Colors

```typescript
segmentation.config.color.setColorForSegmentIndex(
  'mySeg',
  1,                    // segment index
  [255, 0, 0, 128]      // RGBA
)
```

---

## Events

Cornerstone fires DOM custom events on the viewport element:

```typescript
import { Enums } from '@cornerstonejs/core'

element.addEventListener(Enums.Events.STACK_VIEWPORT_SCROLL, () => {
  const idx = viewport.getCurrentImageIdIndex()
  const total = viewport.getImageIds().length
  console.log(`Slice ${idx + 1} of ${total}`)
})

element.addEventListener(Enums.Events.VOI_MODIFIED, (evt) => {
  const { range } = (evt as CustomEvent).detail
  const W = Math.round(range.upper - range.lower)
  const L = Math.round((range.upper + range.lower) / 2)
  console.log(`W ${W} / L ${L}`)
})
```

---

## Common Patterns

### Resize handling

Canvas must be notified when the container resizes (e.g. flexbox initialises at 0×0):

```typescript
const observer = new ResizeObserver(() => {
  renderingEngine.resize(true, false)
})
observer.observe(element)
// clean up: observer.disconnect()
```

### Reset view

```typescript
viewport.resetCamera()
viewport.render()
```

---

## Next Steps

Continue to `LIDC_DATA_GUIDE.md` to understand the annotation format you'll work with on hackathon day.
