// =============================================================================
// Cornerstone3D Initialisation
// =============================================================================
// This module sets up the rendering engine, viewport, and tools.
// Read this carefully — the hackathon workspace uses the same pattern.

import {
  init as coreInit,
  RenderingEngine,
  Enums,
} from '@cornerstonejs/core'

import {
  init as toolsInit,
  addTool,
  ToolGroupManager,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  Enums as ToolEnums,
  type Types as ToolTypes,
} from '@cornerstonejs/tools'

import * as dicomLoader from '@cornerstonejs/dicom-image-loader'

export const ENGINE_ID   = 'learningEngine'
export const VIEWPORT_ID = 'mainViewport'
export const TOOLGROUP_ID = 'learningToolGroup'

let renderingEngine: RenderingEngine
let toolGroup: ToolTypes.IToolGroup
let initialised = false

export function getRenderingEngine() { return renderingEngine }
export function getToolGroup() { return toolGroup }

// ─── Step 1: Initialise all three packages ───────────────────────────────────
export async function initCornerstone() {
  if (initialised) return
  await coreInit()
  await dicomLoader.init()
  await toolsInit()
  initialised = true
}

// ─── Step 2: Create a Stack viewport ─────────────────────────────────────────
export function initViewport(element: HTMLDivElement) {
  // Destroy any previous engine (handles React StrictMode double-invoke)
  try { renderingEngine?.destroy() } catch { /* ok */ }
  renderingEngine = new RenderingEngine(ENGINE_ID)
  renderingEngine.enableElement({
    viewportId: VIEWPORT_ID,
    element,
    type: Enums.ViewportType.STACK,
  })
}

// ─── Resize observer: keep viewport canvas in sync with its container ─────────
// Returns a cleanup function — call it from useEffect's return.
export function setupResizeObserver(element: HTMLDivElement): () => void {
  const observer = new ResizeObserver(() => {
    try { renderingEngine?.resize(true, false) } catch { /* ok */ }
  })
  observer.observe(element)
  return () => observer.disconnect()
}

// ─── Step 3: Register and configure tools ────────────────────────────────────
export function initTools() {
  // addTool is idempotent — wrap in try/catch for safety
  const tools = [WindowLevelTool, PanTool, ZoomTool, StackScrollTool,
                 LengthTool, RectangleROITool, EllipticalROITool]
  tools.forEach(t => { try { addTool(t) } catch { /* already registered */ } })

  // Destroy previous tool group if it exists (handles StrictMode re-init)
  try { ToolGroupManager.destroyToolGroup(TOOLGROUP_ID) } catch { /* ok */ }
  // A ToolGroup links a set of tools to one or more viewports
  toolGroup = ToolGroupManager.createToolGroup(TOOLGROUP_ID)!

  toolGroup.addTool(WindowLevelTool.toolName)
  toolGroup.addTool(PanTool.toolName)
  toolGroup.addTool(ZoomTool.toolName)
  toolGroup.addTool(StackScrollTool.toolName)
  toolGroup.addTool(LengthTool.toolName)
  toolGroup.addTool(RectangleROITool.toolName)
  toolGroup.addTool(EllipticalROITool.toolName)

  toolGroup.addViewport(VIEWPORT_ID, ENGINE_ID)

  // Activate Window/Level on left mouse button
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
  })

  // ─── TODO 1 ──────────────────────────────────────────────────────────────
  // The scroll wheel does nothing right now. Activate StackScrollTool so the
  // user can scroll through slices with the mouse wheel.
  //
  // Hint: look at how WindowLevelTool is activated above.
  // Use MouseBindings.Wheel instead of MouseBindings.Primary.
  //
  // toolGroup.setToolActive(StackScrollTool.toolName, {
  //   bindings: [{ mouseButton: ToolEnums.MouseBindings.??? }],
  // })
  // ─────────────────────────────────────────────────────────────────────────
}

// ─── Switch the active annotation tool ───────────────────────────────────────
export function setActiveTool(toolName: string) {
  const annotationTools = [
    LengthTool.toolName,
    RectangleROITool.toolName,
    EllipticalROITool.toolName,
  ]
  annotationTools.forEach(t => {
    try { toolGroup.setToolPassive(t) } catch { /* not active */ }
  })
  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
  })
}

// ─── Switch the navigation tool (W/L, Pan, Zoom) ─────────────────────────────
export function setNavigationTool(toolName: string) {
  const navTools = [
    WindowLevelTool.toolName,
    PanTool.toolName,
    ZoomTool.toolName,
  ]
  navTools.forEach(t => {
    try { toolGroup.setToolPassive(t) } catch { /* not active */ }
  })
  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
  })
}
