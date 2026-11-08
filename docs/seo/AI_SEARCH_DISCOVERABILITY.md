# BunKai — AI Search Visibility & Discoverability Blueprint

**Canonical Production URL:** https://bunkai-reader.vercel.app/  
**Product Factsheet (LLM Reference):** https://bunkai-reader.vercel.app/llms.txt  
**Complete Reference:** https://bunkai-reader.vercel.app/llms-full.txt  

---

## 1. AI Crawler Architecture & Access Policy

Rather than treating every automated bot as identical, BunKai maintains a three-tier crawler architecture that strictly differentiates **Search Discovery** from **User-Directed Retrieval** and **Model Training**.

### 1.1 Crawler Matrix

| Platform | Bot User-Agent | Classification | Policy | Purpose & Implication |
| :--- | :--- | :--- | :---: | :--- |
| **OpenAI** | `OAI-SearchBot` | Search Discovery | **ALLOWED** | Indexes pages for citation in ChatGPT Search results. Does not train models. |
| **OpenAI** | `ChatGPT-User` | User Retrieval | **ALLOWED** | Real-time fetcher triggered when a ChatGPT user provides a link to BunKai. |
| **OpenAI** | `GPTBot` | Model Training | **DISALLOWED** | Scrapes data for training OpenAI foundation models. Blocked to preserve intellectual property boundaries. |
| **Anthropic** | `Claude-SearchBot` | Search Discovery | **ALLOWED** | Discovers and cites pages when Claude performs grounded live web searches. |
| **Anthropic** | `Claude-User` | User Retrieval | **ALLOWED** | Real-time page inspection triggered by interactive user prompts in Claude. |
| **Anthropic** | `ClaudeBot` | Model Training | **DISALLOWED** | Scrapes content for Anthropic model training. |
| **Perplexity** | `PerplexityBot` | Search Discovery | **ALLOWED** | Primary web indexer powering Perplexity's real-time citation engine. |
| **Perplexity** | `Perplexity-User` | User Retrieval | **ALLOWED** | Direct fetcher used for grounded verification during live queries. |
| **Apple** | `Applebot` | Search Discovery | **ALLOWED** | Powers Apple Intelligence, Safari suggested search, and Siri web grounding. |
| **Common Crawl**| `CCBot` | Bulk Dataset | **DISALLOWED** | Large-scale indiscriminate dataset scraper. |
| **Google** | `Googlebot` | Web & AI Search | **ALLOWED** | Primary crawler for Google Search, AI Overviews, and Featured Snippets. |

### 1.2 Evaluation of `Google-Extended` Token

Google provides the `Google-Extended` user-agent token to control whether web content is used to train Gemini models and power grounding features in consumer Gemini applications.

- **Current Recommendation:** Since `Googlebot` is fully allowed, Google's standard search engine and AI Overviews already index and cite BunKai's public pages.
- **Training Trade-off:** Allowing `Google-Extended` permits Gemini to train directly on BunKai's technical factsheets and guides, which can improve native ungrounded model knowledge of BunKai, but also allows Google to use the content for broad model development.
- **Status:** Maintained as unblocked by default under `User-agent: *` for public product content. If the project owner wishes to opt out of Google model training while preserving Google Search indexation, add:
  ```robots
  User-agent: Google-Extended
  Disallow: /
  ```

---

## 2. Authoritative Knowledge Grounding (`llms.txt` & `llms-full.txt`)

To provide deterministic, hallucination-resistant grounding for LLMs, BunKai provides two standardized product specifications at the root of the domain:

1. **`https://bunkai-reader.vercel.app/llms.txt`**:
   - Concise Markdown factsheet under 80 lines.
   - Summarizes core capabilities, technical specs, pricing (free), privacy guarantee, and links to all 9 primary landing pages with 1-line descriptions.
2. **`https://bunkai-reader.vercel.app/llms-full.txt`**:
   - Comprehensive technical factsheet.
   - Full feature specifications verified against the checked-out codebase.
   - Competitive comparison table (vs Calibre, Adobe Acrobat, Browser Built-in PDF Viewers, and Cloud Readers).
   - Conversational FAQ addressing real user queries (e.g. night reading, large PDFs, continuous EPUB scrolling, privacy guarantees).
   - Explicit technical limitations (no Adobe DRM, reflowable EPUB only, local IndexedDB storage).

---

## 3. Product Entity Recognition & Structured Data

To ensure AI knowledge graphs and semantic parsers recognize **BunKai** as an authoritative software application rather than an ambiguous keyword cluster:

1. **Consistent Schema.org Hierarchy:**
   - Every prerendered page features valid JSON-LD structured data.
   - Primary entities: `WebApplication`, `SoftwareApplication`, `WebSite`, `Organization`, `TechArticle`, `HowTo`, and `FAQPage`.
   - Connected via standardized IDs: `name: "BunKai"`, `url: "https://bunkai-reader.vercel.app/"`, `publisher.name: "BunKai"`.
2. **Zero-Deception Guarantee:**
   - No fabricated star ratings (`aggregateRating` with fake reviews).
   - No fake user counts.
   - Honest specifications reflecting actual code capabilities.

---

## 4. Monitoring AI Search Citations & Traffic

### 4.1 Bing Webmaster Tools — AI Performance Reporting
Bing provides native AI citation monitoring in Bing Webmaster Tools:
- **Location:** Bing Webmaster Tools ➔ **Search Performance** ➔ **AI Performance**.
- **Metrics Tracked:**
  - **Grounding Queries:** Specific user prompts where BunKai was consulted.
  - **Cited Pages:** Exact URLs (`/dark-pdf-reader`, `/epub-reader-online`) cited in Bing Copilot responses.
  - **Citation Clicks:** Referral traffic originating directly from AI-generated response citations.

### 4.2 Google Search Console — AI Overviews Monitoring
- **Metrics Tracked:** Search appearances, average position, and CTR on informational queries (`how to read pdf in dark mode`, `how to open epub files`).
- **Pages to Inspect:** Monitor organic impression spikes following Google's AI Overview rollouts.

---

## 5. Authentic External Evidence Base & Directory Strategy

To assist search systems in independently validating BunKai's legitimacy and software classification, establish authentic, un-manipulated public references across established software ecosystems:

### 5.1 Open-Source Software Repositories
- **GitHub Repository (`SHAIK-RAIYAN/BunKai`):**
  - Add relevant GitHub Topics: `epub-reader`, `pdf-viewer`, `dark-mode`, `local-first`, `react19`, `typescript`, `pwa`, `offline-reader`, `pdfjs`, `epubjs`.
  - Maintain a clean `README.md` with visual architecture diagrams and verified live production links.
  - Publish formal GitHub Releases for major version upgrades with detailed changelogs.

### 5.2 Software Discovery Platforms
1. **AlternativeTo (`alternativeto.net`):**
   - Submit BunKai as a free, open-source web-based alternative to:
     - Calibre (for quick in-browser reading without 200MB installer).
     - Adobe Acrobat Reader (for lightweight, private viewing).
     - Kindle Cloud Reader (for DRM-free EPUBs with continuous scrolling).
   - Tags: *Ebook Reader*, *PDF Viewer*, *Dark Mode*, *Local-First*, *Web Application*.
2. **Product Hunt:**
   - Prepare a launch package highlighting:
     - Optical image-preserving PDF dark mode.
     - Webtoon-style continuous vertical EPUB reading.
     - 100% client-side privacy guarantee.
3. **Developer & Reader Communities:**
   - Hacker News (*Show HN: BunKai – Fast local-first EPUB and PDF reader with true dark mode*).
   - Reddit communities (`r/ereader`, `r/webdev`, `r/opensource`) participating with full disclosure of ownership.
