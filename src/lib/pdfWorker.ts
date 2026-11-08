import * as pdfjsLib from 'pdfjs-dist'

// Vite natively bundles new URL(..., import.meta.url) into a static asset worker URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
}

export { pdfjsLib }
