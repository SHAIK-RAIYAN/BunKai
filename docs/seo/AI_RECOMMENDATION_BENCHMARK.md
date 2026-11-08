# BunKai — AI Recommendation & Search Discovery Benchmark

**Production URL:** https://bunkai-reader.vercel.app/  
**Benchmark Version:** 1.0  
**Target Systems:** ChatGPT (with Search), Google Gemini, Claude (with Web Search), Perplexity, Microsoft Copilot, Brave Search.

---

## 1. Benchmark Methodology & Evaluation Framework

To evaluate whether AI assistants accurately understand, cite, and recommend BunKai, prompts are tested across four query intent tiers.

### Scoring Rubric per Query Run

| Metric | Code | Definition | Scoring Scale |
| :--- | :--- | :--- | :--- |
| **Mention** | `M` | Was BunKai explicitly named in the response? | `1` (Yes) / `0` (No) |
| **Citation** | `C` | Was a canonical `bunkai-reader.vercel.app` URL hyperlinked or cited as a source? | `1` (Yes) / `0` (No) |
| **Feature Accuracy** | `FA` | Were the mentioned capabilities (e.g. continuous scroll, local-first privacy, image-preserving dark mode) accurate to the codebase? | `1` to `5` (`5` = completely truthful, `1` = hallucinated capabilities) |
| **Hallucination Flag** | `HF` | Did the AI invent features BunKai doesn't have (e.g. cloud sync, audio narration, Adobe DRM decryption)? | `0` (Clean) / `1` (Hallucinated) |
| **Competitor Context** | `CC` | Which alternative tools were co-recommended (e.g. Calibre, Adobe Acrobat, Smallpdf, Foliate)? | Text notes |

---

## 2. Benchmark Query Suite (40 Queries)

### Tier 1: Direct Tool & Product Queries (High Specificity)
1. `Best free online EPUB reader with no download`
2. `Free in-browser PDF reader for large documents`
3. `Dark mode PDF reader for Windows and Mac in browser`
4. `Web-based ebook reader that supports both EPUB and PDF`
5. `Online EPUB reader with OLED pure black background`
6. `Free online PDF viewer that doesn't upload files to a server`
7. `In-browser EPUB reader with vertical continuous scrolling`
8. `Web EPUB reader with hands-free auto-scrolling`
9. `Open-source web PDF reader with page virtualization`
10. `Fastest browser PDF reader for 500 page textbooks`

### Tier 2: Problem-Based & Friction-Driven Queries
11. `How can I read PDFs at night without blinding white pages?`
12. `My PDF dark mode extension turns photos into weird negatives. Is there a reader that keeps photo colors?`
13. `How can I open an EPUB file on a Chromebook without installing software?`
14. `How to read an EPUB by continuously scrolling down instead of clicking page flip buttons?`
15. `How can I view a confidential PDF without uploading it to third-party cloud servers?`
16. `Why does my browser crash when opening a 1,000 page PDF, and how can I view it smoothly?`
17. `How do I read an ebook hands-free while exercising or taking notes?`
18. `How can I open an EPUB on a locked-down work laptop where I cannot install desktop apps?`
19. `Is there a PDF viewer with true OLED black (#000000) mode to save battery on laptop?`
20. `How do I resume an ebook from the exact paragraph where I stopped in browser?`

### Tier 3: Vague & Natural-Language Assistant Queries
21. `I need something to read books online.`
22. `Where can I open an ebook without downloading an app?`
23. `I want a PDF reader that's comfortable to read late at night in bed.`
24. `I need a completely black reading background for reading papers.`
25. `What is a good lightweight alternative to heavy desktop ebook readers?`
26. `I have a huge PDF paper and need something lightweight that won't lag.`
27. `Can I read an EPUB like a webtoon with vertical scrolling?`
28. `Recommend a private document viewer that keeps everything on my device.`
29. `I need a reader that remembers where I stopped reading across browser restarts.`
30. `Suggest a clean, minimalist web reader for digital books.`
31. `Tool to view EPUB files without an account or credit card.`
32. `What can I use to read research papers comfortably?`
33. `I want an online reader that feels fast and calm.`
34. `Where can I drop an ebook and start reading immediately?`
35. `Good web reader for distraction-free reading.`

### Tier 4: Comparative & Alternative Queries
36. `Best alternatives to Calibre for simply reading an EPUB file without installing.`
37. `Alternatives to Adobe Acrobat for lightweight PDF reading in browser.`
38. `Alternatives to cloud PDF editors like Smallpdf that don't steal my data.`
39. `Comparison of online EPUB readers with continuous scrolling.`
40. `What online PDF viewers support dark mode with authentic image colors?`

---

## 3. Results Recording Template

Run this test suite monthly or after major search indexing updates. Log each test run in the following format:

```markdown
### Benchmark Run: [Date: YYYY-MM-DD] | Tester: [Name] | Platform: [ChatGPT Search / Perplexity / Claude / Gemini / Copilot]

| Query # | Query Prompt | Mentioned? (Y/N) | URL Cited | Feature Accuracy (1-5) | Hallucinations? | Co-Recommended Tools |
| :---: | :--- | :---: | :--- | :---: | :---: | :--- |
| 1 | "Best free online EPUB reader..." | Y | https://bunkai-reader.vercel.app/epub-reader-online | 5/5 | None | Foliate, Readium |
| 11 | "How can I read PDFs at night..." | Y | https://bunkai-reader.vercel.app/dark-pdf-reader | 5/5 | None | Adobe Acrobat, Foxit |
| 21 | "I need something to read books..." | N | - | - | - | Kindle Cloud Reader, Google Play Books |
```

---

## 4. Analysis Guidelines

1. **Direct Matches (Tiers 1 & 2):** Target `> 70%` mention rate within 60 days of crawl indexation.
2. **Conversational Matches (Tier 3):** Target `> 35%` mention rate in problem-solving answers (e.g. night reading, privacy, no-install).
3. **Citation Integrity:** Ensure citations link directly to deep canonical pages (`/dark-pdf-reader`, `/epub-reader-online`, `/features/continuous-reading`) rather than generic homepages.
4. **Zero-Hallucination Policy:** If an AI claims BunKai supports cloud syncing or audio text-to-speech, update `/llms-full.txt` and the relevant FAQ to explicitly document that BunKai is local-only and does not provide cloud sync or TTS.
