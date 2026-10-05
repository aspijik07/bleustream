# 🎬 BleuStream — Ultra HD Free Cinema & Series Streaming

BleuStream is a cinema web application for streaming full-length blockbuster movies, complete TV series, and trending anime in 1080p and 4K Ultra HD with multi-language subtitle tracks and high-speed streaming CDN mirrors.

![BleuStream Cinema](https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop)

---

## ✨ Features

- 🍿 **4K Ultra HD & 1080p Cinema Streaming**: 3 high-speed multi-audio CDN mirrors (VidSrc Prime, VidSrc Cloud, VidSrc VIP).
- 📺 **Complete TV Series & Anime Hub**: Instant season & episode picker with episode descriptions, thumbnails, and autoplay navigation.
- ⚡ **Real-Time Live Search**: Instant multi-category search powered by TMDB v3 API.
- 🌐 **Multilingual Experience**: English, Français, Español, Deutsch, and العربية (Arabic) with instant toggle and Google Translate integration.
- 🎨 **Modern Sky-Blue Cinema Aesthetic**: Dark charcoal theme (`#0b0f19` / `#141414`) with light sky blue / cyan glow accents and Bebas Neue typography.
- 🔒 **Cryptographic Admin Vault**: Real-time traffic analytics, server manager, and CPA content locker controls (AdBlueMedia & OGAds).
- 🚀 **100% Turnkey Deployment**: Pre-configured for Cloudflare Pages, Vercel, Netlify, and Docker with `_redirects` and `_headers` included.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 + Lucide Icons + Motion
- **Metadata**: TMDB v3 API
- **Deployment**: Cloudflare Pages / Static Hosting

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/bleustream.git
cd bleustream
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Start local development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
```
Production assets are generated in the `dist/` directory.

---

## ☁️ Deploy to Cloudflare Pages (Recommended)

1. Push this project to your GitHub repository.
2. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select this repository.
4. Set build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Click **Save and Deploy**. Your cinema website is live worldwide with zero server costs!

---

## ⚖️ Legal Disclaimer

BleuStream does not host any media files on its servers. All content is provided by non-affiliated third-party streaming providers.
