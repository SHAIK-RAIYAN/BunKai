// Matrix multiplication helper for PDF 2D affine transforms: [a, b, c, d, e, f]
function multiplyTransform(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

export interface ImageRect {
  x: number
  y: number
  width: number
  height: number
  isFullPage: boolean
}

/**
 * Inspects PDF.js OperatorList to extract all raster image bounding boxes in viewport coordinates.
 * Tracks CTM push/pop state (OPS.save/restore/transform) accurately.
 */
export function extractImageRectangles(
  operatorList: { fnArray: number[]; argsArray: any[] },
  viewportTransform: number[],
  pageWidth: number,
  pageHeight: number,
  OPS: Record<string, number>,
): ImageRect[] {
  const rects: ImageRect[] = []
  let ctm = [1, 0, 0, 1, 0, 0]
  const stack: number[][] = []

  const imageOps = new Set([
    OPS.paintImageXObject,
    OPS.paintInlineImageXObject,
    OPS.paintImageMaskXObject,
  ])

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i]
    const args = operatorList.argsArray[i]

    if (fn === OPS.save) {
      stack.push([...ctm])
    } else if (fn === OPS.restore) {
      if (stack.length > 0) {
        ctm = stack.pop()!
      }
    } else if (fn === OPS.transform) {
      // args: [a, b, c, d, e, f]
      ctm = multiplyTransform(ctm, args)
    } else if (imageOps.has(fn)) {
      // Image is placed in unit square [0, 0] to [1, 1] in current CTM space
      // Map corners through CTM then through viewportTransform
      const fullMatrix = multiplyTransform(viewportTransform, ctm)

      // Corners: (0,0), (1,0), (0,1), (1,1)
      const p0 = transformPoint(fullMatrix, 0, 0)
      const p1 = transformPoint(fullMatrix, 1, 0)
      const p2 = transformPoint(fullMatrix, 0, 1)
      const p3 = transformPoint(fullMatrix, 1, 1)

      const minX = Math.min(p0.x, p1.x, p2.x, p3.x)
      const maxX = Math.max(p0.x, p1.x, p2.x, p3.x)
      const minY = Math.min(p0.y, p1.y, p2.y, p3.y)
      const maxY = Math.max(p0.y, p1.y, p2.y, p3.y)

      const w = Math.max(0, maxX - minX)
      const h = Math.max(0, maxY - minY)

      // Skip microscopic decorative tiles or 0-size images
      if (w > 8 && h > 8) {
        const areaRatio = (w * h) / (pageWidth * pageHeight)
        rects.push({
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.round(w),
          height: Math.round(h),
          isFullPage: areaRatio > 0.85,
        })
      }
    }
  }

  return rects
}

function transformPoint(m: number[], x: number, y: number) {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
  }
}

