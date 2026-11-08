import test from 'node:test'
import assert from 'node:assert/strict'
import { computeDocumentFingerprint, detectDocumentFormat } from '../src/lib/fingerprint.ts'

test('Document Fingerprint & Format Detection', async () => {
  // 1. PDF Buffer with %PDF- magic bytes
  const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 0x0A])
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

  const pdfFormat = await detectDocumentFormat(pdfBlob, 'sample.pdf')
  assert.equal(pdfFormat, 'pdf')

  // 2. EPUB Buffer with PK\x03\x04 zip header
  const epubBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00])
  const epubBlob = new Blob([epubBytes], { type: 'application/epub+zip' })

  const epubFormat = await detectDocumentFormat(epubBlob, 'novel.epub')
  assert.equal(epubFormat, 'epub')

  // 3. Content Fingerprinting: identical bytes produce identical hash
  const hash1 = await computeDocumentFingerprint(pdfBlob)
  const hash2 = await computeDocumentFingerprint(new Blob([pdfBytes]))
  assert.equal(hash1, hash2)
  assert.equal(typeof hash1, 'string')
  assert.equal(hash1.length, 64) // SHA-256 is 64 hex characters

  // 4. Different content produces different hash
  const differentBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x32, 0x2E, 0x30, 0x0A])
  const diffHash = await computeDocumentFingerprint(new Blob([differentBytes]))
  assert.notEqual(hash1, diffHash)

  // 5. Unsupported file format returns null
  const txtBlob = new Blob(['Hello World text file'], { type: 'text/plain' })
  const unknownFormat = await detectDocumentFormat(txtBlob, 'notes.txt')
  assert.equal(unknownFormat, null)
})

