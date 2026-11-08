import fs from 'node:fs'
import path from 'node:path'

const DIST_DIR = path.resolve('dist')
const PUBLIC_DIR = path.resolve('public')
const BASE_URL = 'https://bunkai-reader.vercel.app'

// Common CSS style block for fast first paint on crawlable shells
const CRITICAL_CSS = `
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #0c0c0e;
    color: #e4e4e7;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .seo-container {
    max-width: 920px;
    margin: 0 auto;
    padding: 3rem 1.5rem 6rem;
  }
  .seo-header {
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 2rem;
    margin-bottom: 2.5rem;
  }
  .seo-logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #ffffff;
    font-weight: 700;
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }
  h1 {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.25;
    color: #ffffff;
    margin: 0 0 1rem;
    letter-spacing: -0.025em;
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #f4f4f5;
    margin: 2.5rem 0 1rem;
    letter-spacing: -0.02em;
  }
  h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: #e4e4e7;
    margin: 1.5rem 0 0.5rem;
  }
  p {
    margin: 0 0 1.25rem;
    color: #a1a1aa;
    font-size: 1.05rem;
  }
  p.lead {
    font-size: 1.2rem;
    color: #d4d4d8;
    line-height: 1.7;
  }
  ul, ol {
    margin: 0 0 1.5rem 1.5rem;
    color: #a1a1aa;
    font-size: 1.05rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
  strong {
    color: #f4f4f5;
  }
  code {
    background: rgba(255,255,255,0.08);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9em;
    color: #e4e4e7;
  }
  .seo-cta-box {
    margin: 2.5rem 0;
    padding: 2rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    text-align: center;
  }
  .seo-cta-btn {
    display: inline-block;
    background: #ffffff;
    color: #0c0c0e;
    font-weight: 600;
    padding: 0.75rem 1.75rem;
    border-radius: 9999px;
    text-decoration: none;
    margin-top: 1rem;
    transition: opacity 0.15s;
  }
  .seo-cta-btn:hover {
    opacity: 0.9;
  }
  .seo-footer {
    border-top: 1px solid rgba(255,255,255,0.1);
    margin-top: 4rem;
    padding-top: 2rem;
    font-size: 0.9rem;
    color: #71717a;
  }
  .seo-nav-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
  }
  .seo-nav-links a {
    color: #a1a1aa;
    text-decoration: none;
  }
  .seo-nav-links a:hover {
    color: #ffffff;
  }
  .seo-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(255,255,255,0.1);
    color: #d4d4d8;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
`

const PAGES = [
  {
    path: '',
    title: 'BunKai — Free Online EPUB & PDF Reader (In-Browser & Private)',
    description:
      'Read EPUB and PDF documents online with BunKai. Featuring PDF dark mode with true image preservation, continuous EPUB scrolling, auto-scroll, and 100% private in-browser reading.',
    h1: 'The Modern, Private Online EPUB & PDF Reader',
    badge: '100% Client-Side • Zero Uploads',
    contentHtml: `
      <p class="lead">
        BunKai is a distraction-free, local-first reading application built for books, research papers, and technical documents. Open <strong>.epub</strong> and <strong>.pdf</strong> files directly in your web browser with zero server uploads, complete offline support, and refined typography.
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Open and Read Your Documents Instantly</h2>
        <p>Drag and drop your book or PDF below. All rendering, caching, and bookmarking happen locally on your device.</p>
        <a href="/" class="seo-cta-btn">Open BunKai Reader</a>
      </div>

      <h2>Engineered for Serious Readers</h2>
      <ul>
        <li><strong>Dual-Engine Architecture:</strong> Format-specialized engines for reflowable EPUB (epub.js) and fixed-layout PDF (Mozilla PDF.js) without forced compromises.</li>
        <li><strong>PDF Dark Mode with Image Preservation:</strong> Reads PDF operator lists to transform page text into soft dark mode while displaying photos, illustrations, and charts in their 100% authentic colors.</li>
        <li><strong>Continuous & Paginated EPUB Modes:</strong> Switch seamlessly between traditional page flips and infinite vertical scrolling across chapter boundaries.</li>
        <li><strong>Velocity-Driven Auto-Scroll:</strong> Hands-free reading calibrated in exact pixels per second, independent of display refresh rate (60Hz, 120Hz, 144Hz, 240Hz).</li>
        <li><strong>True Document Privacy:</strong> Documents are stored in your browser's private IndexedDB. Files are never uploaded to any remote server or cloud service.</li>
        <li><strong>Instant Position Restoration:</strong> Remembers your exact reading location, percentage, and active reading time across browser reboots.</li>
      </ul>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'BunKai',
          url: 'https://bunkai-reader.vercel.app/',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'All (Web Browser)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description:
            'A unified local-first EPUB and PDF reading application with PDF dark mode, continuous scrolling, auto-scroll, and local persistence.',
        },
        {
          '@type': 'WebSite',
          name: 'BunKai Reader',
          url: 'https://bunkai-reader.vercel.app/',
        },
      ],
    },
  },
  {
    path: 'epub-reader-online',
    title: 'Free Online EPUB Reader | Read EPUB in Your Browser — BunKai',
    description:
      'Open and read EPUB files online with BunKai. Enjoy paginated and continuous vertical scrolling modes, custom typography, OLED dark themes, and offline local resume.',
    h1: 'Free Online EPUB Reader — Read Ebooks in Any Browser',
    badge: 'Reflowable EPUB Engine',
    contentHtml: `
      <p>
        BunKai provides a high-performance web-based EPUB reader that works instantly in Chrome, Firefox, Safari, Edge, and mobile browsers. No software installation, no sign-ups, and no cloud uploads required.
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Read Your EPUB Books Now</h2>
        <p>Drop any .epub file to begin reading with chapter navigation and customizable themes.</p>
        <a href="/" class="seo-cta-btn">Launch EPUB Reader</a>
      </div>

      <h2>Two Distinct Reading Modes</h2>
      <p>Every reader has different preferences. BunKai lets you switch between two modes with a single click:</p>
      <ul>
        <li><strong>Paginated Mode (Mode A):</strong> Classic book experience with keyboard arrow navigation, page count indicators, and zero layout shift.</li>
        <li><strong>Continuous Vertical Mode (Mode B):</strong> Infinite scrolling across chapters without clicking 'Next Chapter'. Reads smoothly like a long-form article.</li>
      </ul>

      <h2>Typography & OLED Themes</h2>
      <p>
        Customize font size, font family (Inter, Charter, Georgia, Merriweather, Helvetica), and line height in real-time. Switch between <strong>OLED Black (#000000)</strong>, <strong>Charcoal Dark (#111111)</strong>, and <strong>Paper Light (#fdfbf7)</strong> without re-rendering or losing your reading position.
      </p>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BunKai Online EPUB Reader',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web Browser',
      url: 'https://bunkai-reader.vercel.app/epub-reader-online',
      description: 'Free browser-based EPUB reader with continuous scrolling, paginated mode, and OLED themes.',
    },
  },
  {
    path: 'pdf-reader-online',
    title: 'Free Online PDF Reader | Virtualized In-Browser PDF Viewer — BunKai',
    description:
      'Fast, memory-efficient PDF reader in your browser. Continuous scrolling, outline navigation, zoom, and text selection with zero file uploads.',
    h1: 'Online PDF Reader — Fast, Virtualized & Private',
    badge: 'Mozilla PDF.js Engine',
    contentHtml: `
      <p>
        Experience native document reading in your browser with BunKai's virtualized PDF engine. Built with Mozilla PDF.js, it handles large documents with smooth 60fps scrolling and bounded memory consumption.
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Open Any PDF Document</h2>
        <p>Fast worker-based parsing with direct page jump, zoom, and table of contents navigation.</p>
        <a href="/" class="seo-cta-btn">Open PDF Viewer</a>
      </div>

      <h2>Why BunKai is Better for Long PDFs</h2>
      <ul>
        <li><strong>Virtual Page Rendering:</strong> Powered by <code>@tanstack/react-virtual</code>, BunKai only allocates canvases for currently visible pages, preventing browser memory crashes on 500+ page documents.</li>
        <li><strong>Immediate Render Cancellation:</strong> Scrolling rapidly cancels offscreen render tasks immediately, preventing UI stutter.</li>
        <li><strong>Document Outline & Bookmarks:</strong> Deep hierarchical table of contents navigation directly takes you to sections and intra-page destination coordinates.</li>
        <li><strong>DPR Memory Cap:</strong> Capped at 2x Device Pixel Ratio to protect mobile and 4K displays from GPU memory exhaustion.</li>
      </ul>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BunKai Online PDF Viewer',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web Browser',
      url: 'https://bunkai-reader.vercel.app/pdf-reader-online',
      description: 'Virtualized web PDF reader with continuous scrolling and bounded memory.',
    },
  },
  {
    path: 'dark-pdf-reader',
    title: 'Dark Mode PDF Reader | Read PDF in True Dark Mode — BunKai',
    description:
      'Read PDFs in dark mode without inverting images. BunKai optical pipeline preserves photos and diagrams in authentic colors while darkening text and paper.',
    h1: 'Dark Mode PDF Reader — Invert PDF Colors While Preserving Images',
    badge: 'Optical Image-Preservation Pipeline',
    contentHtml: `
      <p>
        Traditional PDF dark mode extensions apply a blanket CSS <code>invert()</code> filter that turns photos, diagrams, and medical charts into unrecognizable negatives. BunKai solves this with a specialized rendering pipeline.
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Try Dark Mode on Your PDF</h2>
        <p>Enjoy comfortable night reading with authentic photo colors and high-contrast text.</p>
        <a href="/" class="seo-cta-btn">Launch Dark PDF Reader</a>
      </div>

      <h2>How BunKai Preserves Image Colors</h2>
      <p>
        BunKai inspects the PDF.js <code>OperatorList</code> to track affine Current Transformation Matrix (CTM) states during canvas drawing. When a raster image (<code>paintImageXObject</code>) is detected, BunKai calculates its precise viewport coordinates and applies targeted optical re-inversion:
      </p>
      <ul>
        <li><strong>Text & Background:</strong> Transformed into comfortable, low-glare dark tones (<code>#121212</code> background, <code>#e0e0e0</code> text).</li>
        <li><strong>Embedded Photographs & Diagrams:</strong> Retain 100% of their original, authentic RGB colors.</li>
        <li><strong>Scanned Document Fallback:</strong> Automatically measures image coverage. Pages where a scan covers >85% of the surface are treated with a comfortable luminance curve rather than corrupting text readability.</li>
      </ul>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BunKai Dark Mode PDF Reader',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web Browser',
      url: 'https://bunkai-reader.vercel.app/dark-pdf-reader',
      description: 'PDF dark mode reader that preserves embedded images and diagrams in true colors.',
    },
  },
  {
    path: 'features/continuous-reading',
    title: 'Continuous EPUB Reading | Infinite Vertical Scroll Ebook Reader — BunKai',
    description:
      'Read EPUBs like modern articles. Seamless vertical scrolling across chapters without clicking next buttons, paired with velocity-driven auto-scrolling.',
    h1: 'Continuous Vertical Reading for EPUB Ebooks',
    badge: 'Mode B: Infinite Scroll',
    contentHtml: `
      <p>
        Traditional ebook readers lock you into rigid paginated columns that require constant clicking or tapping. BunKai introduces Continuous Vertical Mode, bringing the natural scrolling feel of web articles to your entire ebook library.
      </p>

      <h2>Seamless Chapter Transitions</h2>
      <p>
        As you scroll downward, BunKai loads successive chapters dynamically into an expansive 85–90% width reading stage. There are no artificial blank pages or awkward gaps between sections.
      </p>

      <h2>Integrated Auto-Scroll</h2>
      <p>
        Activate hands-free auto-scrolling calibrated in exact pixels per second (from 15 px/s slow reading to 130 px/s brisk review). Any touch, mouse wheel, or text selection instantly pauses scrolling, resuming naturally whenever you wish.
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Experience Continuous Reading</h2>
        <p>Switch between paginated and continuous reading at any time in Reader Settings.</p>
        <a href="/" class="seo-cta-btn">Try Continuous Mode</a>
      </div>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Continuous Vertical Reading for EPUB Ebooks',
      description:
        'How continuous vertical scrolling and auto-scrolling transform EPUB reading into a smooth, distraction-free experience.',
      url: 'https://bunkai-reader.vercel.app/features/continuous-reading',
      author: {
        '@type': 'Organization',
        name: 'BunKai',
      },
      publisher: {
        '@type': 'Organization',
        name: 'BunKai',
        url: 'https://bunkai-reader.vercel.app/',
      },
    },
  },
  {
    path: 'guides/how-to-open-epub-files',
    title: 'How to Open and Read EPUB Files in Any Browser (Free Guide)',
    description:
      'Learn how to open and read EPUB ebook files on Windows, Mac, iOS, Android, and Chromebooks directly in your web browser without installing heavy software.',
    h1: 'How to Open and Read EPUB Files Online (No Installation)',
    badge: 'Free Educational Guide',
    contentHtml: `
      <p>
        EPUB (.epub) is the open standard format for digital books published worldwide. However, many operating systems do not include a built-in EPUB reader. Here is how you can open and read any EPUB file immediately.
      </p>

      <h2>Step 1: Open BunKai in Your Browser</h2>
      <p>Navigate to <a href="/" style="color:#ffffff;">bunkai-reader.vercel.app</a> on any device running Chrome, Safari, Firefox, Edge, or Brave.</p>

      <h2>Step 2: Drag and Drop Your EPUB File</h2>
      <p>Drag your <code>.epub</code> file directly onto the library screen, or tap <strong>Import EPUB or PDF</strong> to browse your file system.</p>

      <h2>Step 3: Customize Your Reading Experience</h2>
      <p>Your book opens instantly. Use the top-right settings icon to select your preferred reading mode (Paginated or Continuous), adjust font size, and pick an OLED, Dark, or Light theme.</p>

      <h2>Step 4: Automatic Local Persistence</h2>
      <p>You can close your browser tab at any time. When you return, BunKai restores your book from local browser storage with your exact reading location and progress preserved.</p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Ready to Open an EPUB?</h2>
        <p>Free, completely private, and works offline once loaded.</p>
        <a href="/" class="seo-cta-btn">Open EPUB Book</a>
      </div>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Open and Read EPUB Files Online',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Open BunKai in Browser',
          text: 'Navigate to bunkai-reader.vercel.app in your web browser.',
        },
        {
          '@type': 'HowToStep',
          name: 'Import EPUB File',
          text: 'Drag and drop your .epub file or select it from your device.',
        },
        {
          '@type': 'HowToStep',
          name: 'Enjoy Distraction-Free Reading',
          text: 'Read with customized themes, auto-scroll, and persistent bookmarks.',
        },
      ],
    },
  },
  {
    path: 'guides/how-to-read-pdf-in-dark-mode',
    title: 'How to Read PDF Files in Dark Mode Without Inverting Images',
    description:
      'Step-by-step guide to reading PDFs in eye-friendly dark mode while keeping photographs, charts, and illustrations in their true authored colors.',
    h1: 'How to Read PDF Files in Dark Mode (Preserving Photos & Diagrams)',
    badge: 'Visual Comfort Guide',
    contentHtml: `
      <p>
        Reading technical documentation, textbooks, and academic papers late at night can cause severe eye fatigue due to bright white paper backgrounds. Most PDF viewers either lack dark mode or invert the entire page, turning images into negatives.
      </p>

      <h2>The Problem with Browser Extensions</h2>
      <p>
        Dark mode extensions apply a simple CSS filter: <code>invert(1) hue-rotate(180deg)</code>. While text becomes white and paper turns dark, every photo, colored diagram, and author headshot is inverted into a photographic negative.
      </p>

      <h2>The BunKai Solution: Operator-Level Image Preservation</h2>
      <p>
        BunKai processes the PDF's internal graphics instructions. By identifying image draw commands and calculating their precise coordinate bounds, BunKai applies a targeted double-inversion filter strictly over the image rectangles.
      </p>
      <ul>
        <li>Text and backgrounds remain comfortable low-glare dark grey or true OLED black.</li>
        <li>Charts, logos, photographs, and scientific diagrams appear in their authentic, natural colors.</li>
      </ul>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Try True PDF Dark Mode</h2>
        <p>Open your PDF file and toggle Dark Mode with Image Preservation in Settings.</p>
        <a href="/" class="seo-cta-btn">Open PDF in Dark Mode</a>
      </div>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How to Read PDF Files in Dark Mode Without Inverting Images',
      author: {
        '@type': 'Person',
        name: 'SHAIK RAIYAN',
      },
      publisher: {
        '@type': 'Organization',
        name: 'BunKai',
      },
      description: 'A comprehensive guide on preserving PDF images while reading in dark mode.',
    },
  },
  {
    path: 'privacy',
    title: 'Privacy & Local-First In-Browser Architecture — BunKai',
    description:
      'BunKai processes, hashes, and stores your documents locally in your browser using IndexedDB. Learn how client-side reading ensures complete privacy.',
    h1: 'Privacy Policy & Local-First Architecture',
    badge: 'Zero Server Telemetry on Documents',
    contentHtml: `
      <p>
        At BunKai, we believe what you read is your business. Most online document readers require you to upload your confidential PDFs, personal books, and contracts to external cloud servers. BunKai is built fundamentally differently.
      </p>

      <h2>1. 100% In-Browser Document Processing</h2>
      <p>
        When you drop an EPUB or PDF into BunKai, the file never leaves your device. Parsing, text rendering, thumbnail extraction, and SHA-256 fingerprinting occur entirely inside your browser's WebAssembly and JavaScript environment.
      </p>

      <h2>2. Local IndexedDB Persistence</h2>
      <p>
        Your document Blobs, reading positions (CFI strings and PDF page offsets), bookmarks, and reading preferences are stored in your browser's sandboxed IndexedDB database (<code>bunkai_storage</code>). Nobody else has access to this data.
      </p>

      <h2>3. No File Telemetry or Content Leakage</h2>
      <p>
        BunKai does not transmit document filenames, book titles, reading progress, or document contents to any external analytics service, crawler, or server.
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Read Privately Today</h2>
        <p>No account required. Your books stay strictly on your device.</p>
        <a href="/" class="seo-cta-btn">Launch Private Reader</a>
      </div>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'BunKai Privacy Policy & Local-First Architecture',
      description: 'Zero document uploads, sandboxed IndexedDB storage, and client-side processing.',
      url: 'https://bunkai-reader.vercel.app/privacy',
      publisher: {
        '@type': 'Organization',
        name: 'BunKai',
      },
    },
  },
  {
    path: 'about',
    title: 'About BunKai | High-Performance Web Document Reading',
    description:
      'Learn the philosophy behind BunKai: a distraction-free, local-first reading environment designed for clarity, performance, and typography.',
    h1: 'About BunKai',
    badge: 'Crafted for Digital Readers',
    contentHtml: `
      <p>
        BunKai was created for readers who value simplicity, performance, and the timeless joy of reading. In an era of heavy, bloated reader applications laden with social feeds, accounts, and ads, BunKai returns to what matters most: the words on the page.
      </p>

      <h2>Design Principles</h2>
      <ul>
        <li><strong>Calm Neutral Aesthetics:</strong> Built in a quiet monochrome palette that recedes into the background so your document takes center stage.</li>
        <li><strong>Instant Responsiveness:</strong> Memory-bounded page virtualization, sub-second file parsing, and zero layout shift.</li>
        <li><strong>Freedom of Format:</strong> Seamless support for both reflowable EPUB ebooks and fixed-layout PDF documents within a single unified workspace.</li>
      </ul>

      <h2>Created by</h2>
      <p>
        Designed and engineered by <strong>SHAIK RAIYAN</strong>.<br />
        GitHub: <a href="https://github.com/SHAIK-RAIYAN/BunKai" style="color:#ffffff;">github.com/SHAIK-RAIYAN/BunKai</a>
      </p>

      <div class="seo-cta-box">
        <h2 style="margin-top:0;">Start Reading with BunKai</h2>
        <p>Free, open, and built for the modern web.</p>
        <a href="/" class="seo-cta-btn">Open Library</a>
      </div>
    `,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About BunKai',
      description: 'High-performance local-first web document reader crafted for digital readers.',
      url: 'https://bunkai-reader.vercel.app/about',
      publisher: {
        '@type': 'Organization',
        name: 'BunKai',
        url: 'https://bunkai-reader.vercel.app/',
      },
    },
  },
]

function renderPage(templateHtml, page) {
  const canonicalUrl = `${BASE_URL}/${page.path ? page.path : ''}`.replace(/([^:]\/)\/+/g, '$1')

  let headTags = `
    <title>${page.title}</title>
    <meta name="description" content="${page.description}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:image" content="${BASE_URL}/Bunkai-Chi-logo.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${page.title}" />
    <meta name="twitter:description" content="${page.description}" />
    <meta name="twitter:image" content="${BASE_URL}/Bunkai-Chi-logo.png" />

    <style>${CRITICAL_CSS}</style>
  `

  if (page.structuredData) {
    headTags += `
      <script type="application/ld+json">
        ${JSON.stringify(page.structuredData)}
      </script>
    `
  }

  const crawlableBody = `
    <div id="root"></div>
    <div class="seo-container">
      <header class="seo-header">
        <a href="/" class="seo-logo">
          <img src="/Bunkai-Chi-logo.png" alt="BunKai Logo" width="32" height="32" style="border-radius:6px;" />
          <span>BunKai</span>
        </a>
        ${page.badge ? `<div class="seo-badge">${page.badge}</div>` : ''}
        <h1>${page.h1}</h1>
      </header>

      <main>
        ${page.contentHtml}
      </main>

      <div class="seo-footer">
        <p>© ${new Date().getFullYear()} BunKai. Local-first, private reading for everyone.</p>

        <nav class="seo-nav-links" aria-label="Quick links">
          <a href="/">Home</a>
          <a href="/epub-reader-online">EPUB Reader Online</a>
          <a href="/pdf-reader-online">PDF Reader Online</a>
          <a href="/dark-pdf-reader">Dark PDF Reader</a>
          <a href="/features/continuous-reading">Continuous EPUB</a>
          <a href="/guides/how-to-open-epub-files">How to Open EPUB</a>
          <a href="/guides/how-to-read-pdf-in-dark-mode">PDF Dark Mode Guide</a>
          <a href="/privacy">Privacy & Local Processing</a>
          <a href="/about">About</a>
        </nav>
      </div>
    </div>
  `

  // Replace <title> and inject metadata into template
  let html = templateHtml.replace(/<title>.*?<\/title>/s, '')
  html = html.replace('</head>', `${headTags}\n</head>`)
  html = html.replace('<div id="root"></div>', crawlableBody)

  return html
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

  for (const page of PAGES) {
    const loc = `${BASE_URL}/${page.path ? page.path : ''}`.replace(/([^:]\/)\/+/g, '$1')
    const priority = page.path === '' ? '1.0' : page.path.includes('guide') ? '0.8' : '0.9'
    const freq = page.path === '' || page.path.includes('reader') ? 'weekly' : 'monthly'
    xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`
  }

  xml += `</urlset>\n`
  return xml
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /blob/
Disallow: /local/

Sitemap: ${BASE_URL}/sitemap.xml
`
}

function generate() {
  const indexTemplatePath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexTemplatePath)) {
    console.error('dist/index.html not found! Run vite build first.')
    process.exit(1)
  }

  const templateHtml = fs.readFileSync(indexTemplatePath, 'utf8')
  console.log(`Generating ${PAGES.length} static SEO prerendered pages for ${BASE_URL}...`)

  for (const page of PAGES) {
    const rendered = renderPage(templateHtml, page)

    if (page.path === '') {
      fs.writeFileSync(indexTemplatePath, rendered, 'utf8')
      console.log(`✓ Generated: dist/index.html`)
    } else {
      const outDir = path.join(DIST_DIR, page.path)
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'index.html'), rendered, 'utf8')
      console.log(`✓ Generated: dist/${page.path}/index.html`)
    }
  }

  // Generate sitemap.xml and robots.txt in both public and dist directories
  const sitemapXml = generateSitemap()
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8')
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8')
  console.log(`✓ Synchronized: public/sitemap.xml & dist/sitemap.xml`)

  const robotsTxt = generateRobotsTxt()
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf8')
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8')
  console.log(`✓ Synchronized: public/robots.txt & dist/robots.txt`)

  console.log('Static SEO prerendering complete!')
}

// Execute generate when run directly
generate()

export { PAGES, renderPage, generate, BASE_URL }
