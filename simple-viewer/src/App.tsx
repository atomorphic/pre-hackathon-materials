// =============================================================================
// Simple DICOM Viewer — Learning Example
// =============================================================================
// This is a fully working React + Cornerstone3D viewer.
// Read through the code to understand the patterns used.
// Three curiosity prompts are scattered in comments — try them if you like!
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  initCornerstone,
  initViewport,
  initTools,
  setNavigationTool,
  setActiveTool,
  getRenderingEngine,
  setupResizeObserver,
  VIEWPORT_ID,
} from './cornerstone'
import { loadDicomFiles, loadSampleData, getImageIds } from './loader'
import {
  WindowLevelTool,
  PanTool,
  ZoomTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
} from '@cornerstonejs/tools'
import { Enums as CoreEnums } from '@cornerstonejs/core'

// ─── Types ───────────────────────────────────────────────────────────────────
type NavTool   = 'WindowLevel' | 'Pan' | 'Zoom'
type DrawTool  = 'Length' | 'RectangleROI' | 'EllipticalROI'
type ActiveTool = NavTool | DrawTool

interface Info {
  slice: string
  total: string
  wl: string
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

    let cleanupResize: (() => void) | undefined

    ;(async () => {
      try {
        setStatus('Initialising Cornerstone3D…')
        await initCornerstone()
        initViewport(el)
        initTools()
        cleanupResize = setupResizeObserver(el)

        // Try to auto-load sample data from public/data/
        const n = await loadSampleData()
        if (n > 0) {
          setInfo(prev => ({ ...prev, slice: String(Math.floor(n / 2) + 1), total: String(n) }))
          setStatus(`Loaded ${n} sample images — scroll to navigate`)
        } else {
          setStatus('Ready — load DICOM files to begin')
        }

        setReady(true)
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    })()

    return () => { cleanupResize?.() }
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

  // ── Listen for W/L changes to display live values ─────────────────────────
  useEffect(() => {
    if (!ready || !viewportRef.current) return
    const el = viewportRef.current

    const handleVOI = (evt: Event) => {
      const { range } = (evt as CustomEvent).detail
      if (!range) return
      const W = Math.round(range.upper - range.lower)
      const L = Math.round((range.upper + range.lower) / 2)
      setInfo(prev => ({ ...prev, wl: `W ${W} / L ${L}` }))
    }

    el.addEventListener(CoreEnums.Events.VOI_MODIFIED, handleVOI)
    return () => el.removeEventListener(CoreEnums.Events.VOI_MODIFIED, handleVOI)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

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
          <button
            disabled={!ready}
            className={activeTool === 'EllipticalROI' ? 'active' : ''}
            onClick={() => handleDrawTool('EllipticalROI')}
          >
            Ellipse
          </button>
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

            {/*
             * Curiosity prompt — Slice info overlay
             * The slice counter is shown here in the sidebar. Could you also
             * render it as a text overlay directly on the canvas?
             * Hint: an absolutely-positioned <div> on top of viewport-wrapper.
             */}

            <div className="info-row">
              <span className="info-label">Window / Level</span>
              <span className="info-value">{info.wl === '--' ? '— drag to adjust —' : info.wl}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Patient</span>
              <span className="info-value">{info.patientName}</span>
            </div>

          </div>

          {/*
           * Curiosity prompt — Tool cursor
           * The active tool name is shown in the toolbar button.
           * Could you also change the CSS cursor on the viewport element
           * to give visual feedback — crosshair when drawing, move when panning?
           * Hint: viewportRef.current.style.cursor = '...'
           */}

          <div className="instructions">
            <strong>How to use:</strong><br />
            1. Click Load DICOM (or sample data loads automatically)<br />
            2. Scroll to navigate slices<br />
            3. Draw annotations with Length / Rect / Ellipse<br />
            4. Drag with W/L active to adjust brightness
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
