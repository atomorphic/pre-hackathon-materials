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

export function getRenderingEngine() { return renderingEngine }
export function getToolGroup() { return toolGroup }

// ─── Step 1: Initialise all three packages ───────────────────────────────────
export async function initCornerstone() {
  await coreInit()
  await dicomLoader.init()
  await toolsInit()
}

// ─── Step 2: Create a Stack viewport ─────────────────────────────────────────
export function initViewport(element: HTMLDivElement) {
  renderingEngine = new RenderingEngine(ENGINE_ID)
  renderingEngine.enableElement({
    viewportId: VIEWPORT_ID,
    element,
    type: Enums.ViewportType.STACK,
  })
}

// ─── Step 3: Register and configure tools ────────────────────────────────────
export function initTools() {
  // Register every tool class globally (once per app lifetime)
  addTool(WindowLevelTool)
  addTool(PanTool)
  addTool(ZoomTool)
  addTool(StackScrollTool)
  addTool(LengthTool)
  addTool(RectangleROITool)
  addTool(EllipticalROITool)

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
