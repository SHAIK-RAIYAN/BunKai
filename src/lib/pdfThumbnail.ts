import { pdfjsLib } from './pdfWorker'

const thumbnailQueue: Array<() => Promise<void>> = []
let isProcessingQueue = false

async function processQueue() {
  if (isProcessingQueue || thumbnailQueue.length === 0) return
  isProcessingQueue = true
  const nextTask = thumbnailQueue.shift()
  if (nextTask) {
    try {
      await nextTask()
    } catch (e) {
      console.warn('Thumbnail generation task error:', e)
    }
  }
  isProcessingQueue = false
  if (thumbnailQueue.length > 0) {
    setTimeout(processQueue, 50)
  }
}

/**
 * Lazily generates a small, crisp thumbnail data URL for a PDF file from Page 1.
 * Queued to execute one-at-a-time to protect main thread and memory.
 */
export function generatePdfThumbnail(pdfBlob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    thumbnailQueue.push(async () => {
      let loadingTask: any = null
      try {
        const buffer = await pdfBlob.arrayBuffer()
        loadingTask = pdfjsLib.getDocument({
          data: buffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/standard_fonts/',
        })

        const pdfDoc = await loadingTask.promise
        const page = await pdfDoc.getPage(1)

        const unscaledViewport = page.getViewport({ scale: 1.0 })
        // Target thumbnail width around 180px
        const targetWidth = 180
        const scale = targetWidth / unscaledViewport.width
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) {
          resolve(null)
          return
        }

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      } catch (err) {
        console.warn('Failed to generate PDF thumbnail:', err)
        resolve(null)
      } finally {
        if (loadingTask) {
          try {
            loadingTask.destroy()
          } catch {}
        }
      }
    })

    processQueue()
  })
}
