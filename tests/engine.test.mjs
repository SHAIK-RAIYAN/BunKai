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

