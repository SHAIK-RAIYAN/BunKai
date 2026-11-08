# BunKai — Organic Search Strategy & Technical SEO Blueprint

**Primary Canonical Domain:** [https://bunkai-reader.vercel.app/](https://bunkai-reader.vercel.app/)  
**Hosting Model:** Vercel Free Production Deployment (Permanent Free Hosting)  
**Strategy Version:** 3.0 (Vercel Free Domain Permanent Migration)

---

## 1. Executive Summary & Objective

BunKai is built to compete in organic search across three primary search verticals:
1. **Online EPUB Reading** (`epub reader online`, `free epub reader`, `read epub in browser`)
2. **High-Performance In-Browser PDF Reading** (`online pdf reader`, `fast pdf viewer web`)
3. **True Color-Preserving PDF Dark Mode** (`pdf dark mode`, `read pdf in dark mode without inverting images`, `dark mode pdf reader`)

Rather than relying on generic keyword stuffing or doorway pages, BunKai captures qualified organic traffic by solving concrete technical frustrations that incumbent tools fail to address:
- **No Cloud Uploads:** Completely client-side in-browser reading protects confidential docs.
- **True Image Colors in Dark Mode:** Does not invert photos and medical/scientific diagrams into negatives.
- **Continuous EPUB Mode:** Provides infinite vertical reading across chapters.
- **Zero Installation / Offline First:** Opens immediately in any browser and persists in local IndexedDB.

---

## 2. Target Keyword Clusters & Intent Mapping

### Cluster A: Core EPUB Reading (High Intent, High Volume)
- **Primary Keywords:** `epub reader online`, `free epub reader`, `read epub in browser`, `open epub file online`
- **Search Intent:** Users with an `.epub` file on Windows, Mac, Chromebook, or mobile who want to start reading immediately without downloading Calibre or Adobe Digital Editions.
- **Target Landing Page:** [`/epub-reader-online`](https://bunkai-reader.vercel.app/epub-reader-online)
- **Competitive Advantage:** Instant drag-and-drop, paginated + continuous modes, OLED themes, no account required.

### Cluster B: True PDF Dark Mode (High Differentiation, Low-to-Medium Difficulty)
- **Primary Keywords:** `dark mode pdf reader`, `pdf dark mode`, `read pdf in dark mode`, `invert pdf colors preserve images`
- **Search Intent:** Developers, students, and researchers reading dense PDF papers at night who suffer from blinding white backgrounds or distorted inverted images.
- **Target Landing Page:** [`/dark-pdf-reader`](https://bunkai-reader.vercel.app/dark-pdf-reader) & [`/guides/how-to-read-pdf-in-dark-mode`](https://bunkai-reader.vercel.app/guides/how-to-read-pdf-in-dark-mode)
- **Competitive Advantage:** Proprietary PDF.js operator-level image detection preserves authentic RGB photo colors while darkening text and paper.

### Cluster C: Educational Guides & Troubleshooting (Informational Intent)
- **Primary Keywords:** `how to open epub files`, `how to read epub on pc without app`, `how to read pdf in dark mode`
- **Search Intent:** Searchers looking for step-by-step instructions.
- **Target Landing Pages:** [`/guides/how-to-open-epub-files`](https://bunkai-reader.vercel.app/guides/how-to-open-epub-files), [`/guides/how-to-read-pdf-in-dark-mode`](https://bunkai-reader.vercel.app/guides/how-to-read-pdf-in-dark-mode)
- **Schema:** Formatted with Schema.org `HowTo` and `Article` structured data for search engine understanding.

### Cluster D: Privacy & Local-First (High Trust, Zero Server Upload)
- **Primary Keywords:** `private pdf reader`, `read pdf without uploading`, `local pdf reader in browser`, `offline epub reader`
- **Search Intent:** Legal, medical, and security-conscious readers requiring absolute document privacy.
- **Target Landing Page:** [`/privacy`](https://bunkai-reader.vercel.app/privacy)
- **Proof:** All file processing, rendering, and persistence occur strictly within local browser memory and IndexedDB.

---

## 3. Geographic Intent & Regional Prioritization

| Region | Search Landscape & User Behavior | Priority Keyword Focus |
| --- | --- | --- |
| **Global English** | Broad searches for quick online file openers; desktop & tablet dominant. | `epub reader online`, `dark mode pdf reader` |
| **United States** | High volume of college students, ebook buyers, and programmers working at night. | `free epub reader`, `read pdf in dark mode` |
| **India** | High demand for reading exam preparation PDFs, textbooks, and civil service study materials on laptops and mobile devices. Low internet connectivity areas benefit heavily from offline IndexedDB persistence. | `epub reader online free`, `online pdf reader`, `offline epub viewer` |
| **United Kingdom** | Academic and university researchers studying digital publications and JSTOR papers. | `epub reader online`, `dark pdf reader` |

---

## 4. Technical SEO Architecture

### 4.1 Canonical Domain Enforcement
- **Canonical Host:** `https://bunkai-reader.vercel.app/`
- Every public page renders `<link rel="canonical" href="https://bunkai-reader.vercel.app/..." />`.
- `vercel.json` removes old custom domain dependencies and routes all canonical traffic directly to `bunkai-reader.vercel.app`.
- Open Graph (`og:url`), Twitter cards, and sitemap entries strictly point to the primary canonical domain.

### 4.2 Static Prerendering Pipeline (`scripts/generate-seo-pages.mjs`)
- Integrated into `npm run build`.
- Generates static, fully crawlable HTML files for all public routes into `dist/`.
- Search engine crawlers (Googlebot, Bingbot, Brave Search) receive real semantic HTML (`<h1>`, `<h2>`, `<article>`, `<p>`) with zero JavaScript dependency.
- **Performance Budget:** Static landing pages load in < 150ms without loading heavy document engines (`pdfjs-dist` or `epubjs`).

### 4.3 Structured Data (Schema.org JSON-LD)
Truthful, verified structured data without fabricated reviews:
- **Homepage:** `WebApplication` & `WebSite`
- **Features & Reader Pages:** `SoftwareApplication`
- **Guides:** `HowTo` and `Article` with real step sequences and author attributions.

### 4.4 Crawler Configuration
- **`robots.txt`:** Fully crawlable for public pages while excluding private blob/local states. Direct link to `sitemap.xml`.
- **`sitemap.xml`:** Valid XML format containing only canonical public URLs with appropriate `<changefreq>` and `<priority>`.
- **IndexNow Integration:** Verified key `5c8e391b1f6f4c6e9a8f4c2b9a1d3e5f` with automatic submission script (`npm run seo:indexnow`) to notify Bing, Yandex, Naver, and Seznam.

---

## 5. Search Engine Discovery & Monitoring Setup

### Google Search Console
1. **Property Creation:** Add URL-prefix property `https://bunkai-reader.vercel.app/`.
2. **Verification:** Add HTML meta tag or verify via Google Account.
3. **Sitemap Submission:** Submit `https://bunkai-reader.vercel.app/sitemap.xml`.
4. **Inspection:** Run URL Inspection on `/`, `/epub-reader-online`, and `/dark-pdf-reader`.
5. **Monitoring:** Track Total Impressions, Clicks, Average Position, and Core Web Vitals (LCP, INP, CLS).

### Bing Webmaster Tools
1. **Verification & Import:** Connect Bing Webmaster Tools using Google Search Console integration or DNS.
2. **IndexNow:** Key `5c8e391b1f6f4c6e9a8f4c2b9a1d3e5f.txt` deployed at root. Execute `npm run seo:indexnow` on deployments to request immediate re-crawling.

### Brave Search
- Brave operates an independent web crawler (Bravebot).
- Clean crawl paths, valid XML sitemaps, and robots.txt ensure indexing into the Brave Search index without intermediary proxies.

---

## 6. Organic Growth KPI Framework

| KPI | Target (Month 1–3) | Target (Month 4–6) | Tracking Source |
| --- | --- | --- | --- |
| **Indexed Public URLs** | 9 / 9 URLs indexed | 15+ URLs (expanded guides) | Google Search Console / Bing |
| **Non-Branded Organic Impressions** | 5,000 / month | 25,000 / month | Google Search Console |
| **Organic Click-Through Rate (CTR)** | > 3.5% | > 4.8% | Search Console Performance |
| **Core Web Vitals Pass Rate** | 100% Good (LCP < 2.5s, CLS < 0.1) | 100% Good | PageSpeed / CrUX |
| **Document Import Conversion** | > 15% of landing page visitors | > 22% of landing page visitors | In-browser privacy-safe event counter |

