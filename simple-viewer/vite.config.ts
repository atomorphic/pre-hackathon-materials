import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: [
      'dicom-parser',
      '@cornerstonejs/codec-libjpeg-turbo-8bit > @cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
      '@cornerstonejs/codec-openjpeg > @cornerstonejs/codec-openjpeg/decodewasmjs',
      '@cornerstonejs/codec-charls > @cornerstonejs/codec-charls/decodewasmjs',
      '@cornerstonejs/codec-openjph > @cornerstonejs/codec-openjph/wasmjs',
    ],
  },
  worker: {
    format: 'es',
  },
})
