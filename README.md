# BunKai 📚
### Unified Local-First EPUB & PDF Reading Platform

> A high-performance, local-first reading application supporting both **EPUB** and **PDF** formats with specialized rendering engines, virtualized continuous scrolling, advanced PDF dark mode with embedded image preservation, unified auto-scroll, exact reading-position restoration, and a refined neutral monochrome interface.

🌐 **Live Production URL:** [https://bunkai-reader.vercel.app/](https://bunkai-reader.vercel.app/)

---

## 🌟 Major Capabilities & Architectural Highlights

### 1. Dual-Engine Architecture
BunKai separates document rendering into independent, format-specialized engines rather than forcing them into awkward shared abstractions:
- **EPUB Engine (`epub.js`)**: Reflowable content with dual reading modes:
  - **Paginated Mode (Mode A)**: Column-based reading with keyboard arrow navigation, chapter jump, and page spread indication.
  - **Continuous Vertical Mode (Mode B)**: Seamless vertical scrolling between chapters with bounded active sections.
  - Zero-teardown theme and typography updates: font size, font family, line height, and theme apply in-place without reallocating Rendition or Book instances.
- **PDF Engine (Mozilla `pdfjs-dist`)**: Fixed-layout documents rendered inside BunKai's native interface:
  - Worker-based parsing isolated from the main UI thread.
  - Page list virtualization powered by `@tanstack/react-virtual`.
  - Bounded memory footprint: only visible pages and 1 buffer page are rendered.
  - Rendering cancellation: in-flight `RenderTask` promises cancel immediately when pages scroll out of view.
  - Device-pixel-ratio cap (`dpr = min(devicePixelRatio, 2)`) prevents GPU memory exhaustion on 3x/4x mobile and Retina screens.

### 2. PDF Dark Mode & Image Preservation Pipeline
- **Original Appearance**: Authentic authored colors.
- **Dark Reading Appearance**: Soft, high-contrast dark palette (`#121212` background, `#e0e0e0` text) designed to eliminate eye strain during night reading.
- **Dark Mode with Image Preservation**:
  - Automatically inspects the PDF.js `OperatorList` (`paintImageXObject`, `paintInlineImageXObject`).
  - Tracks the 2D affine Current Transformation Matrix (CTM) through `save`, `transform`, and `restore` state stacks.
  - Maps bounding boxes to viewport pixel coordinates and applies targeted optical re-inversion filters (`backdrop-filter: invert(1) hue-rotate(180deg)`) over raster images.
  - **True colors**: Embedded photographs, artwork, and diagrams display in their 100% original, rich colors while text and page whitespace remain comfortable dark grey.
  - **Honest Scanned Document Fallback**: Automatically calculates the image-to-page area ratio. Pages where a single scan occupies >85% of the surface are detected and treated with a comfortable luminance curve rather than corrupting scanned text.

### 3. Unified Auto-Scrolling Engine
- Authoritative single `requestAnimationFrame` loop on native document scrolling containers.
- Velocity-driven (`deltaY = velocity * deltaMs / 1000`): scrolls at consistent physical speed (pixels per second) regardless of display refresh rate (60Hz, 120Hz, 144Hz, 240Hz).
- Resilient time clamping: clamps frame deltas to 100ms max to prevent leaping forward after tab suspension.
- Instant user interruptibility: immediately pauses on mouse wheel, touch gestures, pointer down, text selection, or document end.
- Floating HUD pill with live speed presets (Slow, Normal, Brisk, Fast) and fine-grained slider (10 to 200 px/s).

### 4. Local-First Library & Exact Position Restoration
- **Content Fingerprinting**: Instant O(1) SHA-256 fingerprinting (<10ms) samples head, mid, tail, and byte size, ensuring reliable document identity without allocating huge buffers in memory.
- **Duplicate Detection**: Uploading or dropping an existing document immediately opens and resumes it instead of duplicating storage.
- **Exact Position Restoration**:
  - **EPUB**: Restores exact CFI location, chapter href, and reading percentage.
  - **PDF**: Restores exact page number, normalized intra-page scroll ratio, and zoom level.
- **Safe Debounced Persistence**: 300ms debounced saves during reading + immediate synchronous flushes on `pagehide` and `visibilitychange`.

### 5. Design Engineering & Refinement
Built according to Emil Kowalski, Impeccable, and modern design engineering standards:
- **Typography & Motion**:
  - Migrated completely to `motion/react`.
  - Dynamic numbers powered by `@number-flow/react` with `tabular-nums` to eliminate layout shift.
  - Contextual Lucide Animated icons with Motion hover and press micro-interactions.
  - 150–240ms ease-out transitions (`cubic-bezier(0.23, 1, 0.32, 1)`), tactile button presses (`active:scale-[0.97]`).
  - Concentric border radii and Beautiful Shadows layered elevation.

### 5. Immersive Distraction-Free Reading Mode
- **Full Viewport Immersion**: Strips away headers, sidebars, and peripheral UI so the document commands 100% of the display.
- **Minimal Discrete Floating Controls**: A subtle floating trigger button dims during reading and reveals on hover/tap, offering quick access to reading settings.
- **Predictable Escape Priority**: Pressing `Escape` smoothly closes the active settings popover first, or exits immersive mode back to the standard workspace.
- **Browser Fullscreen Support**: Smoothly integrates with `requestFullscreen` when supported by the device, maintaining an edge-to-edge layout if permissions are withheld.

### 6. Accurate Reading Progress, Active Time & Celebration
- **Accurate EPUB Percentage**: Combines background byte-level location generation (`locations.percentageFromCfi`) with spine item interpolation to guarantee real progress increments both within and across chapters.
- **Active Foreground Reading Time**: Tracks actual focused reading time in seconds, excluding backgrounded tabs, idle periods, or minimized windows.
- **First-Completion Confetti Celebration**: When a document is finished for the first time, an IndexedDB state machine marks `celebrationState = 'pending'`. Upon returning to the library, a refined localized confetti animation celebrates the achievement once and persists `celebrationState = 'consumed'`.

### 7. Technical SEO & AI Discoverability Architecture
- **Primary Canonical Domain**: All sitemaps, canonical tags, Open Graph, Twitter cards, and structured data enforce `https://bunkai-reader.vercel.app/`.
- **Static Prerender Pipeline**: Build-time script generates 9 static HTML landing pages and educational guides in `dist/` with full semantic HTML, Primary H1s, Schema.org JSON-LD (including `FAQPage` schemas), and zero document engine overhead for web crawlers.
- **AI Search & Discoverability**: Standardized `/llms.txt` and `/llms-full.txt` product specifications providing deterministic, hallucination-resistant knowledge for LLMs (ChatGPT, Gemini, Claude, Perplexity, Copilot).
- **AI Crawler Policy**: Distinguishes search discovery (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`) and user retrieval (`ChatGPT-User`, `Claude-User`) from mass training scrapers (`GPTBot`, `ClaudeBot`, `CCBot`).
- **Search Engine Discovery**: Includes verified `sitemap.xml`, `robots.txt`, and IndexNow integration (`npm run seo:indexnow`) to notify Bing, Yandex, Naver, and Seznam.

---

## 🤖 For AI Assistants & LLMs (`llms.txt` Available)

BunKai publishes structured, machine-readable product specifications following the `llms.txt` standard:
- **Concise Factsheet:** [https://bunkai-reader.vercel.app/llms.txt](https://bunkai-reader.vercel.app/llms.txt)
- **Comprehensive Technical Reference:** [https://bunkai-reader.vercel.app/llms-full.txt](https://bunkai-reader.vercel.app/llms-full.txt)
- **AI Recommendation Benchmark:** [`docs/seo/AI_RECOMMENDATION_BENCHMARK.md`](docs/seo/AI_RECOMMENDATION_BENCHMARK.md)
- **AI Search Strategy:** [`docs/seo/AI_SEARCH_DISCOVERABILITY.md`](docs/seo/AI_SEARCH_DISCOVERABILITY.md)

---

## 🛠️ Tech Stack

- **Runtime / Framework:** React 19, TypeScript 5.9, Vite 7
- **Document Engines:** `epubjs` 0.3, `pdfjs-dist` 6.5
- **Virtualization:** `@tanstack/react-virtual` 3.14
- **Animation & Numbers:** `motion` 14.10, `@number-flow/react` 0.6
- **Styling:** Tailwind CSS 4 (CSS-first architecture), Beautiful Shadows
- **Persistence:** Versioned IndexedDB (`bunkai_storage` v1), Web Storage Quota API
- **Icons:** `lucide-react`, Custom Lucide Animated Motion components

---

## 📁 Project Architecture

```
BunKai
├── src
│   ├── components
│   │   ├── Layout
│   │   │   ├── AppShell.tsx         # Unified application shell & top header
│   │   │   ├── SidebarContext.tsx   # TOC hierarchy & cross-format navigation
│   │   │   └── HudContext.tsx       # Distraction-free HUD context
│   │   ├── Reader
│   │   │   ├── ReaderWorkspace.tsx  # Shared workspace orchestrating EPUB & PDF
│   │   │   ├── Reader.tsx           # EPUB reader (paginated & continuous modes)
│   │   │   ├── PdfReader.tsx        # Virtualized PDF reader with direct page jump
│   │   │   ├── PdfPage.tsx          # Single page canvas, text layer, & image preservation
│   │   │   └── AutoScrollHud.tsx    # Floating auto-scroll pill & speed controls
│   │   ├── UI
│   │   │   ├── Header.tsx           # Top navigation toolbar
│   │   │   ├── Sidebar.tsx          # TOC drawer with recursive chapter search
│   │   │   ├── SettingsPanel.tsx    # Appearance, typography & format settings
│   │   │   ├── DynamicNumber.tsx    # NumberFlow tabular animated number wrapper
│   │   │   ├── SmoothScroll.tsx     # Managed Lenis utility with safe rAF cleanup
│   │   │   └── Icons/index.tsx      # Motion-powered Lucide Animated icons
│   │   └── Views
│   │       └── LibraryView.tsx      # Multi-document library, drag & drop, search
│   ├── context
│   │   ├── ThemeContext.tsx         # Reading preferences & global theme state
│   │   └── ToastContext.tsx         # Notification system
│   ├── hooks
│   │   ├── useAutoScroll.ts         # High-precision rAF velocity scrolling hook
│   │   └── usePersistence.ts        # IndexedDB document & reading progress repository
│   ├── lib
│   │   ├── db.ts                    # Versioned IndexedDB schema, migration, quota
│   │   ├── fingerprint.ts           # SHA-256 content hasher & magic-byte format detector
│   │   ├── epubParser.ts            # Fast metadata, cover & recursive TOC parser
│   │   ├── pdfWorker.ts             # PDF.js worker bundler pipeline
│   │   ├── pdfImageDetector.ts      # OperatorList CTM matrix transformation pipeline
│   │   └── tocUtils.ts              # Recursive normalization & linear TOC search
│   ├── types
│   │   └── index.ts                 # Shared document, reader settings, & progress types
│   ├── App.tsx                      # Root application router
│   ├── index.css                    # Tailwind 4, text balancing, PDF text selection layer
│   └── main.tsx                     # Entry point
├── tests
│   ├── engine.test.mjs              # TOC, PDF matrix detection, auto-scroll physics tests
│   └── fingerprint.test.mjs         # Document fingerprinting & magic bytes tests
├── ARCHITECTURE.md                  # Detailed architectural decision record
├── vite.config.ts                   # Manual chunk splitting & PWA configuration
└── package.json
```

---

## ⚡ Code Splitting & Performance Budget

Vite is configured with chunk isolation to guarantee minimal initial payload:
- **`index-*.js`**: ~250 kB (Application shell + document library)
- **`epub-engine-*.js`**: ~350 kB (Lazy-loaded only when an EPUB document opens)
- **`pdf-engine-*.js`**: ~450 kB (Lazy-loaded only when a PDF document opens)
- **`pdf.worker.min-*.mjs`**: ~1.2 MB (Isolated web worker)

Users opening an EPUB book download 0 kB of PDF.js code.

---

## 🚀 Development & Build Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit & engine verification tests
npm test

# Run ESLint validation
npm run lint

# Compile production build with SEO prerendered pages
npm run build

# Submit canonical URLs to IndexNow (Bing, Yandex, Naver)
npm run seo:indexnow

# Preview production build locally
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Escape` | Close settings panel / Exit immersive reading mode |
| `Arrow Right` / `Page Down` | Next page (EPUB paginated mode) |
| `Arrow Left` / `Page Up` | Previous page (EPUB paginated mode) |
| `Alt + Down` / `Page Down` | Jump to next page (PDF mode) |
| `Alt + Up` / `Page Up` | Jump to previous page (PDF mode) |
| `Home` / `End` | Jump to first / last page (PDF mode) |
| `Alt + Up` / `Page Up` | Jump to previous page (PDF mode) |
| `Home` / `End` | Jump to first / last page (PDF mode) |

---

## 👤 Author

**SHAIK RAIYAN**
- GitHub: [@SHAIK-RAIYAN](https://github.com/SHAIK-RAIYAN)
- LinkedIn: [in/shaik-raiyan](https://www.linkedin.com/in/shaik-raiyan)

Built for readers who value performance, memory efficiency, and the distraction-free joy of reading.
