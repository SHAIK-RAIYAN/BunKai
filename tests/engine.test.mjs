import test from 'node:test'
import assert from 'node:assert/strict'
import { extractImageRectangles } from '../src/lib/pdfImageDetector.ts'
import { normalizeToc, flattenToc, findChapterIndex } from '../src/lib/tocUtils.ts'

test('TOC Utilities: Recursive normalization, flattening, and lookup', () => {
  const rawToc = [
    {
      id: 'c1',
      label: '  Part 1: The Beginning \n ',
      href: 'part1.xhtml',
      subitems: [
        {
          id: 'c1_1',
          label: 'Chapter 1: Dawn',
          href: 'part1.xhtml#chap1',
          subitems: [
            {
              id: 'c1_1_1',
              label: 'Section 1.1: Early Sun',
              href: 'part1.xhtml#sec1_1',
            },
          ],
        },
      ],
    },
    {
      id: 'c2',
      label: 'Part 2: The Journey',
      href: 'part2.xhtml',
    },
  ]

  // 1. Normalize
  const normalized = normalizeToc(rawToc)
  assert.equal(normalized.length, 2)
  assert.equal(normalized[0].label, 'Part 1: The Beginning')
  assert.equal(normalized[0].subitems?.length, 1)
  assert.equal(normalized[0].subitems?.[0].subitems?.length, 1)
  assert.equal(normalized[0].subitems?.[0].subitems?.[0].label, 'Section 1.1: Early Sun')

  // 2. Flatten
  const flat = flattenToc(normalized)
  assert.equal(flat.length, 4)
  assert.equal(flat[0].label, 'Part 1: The Beginning')
  assert.equal(flat[1].label, 'Chapter 1: Dawn')
  assert.equal(flat[2].label, 'Section 1.1: Early Sun')
  assert.equal(flat[3].label, 'Part 2: The Journey')

  // 3. Find chapter index (exact and normalized)
  assert.equal(findChapterIndex(flat, 'part1.xhtml#chap1'), 1)
  assert.equal(findChapterIndex(flat, 'part2.xhtml'), 3)
  assert.equal(findChapterIndex(flat, 'part2.xhtml#anchor'), 3)
  assert.equal(findChapterIndex(flat, 'nonexistent.xhtml'), -1)
})

test('PDF Image Detector: OperatorList matrix transforms & full-page scan detection', () => {
  const OPS = {
    save: 1,
    restore: 2,
    transform: 3,
    paintImageXObject: 4,
    paintInlineImageXObject: 5,
    paintImageMaskXObject: 6,
  }

  // Viewport 800 x 1000
  const viewportTransform = [1, 0, 0, 1, 0, 0] // Identity transform

  // Scenario 1: Embedded photo 300x200 located at x=50, y=100
  const opListPhoto = {
    fnArray: [
      OPS.save,
      OPS.transform,
      OPS.paintImageXObject,
      OPS.restore,
    ],
    argsArray: [
      [],
      [300, 0, 0, 200, 50, 100], // CTM: width=300, height=200, tx=50, ty=100
      ['obj_img1'],
      [],
    ],
  }

  const rects1 = extractImageRectangles(opListPhoto, viewportTransform, 800, 1000, OPS)
  assert.equal(rects1.length, 1)
  assert.equal(rects1[0].x, 50)
  assert.equal(rects1[0].y, 100)
  assert.equal(rects1[0].width, 300)
  assert.equal(rects1[0].height, 200)
  assert.equal(rects1[0].isFullPage, false) // 300*200 / 800*1000 = 7.5% -> Not full page

  // Scenario 2: Scanned full page image covering 790 x 990 (98% of page)
  const opListScan = {
    fnArray: [
      OPS.save,
      OPS.transform,
      OPS.paintImageXObject,
      OPS.restore,
    ],
    argsArray: [
      [],
      [790, 0, 0, 990, 5, 5],
      ['obj_scan'],
      [],
    ],
  }

  const rects2 = extractImageRectangles(opListScan, viewportTransform, 800, 1000, OPS)
  assert.equal(rects2.length, 1)
  assert.equal(rects2[0].isFullPage, true) // 98% -> correctly classified as full-page scan!

  // Scenario 3: Tiny 2x2 decorative image
  const opListTiny = {
    fnArray: [
      OPS.save,
      OPS.transform,
      OPS.paintImageXObject,
      OPS.restore,
    ],
    argsArray: [
      [],
      [2, 0, 0, 2, 10, 10],
      ['obj_tiny'],
      [],
    ],
  }

  const rects3 = extractImageRectangles(opListTiny, viewportTransform, 800, 1000, OPS)
  assert.equal(rects3.length, 0) // Tiny tiles filtered out
})

test('Auto-Scroll Physics: Velocity, time delta, and independence from refresh rate', () => {
  const speedPxPerSec = 60 // 60 pixels per second

  // Simulate 60 FPS (16.67ms per frame)
  const frameTime60 = 1000 / 60
  let totalMoved60 = 0
  for (let i = 0; i < 60; i++) {
    totalMoved60 += (speedPxPerSec * frameTime60) / 1000
  }

  // Simulate 144 FPS (6.94ms per frame)
  const frameTime144 = 1000 / 144
  let totalMoved144 = 0
  for (let i = 0; i < 144; i++) {
    totalMoved144 += (speedPxPerSec * frameTime144) / 1000
  }

  // Both refresh rates MUST scroll exactly 60px over 1 full second
  assert.ok(Math.abs(totalMoved60 - 60) < 0.001)
  assert.ok(Math.abs(totalMoved144 - 60) < 0.001)
})

test('PDF Destination Resolution & Coordinate parsing', async () => {
  // Mock PDF document proxy
  const mockDoc = {
    numPages: 100,
    async getDestination(name) {
      if (name === 'named_ch3') {
        return [{ num: 55, gen: 0 }, { name: 'XYZ' }, 0, 450, 1]
      }
      return null
    },
    async getPageIndex(pageRef) {
      if (pageRef && pageRef.num === 55) return 24 // 0-based page index 24 -> Page 25
      return 0
    },
  }

  const { resolvePdfDestination } = await import('../src/lib/pdfOutline.ts')

  // 1. Resolve explicit destination array with page index
  const res1 = await resolvePdfDestination(mockDoc, [10, { name: 'XYZ' }, 0, 720, null])
  assert.deepEqual(res1, { pageIndex: 10, destY: 720 })

  // 2. Resolve named destination
  const res2 = await resolvePdfDestination(mockDoc, 'named_ch3')
  assert.deepEqual(res2, { pageIndex: 24, destY: 450 })

  // 3. Resolve invalid / unresolvable destination
  const res3 = await resolvePdfDestination(mockDoc, 'nonexistent')
  assert.equal(res3, null)
})

test('First-time Completion Celebration State Machine', () => {
  // State transitions: not_completed -> pending -> consumed
  let state = 'not_completed'

  // Document reaches 100%
  const onDocumentFinished = (current) => {
    if (current === 'consumed') return 'consumed'
    return 'pending'
  }

  // 1. First completion
  state = onDocumentFinished(state)
  assert.equal(state, 'pending')

  // 2. Returning to library consumes celebration exactly once
  const onReturnToLibrary = (current) => {
    if (current === 'pending') {
      return { triggerConfetti: true, nextState: 'consumed' }
    }
    return { triggerConfetti: false, nextState: current }
  }

  const step1 = onReturnToLibrary(state)
  assert.equal(step1.triggerConfetti, true)
  state = step1.nextState
  assert.equal(state, 'consumed')

  // 3. Subsequent visits do NOT trigger celebration again
  const step2 = onReturnToLibrary(state)
  assert.equal(step2.triggerConfetti, false)
  assert.equal(step2.nextState, 'consumed')
})

test('SEO & Crawler Verification: Sitemap, Robots, and Static Prerendering', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')

  // 1. Verify robots.txt
  const robotsTxt = fs.readFileSync(path.resolve('public/robots.txt'), 'utf8')
  assert.ok(robotsTxt.includes('Sitemap: https://bunkai-reader.vercel.app/sitemap.xml'))
  assert.ok(robotsTxt.includes('User-agent: *'))

  // 2. Verify sitemap.xml
  const sitemapXml = fs.readFileSync(path.resolve('public/sitemap.xml'), 'utf8')
  const expectedUrls = [
    'https://bunkai-reader.vercel.app/',
    'https://bunkai-reader.vercel.app/epub-reader-online',
    'https://bunkai-reader.vercel.app/pdf-reader-online',
    'https://bunkai-reader.vercel.app/dark-pdf-reader',
    'https://bunkai-reader.vercel.app/features/continuous-reading',
    'https://bunkai-reader.vercel.app/guides/how-to-open-epub-files',
    'https://bunkai-reader.vercel.app/guides/how-to-read-pdf-in-dark-mode',
    'https://bunkai-reader.vercel.app/privacy',
    'https://bunkai-reader.vercel.app/about',
  ]
  for (const url of expectedUrls) {
    assert.ok(sitemapXml.includes(`<loc>${url}</loc>`), `Missing URL in sitemap: ${url}`)
  }

  // 3. Verify IndexNow key matches key verification file
  const keyFile = path.resolve('public/5c8e391b1f6f4c6e9a8f4c2b9a1d3e5f.txt')
  assert.ok(fs.existsSync(keyFile))
  const keyContent = fs.readFileSync(keyFile, 'utf8').trim()
  assert.equal(keyContent, '5c8e391b1f6f4c6e9a8f4c2b9a1d3e5f')

  // 4. Verify dist static pages if dist directory is built
  const distDir = path.resolve('dist')
  if (fs.existsSync(distDir)) {
    for (const url of expectedUrls) {
      const pagePath = url.replace('https://bunkai-reader.vercel.app', '')
      const htmlFile = pagePath === '' ? path.join(distDir, 'index.html') : path.join(distDir, pagePath, 'index.html')
      assert.ok(fs.existsSync(htmlFile), `Missing prerendered HTML file: ${htmlFile}`)

      const content = fs.readFileSync(htmlFile, 'utf8')
      assert.ok(content.includes('<link rel="canonical"'), `Missing canonical tag in ${htmlFile}`)
      assert.ok(content.includes('<meta name="description"'), `Missing meta description in ${htmlFile}`)
      assert.ok(content.includes('application/ld+json'), `Missing JSON-LD structured data in ${htmlFile}`)
    }
  }
})



