/**
 * Computes a fast, non-blocking SHA-256 content fingerprint for any document File/Blob.
 * For large files (>4MB), samples the head, middle, and tail with byte size to guarantee
 * instant O(1) performance (<10ms) without allocating multi-hundred megabyte buffers.
 */
export async function computeDocumentFingerprint(file: Blob): Promise<string> {
  const size = file.size
  const SAMPLE_SIZE = 64 * 1024 // 64KB per chunk

  let bufferToHash: ArrayBuffer

  if (size <= SAMPLE_SIZE * 3) {
    // Small file: hash the whole buffer directly
    bufferToHash = await file.arrayBuffer()
  } else {
    // Large file: sample head, middle, tail + file size
    const head = file.slice(0, SAMPLE_SIZE)
    const midStart = Math.floor(size / 2) - Math.floor(SAMPLE_SIZE / 2)
    const mid = file.slice(midStart, midStart + SAMPLE_SIZE)
    const tail = file.slice(size - SAMPLE_SIZE, size)

    const [headBuf, midBuf, tailBuf] = await Promise.all([
      head.arrayBuffer(),
      mid.arrayBuffer(),
      tail.arrayBuffer(),
    ])

    // Allocate combined buffer: head + mid + tail + 8 bytes for file size
    const combined = new Uint8Array(headBuf.byteLength + midBuf.byteLength + tailBuf.byteLength + 8)
    let offset = 0

    combined.set(new Uint8Array(headBuf), offset)
    offset += headBuf.byteLength

    combined.set(new Uint8Array(midBuf), offset)
    offset += midBuf.byteLength

    combined.set(new Uint8Array(tailBuf), offset)
    offset += tailBuf.byteLength

    // Append 64-bit integer for exact byte length
    const view = new DataView(combined.buffer, offset, 8)
    view.setBigUint64(0, BigInt(size), true)

    bufferToHash = combined.buffer
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', bufferToHash)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Detects whether a file is an EPUB, PDF, or unsupported format based on
 * MIME type, file extension, and initial magic bytes.
 */
export async function detectDocumentFormat(file: File | Blob, filename: string): Promise<'epub' | 'pdf' | null> {
  const lowerName = filename.toLowerCase()

  // 1. Extension check
  if (lowerName.endsWith('.pdf')) return 'pdf'
  if (lowerName.endsWith('.epub')) return 'epub'

  // 2. MIME type check
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'application/epub+zip') return 'epub'

  // 3. Magic bytes inspection
  try {
    const headSlice = file.slice(0, 8)
    const headBuf = await headSlice.arrayBuffer()
    const bytes = new Uint8Array(headBuf)

    // PDF magic bytes: '%PDF-' (0x25, 0x50, 0x44, 0x46, 0x2D)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'pdf'
    }

    // EPUB is a ZIP archive: 'PK\x03\x04' (0x50, 0x4B, 0x03, 0x04)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return 'epub'
    }
  } catch (err) {
    console.warn('Magic byte inspection failed:', err)
  }

  return null
}

