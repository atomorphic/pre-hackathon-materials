// =============================================================================
// Simple DICOM Viewer — Learning Example
// =============================================================================
// This is a fully working React + Cornerstone3D viewer.
// Three places are left incomplete for you to fill in (marked TODO 1–3).
// Everything else is intentionally complete so you can focus on learning.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  initCornerstone,
  initViewport,
  initTools,
  setNavigationTool,
  setActiveTool,
  getRenderingEngine,
  VIEWPORT_ID,
} from './cornerstone'
import { loadDicomFiles, getImageIds } from './loader'
import {
  WindowLevelTool,
  PanTool,
  ZoomTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
} from '@cornerstonejs/tools'
import { Enums as CoreEnums, eventTarget } from '@cornerstonejs/core'

// ─── Types ───────────────────────────────────────────────────────────────────
type NavTool   = 'WindowLevel' | 'Pan' | 'Zoom'
type DrawTool  = 'Length' | 'RectangleROI' | 'EllipticalROI'
type ActiveTool = NavTool | DrawTool

interface Info {
  slice: string
  total: string
  wl: string      // ← TODO 3 will populate this
  patientName: string
}

// =============================================================================
export default function App() {
  const viewportRef  = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [ready,       setReady]       = useState(false)
  const [status,      setStatus]      = useState('Initialising...')
  const [activeTool,  setActiveToolUI] = useState<ActiveTool>('WindowLevel')
  const [info,        setInfo]        = useState<Info>({
    slice: '--', total: '--', wl: '--', patientName: '--',
  })

  // ── Initialise Cornerstone once the viewport div is mounted ────────────────
  useEffect(() => {
    if (!viewportRef.current) return
    const el = viewportRef.current

    ;(async () => {
      try {
        setStatus('Initialising Cornerstone3D…')
        await initCornerstone()
        initViewport(el)
        initTools()
        setReady(true)
        setStatus('Ready — load DICOM files to begin')
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    })()
  }, [])

  // ── Listen for slice-changed events to update the slice counter ────────────
  useEffect(() => {
    if (!ready || !viewportRef.current) return

    const el = viewportRef.current

    const handleSliceChange = () => {
      const re = getRenderingEngine()
      if (!re) return
      const vp = re.getViewport(VIEWPORT_ID) as any
      const idx   = vp?.getCurrentImageIdIndex?.() ?? 0
      const total = getImageIds().length
      setInfo(prev => ({ ...prev, slice: String(idx + 1), total: String(total) }))
    }

    el.addEventListener(CoreEnums.Events.STACK_VIEWPORT_SCROLL, handleSliceChange)
    return () => el.removeEventListener(CoreEnums.Events.STACK_VIEWPORT_SCROLL, handleSliceChange)
  }, [ready])

  // ── Listen for W/L changes ─────────────────────────────────────────────────
  //
  // TODO 3 — Display live Window/Level values in the info panel.
  //
  // When the user drags to adjust brightness/contrast, Cornerstone fires a
  // VOI_MODIFIED event. Listen for it and update info.wl.
  //
  // The event detail contains: { volumeId?, viewportId, range: { lower, upper } }
  // Window = upper - lower,  Centre = (upper + lower) / 2
  //
  // Steps:
  //   1. Add an event listener for CoreEvents.VOI_MODIFIED on `el`
  //   2. Calculate W and L from event.detail.range
  //   3. Call setInfo(prev => ({ ...prev, wl: `${W} / ${L}` }))
  //   4. Remember to return a cleanup function (removeEventListener)
  //
  useEffect(() => {
    if (!ready || !viewportRef.current) return
    // TODO 3: implement W/L display here
  }, [ready])

  // ── File loading ───────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setStatus(`Loading ${files.length} file(s)…`)
    const n = await loadDicomFiles(Array.from(files), (loaded, total) => {
      setStatus(`Loading… ${loaded}/${total}`)
    })
    if (n === 0) { setStatus('No DICOM files found'); return }
    const ids = getImageIds()
    setInfo(prev => ({
      ...prev,
      slice: String(Math.floor(ids.length / 2) + 1),
      total: String(ids.length),
    }))
    setStatus(`Loaded ${n} image${n !== 1 ? 's' : ''} — scroll to navigate`)
  }, [])

  // ── Navigation tool switch ─────────────────────────────────────────────────
  const handleNavTool = useCallback((tool: NavTool) => {
    setNavigationTool(
      tool === 'WindowLevel' ? WindowLevelTool.toolName :
      tool === 'Pan'         ? PanTool.toolName          :
                               ZoomTool.toolName
    )
    setActiveToolUI(tool)
  }, [])

  // ── Annotation tool switch ─────────────────────────────────────────────────
  const handleDrawTool = useCallback((tool: DrawTool) => {
    setActiveTool(
      tool === 'Length'       ? LengthTool.toolName        :
      tool === 'RectangleROI' ? RectangleROITool.toolName  :
                                EllipticalROITool.toolName
    )
    setActiveToolUI(tool)
  }, [])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const re = getRenderingEngine()
    if (!re) return
    const vp = re.getViewport(VIEWPORT_ID) as any
    vp?.resetCamera?.()
    vp?.render?.()
    setStatus('View reset')
  }, [])

  // ==========================================================================
  return (
    <div id="root" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Header */}
      <header className="header">
        <h1>Simple DICOM Viewer</h1>
        <span className="subtitle">Pre-Hackathon Learning — Atomorphic Mini Hackathon</span>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        {/* File loading */}
        <div className="tool-group">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".dcm"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          <button disabled={!ready} onClick={() => fileInputRef.current?.click()}>
            Load DICOM
          </button>
        </div>

        <div className="divider" />

        {/* Navigation tools */}
        <div className="tool-group">
          {(['WindowLevel', 'Pan', 'Zoom'] as NavTool[]).map(tool => (
            <button
              key={tool}
              disabled={!ready}
              className={activeTool === tool ? 'active' : ''}
              onClick={() => handleNavTool(tool)}
            >
              {tool === 'WindowLevel' ? 'W/L' : tool}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* Annotation tools */}
        <div className="tool-group">
          <button
            disabled={!ready}
            className={activeTool === 'Length' ? 'active' : ''}
            onClick={() => handleDrawTool('Length')}
          >
            Length
          </button>
          <button
            disabled={!ready}
            className={activeTool === 'RectangleROI' ? 'active' : ''}
            onClick={() => handleDrawTool('RectangleROI')}
          >
            Rectangle
          </button>

          {/*
           * TODO 2 — Add an Ellipse tool button.
           *
           * EllipticalROITool is already registered in cornerstone.ts.
           * Add a button here that:
           *   - is disabled when !ready
           *   - gets className 'active' when activeTool === 'EllipticalROI'
           *   - calls handleDrawTool('EllipticalROI') on click
           *
           * <button ...>Ellipse</button>
           */}
        </div>

        <div className="divider" />

        <div className="tool-group">
          <button disabled={!ready} onClick={handleReset}>Reset</button>
        </div>
      </div>

      {/* Main */}
      <div className="main-content">

        {/* Info panel */}
        <aside className="info-panel">
          <h3>Image Info</h3>
          <div className="info-rows">

            <div className="info-row">
              <span className="info-label">Slice</span>
              <span className="info-value">{info.slice} / {info.total}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Window / Level</span>
              {/* TODO 3 will make this show live values */}
              <span className="info-value todo-field">
                {info.wl === '--'
                  ? '← TODO 3: implement W/L display'
                  : info.wl}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Patient</span>
              <span className="info-value">{info.patientName}</span>
            </div>

          </div>

          {/* TODO callouts */}
          <div className="todo-callout">
            <strong>TODO 1 — Scroll wheel</strong>
            Open <code>src/cornerstone.ts</code> and activate
            <code> StackScrollTool</code> with the Wheel binding.
          </div>
          <div className="todo-callout">
            <strong>TODO 2 — Ellipse button</strong>
            Add the Ellipse tool button to the toolbar in
            <code> src/App.tsx</code>.
          </div>
          <div className="todo-callout">
            <strong>TODO 3 — W/L display</strong>
            Listen for <code>VOI_MODIFIED</code> in
            <code> src/App.tsx</code> and show live values above.
          </div>

          <div className="instructions">
            <strong>How to use:</strong><br />
            1. Click Load DICOM<br />
            2. Select .dcm files<br />
            3. Fix TODO 1 — then scroll!<br />
            4. Draw annotations with Length / Rect
          </div>
        </aside>

        {/* Viewport */}
        <div className="viewport-area">
          <div className="viewport-wrapper">
            <div ref={viewportRef} className="viewport-el" />
          </div>
        </div>

      </div>

      {/* Status bar */}
      <footer className="status-bar">{status}</footer>

    </div>
  )
}
