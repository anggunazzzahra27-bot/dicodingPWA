# 📖 Story App - Share Your Stories

Story App adalah aplikasi web untuk berbagi dan menemukan cerita-cerita menarik dari seluruh dunia. Aplikasi ini menggunakan webpack untuk bundling, Babel untuk transpilasi JavaScript, dan Leaflet.js untuk fitur peta interaktif.

## ✨ Fitur Utama

- **🔐 Autentikasi**: Login dan register pengguna
- **📝 Berbagi Cerita**: Upload foto dan cerita dengan lokasi
- **🗺️ Peta Interaktif**: Lihat lokasi cerita menggunakan Leaflet.js
- **📱 Responsive Design**: Tampil baik di desktop dan mobile
- **🎨 View Transitions**: Animasi smooth antar halaman
- **♿ Aksesibilitas**: Semantic HTML dan ARIA labels

## 🚀 Demo

Aplikasi ini terhubung dengan [Story API Dicoding](https://story-api.dicoding.dev/v1/) untuk menyimpan dan mengambil data cerita.

## Table of Contents

- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Teknologi](#teknologi)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (disarankan versi 12 atau lebih tinggi)
- [npm](https://www.npmjs.com/) (Node package manager)

### Installation

1. Clone repository ini
2. Install dependencies:
   ```shell
   npm install
   ```
3. Jalankan development server:
   ```shell
   npm run start-dev
   ```
4. Buka browser dan akses `http://localhost:9000`

## Scripts

- Build for Production:
  ```shell
  npm run build
  ```
  Script ini menjalankan webpack dalam mode production menggunakan konfigurasi `webpack.prod.js` dan menghasilkan sejumlah file build ke direktori `dist`.

- Start Development Server:
  ```shell
  npm run start-dev
  ```
  Script ini menjalankan server pengembangan webpack dengan fitur live reload dan mode development sesuai konfigurasi di`webpack.dev.js`.

- Serve:
  ```shell
  npm run serve
  ```
  Script ini menggunakan [`http-server`](https://www.npmjs.com/package/http-server) untuk menyajikan konten dari direktori `dist`.

## Project Structure

Story App dirancang dengan arsitektur modular dan terorganisir untuk kemudahan pengembangan.

```text
story-app/
├── dist/                           # Compiled files for production
├── src/                            # Source project files
│   ├── public/                     # Public assets
│   │   ├── favicon.png
│   │   └── images/
│   ├── scripts/                    # JavaScript source files
│   │   ├── index.js               # Main entry point
│   │   ├── config.js              # App configuration
│   │   ├── data/
│   │   │   └── api.js             # Story API service
│   │   ├── pages/                 # Page components
│   │   │   ├── app.js             # Main app controller
│   │   │   ├── home/
│   │   │   │   └── home-page.js   # Home page with stories list & map
│   │   │   ├── login/
│   │   │   │   └── login-page.js  # Login page
│   │   │   ├── register/
│   │   │   │   └── register-page.js # Register page
│   │   │   └── add/
│   │   │       └── add-page.js    # Add story page
│   │   ├── routes/                # Routing system
│   │   │   ├── routes.js          # Route definitions
│   │   │   └── url-parser.js      # URL parser utility
│   │   └── utils/
│   │       └── index.js           # Utility functions
│   ├── styles/                    # CSS source files
│   │   └── styles.css             # Main stylesheet
│   └── index.html                 # Main HTML template
├── package.json                   # Project metadata and dependencies
├── webpack.common.js              # Webpack common configuration
├── webpack.dev.js                 # Webpack development configuration
└── webpack.prod.js                # Webpack production configuration
```

## 🛠️ Teknologi

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: Webpack 5
- **Transpiler**: Babel
- **Maps**: Leaflet.js
- **API**: Fetch API dengan async/await
- **Styling**: CSS Grid & Flexbox
- **Accessibility**: Semantic HTML, ARIA labels
- **Transitions**: View Transition API

## 📱 Halaman

1. **🏠 Home** (`#/home`) - Daftar cerita dengan peta interaktif
2. **🔐 Login** (`#/login`) - Halaman masuk pengguna
3. **📝 Register** (`#/register`) - Halaman pendaftaran
4. **➕ Add Story** (`#/add`) - Form tambah cerita baru

## 🌟 Fitur Aksesibilitas

- ✅ Alt text pada semua gambar
- ✅ Semantic HTML (header, nav, main, footer, article, section)
- ✅ Label pada semua input form
- ✅ ARIA attributes untuk screen readers
- ✅ Keyboard navigation support
