# BunKai — Architectural Decision Record (ADR)

This document records the core architectural decisions made during the major upgrade of the BunKai reading platform.

---

## ADR 1: Independent Document Rendering Engines

### Context
BunKai was originally built exclusively around `epub.js`. The upgrade requirements called for adding comprehensive PDF reading capabilities while improving EPUB performance and memory efficiency.

### Decision
Do not force EPUB and PDF into a shared document rendering abstraction or unified DOM wrapper. Instead:
- Maintain independent document engine components (`Reader.tsx` for EPUB, `PdfReader.tsx` / `PdfPage.tsx` for PDF).
- Surround them with shared application infrastructure: document identification, IndexedDB storage, reading progress repository, auto-scrolling engine, sidebar table of contents, and application shell.
- Lazy-load engines dynamically via `React.lazy` and Vite manual chunk splitting.

### Consequences
- **Positive**: Clean separation of concerns. EPUB reflowable behavior is not polluted with PDF canvas logic. EPUB users do not pay the bundle or memory cost of PDF.js.
- **Trade-off**: Separate toolbar controls for format-specific actions (e.g. Zoom for PDF, Font Size for EPUB). Handled cleanly through the unified `SettingsPanel`.

---

## ADR 2: Content-Based Document Identification (Fingerprinting)

### Context
Documents cannot be reliably identified by filename alone (`book.pdf` vs `book.pdf`). Filenames can be duplicated or renamed across sessions.

### Decision
Compute a deterministic SHA-256 content fingerprint:
- For files <= 192KB: hash the entire buffer.
- For files > 192KB: sample the first 64KB, middle 64KB, last 64KB, and append the 64-bit integer file byte size.
- Fingerprint is computed asynchronously in <10ms without allocating full-sized buffers for large files.
- Duplicate detection checks the `documents` store by fingerprint before importing.

### Consequences
- Renamed files retain their reading progress.
- Different books with identical filenames have completely independent progress.
- Zero memory bloat during hashing.

---

## ADR 3: PDF Virtualization & Bounded Memory Architecture

### Context
A PDF document may contain hundreds or thousands of pages. Retaining rendered HTML `<canvas>` elements for every page causes severe memory pressure and browser tab crashes on mobile/desktop devices.

### Decision
- Use `@tanstack/react-virtual` to virtualize the vertical page list.
- Keep only visible pages and an overscan of 1 buffer page in the DOM.
- Offscreen pages render lightweight placeholders with estimated heights.
- Page height estimates are calculated from page 1 dimensions and updated as actual dimensions are measured.
- When a page unmounts or scrolls offscreen, in-flight PDF.js rendering tasks are cancelled immediately via `renderTask.cancel()`.
- Canvas resolution is capped at `min(window.devicePixelRatio, 2)`.

### Consequences
- Virtualizer makes scrolling responsive even for 1,000-page documents.
- Fast direct navigation (e.g., jump to page 847) scrolls directly to the target without rendering intermediate pages.

---

## ADR 4: PDF Dark Mode & Embedded Image Preservation

### Context
A global CSS `filter: invert(1)` applied to a PDF page turns embedded photographs, diagrams, and illustrations into negative ghosts.

### Decision
1. **Comfortable Dark Mode Curve**: Use `invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.92)` to transform paper-white `#ffffff` to low-glare `#121212` and black text to legible silver `#e0e0e0`.
2. **OperatorList Image Extraction**:
   - Inspect PDF.js `page.getOperatorList()` for raster image opcodes (`paintImageXObject`, `paintInlineImageXObject`, `paintImageMaskXObject`).
   - Track 2D affine transformation matrices across `OPS.save`, `OPS.transform`, and `OPS.restore` calls.
   - Project unit square image coordinates through `viewport.transform` to determine exact bounding boxes on the canvas.
3. **Image Preservation Overlay**:
   - For regular mixed documents, apply `backdrop-filter: invert(1) hue-rotate(180deg)` over detected image rectangles. This cancels the canvas inversion and renders images in their authentic, unaltered colors.
4. **Scanned Page Fallback**:
   - When an image covers >85% of the page area, the page is classified as a scanned document.
   - For scanned pages, image re-inversion is bypassed so that scanned text is not converted back to white paper.

### Consequences
- Embedded photos and diagrams maintain natural colors while surrounding text is dark.
- Scanned documents remain comfortable to read without inverted text artifacts.

---

## ADR 5: Unified Velocity-Driven Auto-Scroll Engine

### Context
Auto-scrolling must feel natural, smooth, and predictable across all monitor refresh rates (60Hz, 120Hz, 144Hz, 240Hz).

### Decision
- Single authoritative `requestAnimationFrame` loop operating on the native scroll container.
- Motion is strictly time-elapsed: `deltaY = (velocity * deltaMs) / 1000`.
- Frame deltas are clamped to 100ms max to prevent leaping forward if the browser tab is backgrounded.
- 200ms linear acceleration ramp on start.
- Instant user interruptibility: mouse wheel, touch gestures, pointer down, or text selection instantly pause auto-scrolling.

---

## ADR 6: Complete Reading Persistence Layer

### Context
Previous persistence only saved chapter hrefs for EPUB into `localStorage` and single-book `idb-keyval` without document keys.

### Decision
- Unified versioned IndexedDB database (`bunkai_storage`, version 1) with `documents` and `progress` object stores.
- EPUB: Saves exact CFI, chapter href, and percentage.
- PDF: Saves exact page number, intra-page normalized scroll offset ratio, and zoom level.
- Debounced saving (300ms) during active scrolling + synchronous flushes on `pagehide` and `visibilitychange`.
- Automatic migration path for legacy single-book storage.

