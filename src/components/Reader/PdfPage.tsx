import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { pdfjsLib } from '../../lib/pdfWorker'
import { extractImageRectangles, type ImageRect } from '../../lib/pdfImageDetector'
import type { PdfAppearanceMode, PdfImageTreatment } from '../../types'

interface PdfPageProps {
  pageNumber: number
  pdfDoc: PDFDocumentProxy
  scale: number
  appearanceMode: PdfAppearanceMode
  imageTreatment: PdfImageTreatment
  onDimensionsMeasured?: (pageNumber: number, width: number, height: number) => void
}

export function PdfPage({
  pageNumber,
  pdfDoc,
  scale,
  appearanceMode,
  imageTreatment,
  onDimensionsMeasured,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)

  const [isRendered, setIsRendered] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [imageRects, setImageRects] = useState<ImageRect[]>([])
  const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null)

  const renderTaskRef = useRef<RenderTask | null>(null)
  const textLayerTaskRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {}
          renderTaskRef.current = null
        }
        if (textLayerTaskRef.current) {
          try {
            textLayerTaskRef.current.cancel()
          } catch {}
          textLayerTaskRef.current = null
        }

        setIsRendered(false)
        setRenderError(null)

        const page = await pdfDoc.getPage(pageNumber)
        if (!isMountedRef.current) return

        const viewport = page.getViewport({ scale })

        setPageDims({ width: viewport.width, height: viewport.height })
        if (onDimensionsMeasured) {
          onDimensionsMeasured(pageNumber, viewport.width, viewport.height)
        }

        const canvas = canvasRef.current
        if (!canvas || !isMountedRef.current) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, viewport.width, viewport.height)

        const renderContext = {
          canvasContext: ctx,
          viewport,
          canvas,
        }

        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask

        if (appearanceMode === 'dark' && imageTreatment === 'preserve') {
          page.getOperatorList().then((opList) => {
            if (!isMountedRef.current) return
            const rects = extractImageRectangles(
              opList,
              viewport.transform,
              viewport.width,
              viewport.height,
              pdfjsLib.OPS,
            )
            setImageRects(rects)
          }).catch((err) => {
            console.warn(`OperatorList extraction failed for page ${pageNumber}:`, err)
          })
        } else {
          setImageRects([])
        }

        await renderTask.promise
        if (!isMountedRef.current) return
        setIsRendered(true)

        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = ''
          textLayerRef.current.style.width = `${Math.floor(viewport.width)}px`
          textLayerRef.current.style.height = `${Math.floor(viewport.height)}px`

          try {
            const textContentSource = await page.getTextContent()
            if (!isMountedRef.current) return

            const textLayer = new pdfjsLib.TextLayer({
              textContentSource,
              container: textLayerRef.current,
              viewport,
            })
            textLayerTaskRef.current = textLayer
            await textLayer.render()
          } catch (textErr: any) {
            if (textErr?.name !== 'RenderingCancelledException') {
              console.warn(`TextLayer error on page ${pageNumber}:`, textErr)
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return
        console.error(`Error rendering PDF page ${pageNumber}:`, err)
        if (isMountedRef.current) {
          setRenderError(`Could not render page ${pageNumber}`)
        }
      }
    }

    renderPage()

    return () => {
      isMountedRef.current = false
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
        renderTaskRef.current = null
      }
      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel()
        } catch {}
        textLayerTaskRef.current = null
      }
    }
  }, [pageNumber, pdfDoc, scale, appearanceMode, imageTreatment, onDimensionsMeasured])

  const isFullPageScan = imageRects.some((r) => r.isFullPage)
  const isDark = appearanceMode === 'dark'
  const filterStyle = isDark
    ? 'invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.92)'
    : 'none'

  return (
    <div
      ref={containerRef}
      data-page-number={pageNumber}
      className="relative mx-auto my-4 flex items-center justify-center transition-shadow select-text"
      style={{
        width: pageDims ? `${pageDims.width}px` : '100%',
        minHeight: pageDims ? `${pageDims.height}px` : '600px',
        backgroundColor: isDark ? '#141414' : '#ffffff',
        borderRadius: '6px',
        boxShadow: isDark
          ? '0px 0px 0px 1px rgba(255,255,255,0.06), 0px 4px 12px rgba(0,0,0,0.6)'
          : '0px 0px 0px 1px rgba(0,0,0,0.06), 0px 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="relative overflow-hidden rounded-[6px]"
        style={{
          width: pageDims ? `${pageDims.width}px` : '100%',
          height: pageDims ? `${pageDims.height}px` : 'auto',
          filter: filterStyle,
        }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {isDark && imageTreatment === 'preserve' && !isFullPageScan && imageRects.length > 0 && (
          <>
            {imageRects.map((rect, idx) => (
              <div
                key={`img-preserve-${idx}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backdropFilter: 'invert(1) hue-rotate(180deg)',
                  WebkitBackdropFilter: 'invert(1) hue-rotate(180deg)',
                }}
                title="Preserved Image"
              />
            ))}
          </>
        )}
      </div>

      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 pointer-events-auto"
        style={{
          width: pageDims ? `${pageDims.width}px` : '100%',
          height: pageDims ? `${pageDims.height}px` : 'auto',
        }}
      />

      {!isRendered && !renderError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 rounded-[6px]">
          <span className="text-xs font-mono opacity-40">Page {pageNumber}</span>
        </div>
      )}

      {renderError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs text-red-400">{renderError}</p>
        </div>
      )}
    </div>
  )
}
