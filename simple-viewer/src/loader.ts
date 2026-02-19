// =============================================================================
// DICOM file loading
// =============================================================================

import { type Types } from '@cornerstonejs/core'
import * as dicomLoader from '@cornerstonejs/dicom-image-loader'
import { getRenderingEngine, VIEWPORT_ID } from './cornerstone'

let imageIds: string[] = []

export function getImageIds() { return imageIds }

// Load File objects into the viewport
export async function loadDicomFiles(
  files: File[],
  onProgress?: (loaded: number, total: number) => void
): Promise<number> {
  if (files.length === 0) return 0

  imageIds = []
  for (const file of files) {
    if (file.name.endsWith('.dcm') || !file.name.includes('.')) {
      const id = dicomLoader.wadouri.fileManager.add(file)
      imageIds.push(id)
    }
  }

  if (imageIds.length === 0) return 0

  const re = getRenderingEngine()
  const vp = re.getViewport(VIEWPORT_ID) as Types.IStackViewport
  const mid = Math.floor(imageIds.length / 2)

  onProgress?.(0, imageIds.length)
  await vp.setStack(imageIds, mid)
  vp.render()
  onProgress?.(imageIds.length, imageIds.length)

  return imageIds.length
}

export function getCurrentSliceIndex(): number {
  const re = getRenderingEngine()
  if (!re) return 0
  const vp = re.getViewport(VIEWPORT_ID) as Types.IStackViewport
  return vp?.getCurrentImageIdIndex() ?? 0
}
