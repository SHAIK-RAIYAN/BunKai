# BunKai Reader📚

> A production-grade, high-performance Web EPUB Reader built for the modern web.  
> **Currently supports EPUB files only.**

🌐 **Live Demo:** [https://bunkai-reader.vercel.app/](https://bunkai-reader.vercel.app/)

*"A reader lives a thousand lives before he dies. The man who never reads lives only one."* — George R.R. Martin

BunKai is designed for those who believe in the power of reading—a lifelong journey of discovery, learning, and imagination. Whether you're diving into fiction, exploring non-fiction, or studying technical content, BunKai provides a distraction-free environment that lets you focus on what matters most: the words on the page.

## 🚀 Core Philosophy

**BunKai** (分解 - "Analysis/Deconstruction") is an experiment in minimalism and performance. It strips away the clutter of traditional e-readers to focus entirely on the reading experience, specifically optimized for OLED displays.

Reading is a lifelong journey—a gateway to infinite worlds, knowledge, and perspectives. BunKai is crafted to honor this journey by providing a clean, distraction-free environment where you can immerse yourself in the written word. Every design decision prioritizes your reading experience, from the pitch-black Black mode that saves battery to the smooth, cinematic scrolling that makes long reading sessions effortless.

## 🛠️ Tech Stack

* **Core:** React 18, TypeScript, Vite
* **Engine:** epub.js (Custom React Bindings)
* **Styling:** Tailwind CSS v4 (CSS-first architecture)
* **Persistence:** IndexedDB (`idb-keyval`) for book storage, LocalStorage for settings
* **State:** Context API + Custom Hooks (`usePersistence`, `useTheme`)
* **Icons:** react-icons
* **Smooth Scrolling:** lenis

## ✨ Key Features

* **Black-Pitch Mode:** True `#000000` background for battery saving and contrast
* **Instant Resume:** Auto-saves reading position (CFI) and sidebar state
* **Offline First:** Books are stored locally in the browser via IndexedDB
* **Glassmorphism UI:** Adaptive, non-intrusive interface that fades away when reading
* **Drag & Drop:** Instant parsing of `.epub` files (EPUB format only)
* **Real-time Customization:** Font size, font family, and theme changes apply instantly
* **Table of Contents:** Navigate chapters with a collapsible sidebar
* **Keyboard Navigation:** Arrow keys for chapter navigation
* **Settings Persistence:** All preferences saved across sessions
* **Smooth Scrolling:** Cinematic scroll experience powered by Lenis

## ⚡ Performance

* **Virtualization:** Efficient rendering of large chapters
* **Zero Layout Shift:** Content layout is calculated before display
* **Bundle Size:** Optimized via Vite for sub-second load times
* **Lazy Loading:** Components load on demand

## 📦 Installation

```bash
git clone https://github.com/SHAIK-RAIYAN/bunkai.git
cd bunkai
npm install
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

The build output will be in the `dist` directory, ready for deployment.

## 🚢 Deployment

The project includes `vercel.json` for easy deployment on Vercel. Simply connect your repository and deploy.

## 📁 Project Structure

```
BunKai
├─ src
│  ├─ components
│  │  ├─ Layout
│  │  │  ├─ AppShell.tsx
│  │  │  ├─ HudContext.tsx
│  │  │  └─ SidebarContext.tsx
│  │  ├─ Reader
│  │  │  └─ Reader.tsx
│  │  ├─ UI
│  │  │  ├─ Header.tsx
│  │  │  ├─ SettingsPanel.tsx
│  │  │  └─ Sidebar.tsx
│  │  └─ Views
│  │     └─ Landing.tsx
│  ├─ hooks
│  │  ├─ usePersistence.ts
│  │  └─ useTheme.ts
│  ├─ types
│  │  └─ index.ts
│  └─ App.tsx
├─ vercel.json
└─ package.json
```

## 🎨 Themes

* **Black:** Pitch black (`#000000`) for maximum battery efficiency on OLED displays
* **Dark:** Soft dark (`#111111`) for comfortable night reading
* **Light:** Paper-like (`#fdfbf7`) for daytime reading

## ⌨️ Keyboard Shortcuts

* `Arrow Right` - Next chapter
* `Arrow Left` - Previous chapter

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, improving documentation, or suggesting ideas, your input makes BunKai better for everyone.

**Ways to contribute:**
- 🐛 Report bugs by opening an issue
- 💡 Suggest new features or improvements
- 🔧 Submit pull requests for bug fixes or enhancements
- 📖 Improve documentation
- ⭐ Star the repository if you find it useful

Please feel free to reach out or submit a pull request. Together, we can build a better reading experience for everyone.


## 👤 Author

**SHAIK RAIYAN**

- GitHub: [@SHAIK-RAIYAN](https://github.com/SHAIK-RAIYAN)
- Website: [shaikraiyan.me](https://shaikraiyan.me)
- LinkedIn: [in/shaik-raiyan](https://www.linkedin.com/in/shaik-raiyan)

---

Built with ❤️ for readers who value simplicity, performance, and the timeless joy of reading. 
*"The more that you read, the more things you will know. The more that you learn, the more places you'll go."* — Dr. Seuss

```
BunKai
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ public
│  └─ Bunkai-Chi-logo.png
├─ README.md
├─ src
│  ├─ App.tsx
│  ├─ assets
│  │  └─ react.svg
│  ├─ components
│  │  ├─ BookParser.tsx
│  │  ├─ Layout
│  │  │  ├─ AppShell.tsx
│  │  │  ├─ HudContext.tsx
│  │  │  └─ SidebarContext.tsx
│  │  ├─ Reader
│  │  │  └─ Reader.tsx
│  │  ├─ UI
│  │  │  ├─ Header.tsx
│  │  │  ├─ SettingsPanel.tsx
│  │  │  ├─ Sidebar.tsx
│  │  │  └─ SmoothScroll.tsx
│  │  └─ Views
│  │     ├─ Landing.tsx
│  │     └─ TocScreen.tsx
│  ├─ context
│  │  ├─ ThemeContext.tsx
│  │  └─ ToastContext.tsx
│  ├─ hooks
│  │  └─ usePersistence.ts
│  ├─ index.css
│  ├─ lib
│  │  └─ tocUtils.ts
│  ├─ main.tsx
│  └─ types
│     └─ index.ts
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vercel.json
└─ vite.config.ts

```