# JANMITRA (जनमित्र) — MASTER PROJECT CONTEXT & ARCHITECTURE COMPENDIUM

> **Last Updated:** September 10, 2026  
> **Repository:** `https://github.com/suryadharani/janmitra`  
> **Target Branch:** `main`  
> **Latest Commit Hash:** `65c9ce0578991cd15951d8ba6aeb704ad14a9de9`  
> **Live Site URL:** `https://suryadharani.github.io/janmitra/` (`janmitra.is-cool.dev`)

---

## 1. PURPOSE & VISION

JanMitra ("Friend of the People") is a private, personal web space dedicated to **MyFriend (Swamiji / Rishi)**. It serves as a sacred and secure personal archive for preserving important human relationships, meaningful personal connections, and biographical/contact records across spiritual seekers, sadhus, professionals, devotees, and friends.

### Core Guiding Principles:
- **Private Personal Access:** JanMitra is strictly private and never publicly exposed without authentication.
- **Person-Centric Architecture:** Focuses on *people and relationships* rather than generic business/meeting logs.
- **Divine Shiva Visual Experience:** Features a dark, radiant, atmospheric canvas with an animated cosmic Shiva aura (`shiva-canvas.js`).
- **No Build-Tool Overhead:** Uses pure vanilla HTML, CSS, JavaScript (ES modules), and Firebase Web SDK (v10 CDN imports).

---

## 2. REPOSITORY & FILE STRUCTURE

```text
d:\AI\gemini\github_pages_sites\janmitra\
├── index.html                 # Single Page Application HTML shell with all modal structures
├── style.css                  # Modern Vanilla CSS design system, glassmorphic cards, viewport scroll fixes
├── js/
│   ├── firebase-auth.js       # Core Application Controller (Auth, Firestore CRUD, Modals, Image Viewer)
│   ├── firebase-config.js     # Firebase Project Configuration (janmitra-598fe)
│   ├── india-geography.js     # Built-in India State & District master taxonomy module
│   └── shiva-canvas.js        # HTML5 Canvas particles & cosmic aura background renderer
└── README.md                  # Project overview documentation
```

---

## 3. IMPLEMENTED FEATURE INVENTORY (PHASES 1 — 3.3.4)

### Phase 1 & 2: Authentication & Shiva Experience
- **Gated Access Screen:** Gated login view with username `janmitra` mapping to Firebase Auth account `srigiribhuvaneshwaridevi@gmail.com` (passcode: `shivayya`).
- **Forgot Password Modal:** Triggers email password reset via Firebase Auth (`sendPasswordResetEmail`).
- **Canvas Backdrop:** Real-time interactive Shiva particle canvas running seamlessly behind modals.

### Phase 3 & 3.1: Real Firebase Integration & Multi-Select Categories
- **Firestore Integration:** Collection `persons` storing name, contact, date, categories array, origin location, context, notes, and base64 photograph.
- **Multi-Select Categories:** Support for assignable tags:
  - *Sadhus, Swamijis, Peethadhipathis, Friends, Professionals, Job Holders, Skilled Women, Skilled Men, Devotee Sevaks*.
- **Person-Centric Terms:** Replaced meeting-centric language with documentation & relationship terms.

### Phase 3.2: India Master Geography & Cascading Filters
- **Built-in India Master Data (`india-geography.js`):** 36 States/UTs with complete district mappings (e.g. *Andhra Pradesh → NTR / Nandyal / Krishna*).
- **Cascading Selections:** Selecting State dynamically populates District options for both Add/Edit form and Find People filters.
- **Multi-Select Category Filter (OR Logic):** Checkbox grid allowing multi-category filtering in Find People search.

### Phase 3.3: Reference Data City Suggestions & Photograph Handling
- **Reference City Suggestions:** City/Town dropdown offers static master city suggestions (e.g. *Vijayawada, Srisailam*) without relying on pre-existing database records.
- **Photograph Upload & Compression:** Browser-side canvas image resizing (max 600px width/height, 0.75 JPEG compression) before base64 storage.

### Phase 3.3.1 — 3.3.3: Viewport & Flex Modal Scroll Architecture
- **Definite Viewport Constraint (`height: calc(100dvh - 32px)`):** Ensures `#expanded-person-modal .modal-glass-card` uses a deterministic height bound across mobile address bars and desktop browsers.
- **Fixed Header & Footer:** Header and Action Footer (`📞 Call`, `✏️ Edit Person`, `🗑️ Delete Person`) stay anchored at top and bottom (`flex: 0 0 auto`).
- **Internal Body Grid Scroll (`flex: 1 1 auto; min-height: 0; height: 0; overflow-y: auto;`):** Forces details grid to scroll internally without page-level clipping or requiring browser zoom-out.
- **Action Rules:** Collapsed dashboard cards display only `Call` & card expansion. `Edit` and `Delete` are strictly contained inside Expanded Person View.

### Phase 3.3.4: Standalone Image Viewer Overlay
- **Independent High Z-Index Layer (`z-index: 300`):** Opens above Expanded Person View (`z-index: 100`).
- **Aspect Ratio Preservation (`object-fit: contain`):** Displays full-size photograph within max viewport dimensions (`max-width: 92vw; max-height: 85vh`).
- **State & Scroll Retention:** Closing the image viewer (via `×`, backdrop click, or `Esc` key) leaves the underlying Expanded Person View modal active at its exact vertical scroll position.

---

## 4. FIREBASE CONFIGURATION & SECURITY SCHEME

### Web App Config (`janmitra-598fe`):
- **Project ID:** `janmitra-598fe`
- **Auth Domain:** `janmitra-598fe.firebaseapp.com`
- **Firestore Collection:** `persons`

### Deployed Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /persons/{personId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 5. RECENT COMMITS & DEVELOPMENT LOG

```text
commit 65c9ce0578991cd15951d8ba6aeb704ad14a9de9
Author: suryadharani
Date:   Thu Sep 10 09:42:25 2026 +0530
    JanMitra Phase 3.3.4: Add Image Viewer Overlay Layer with full aspect-ratio preservation and scroll state retention

commit f54d9819f2b0b9887f6566200891f73bda267b19
Author: suryadharani
Date:   Thu Sep 10 08:43:46 2026 +0530
    JanMitra Phase 3.3.3: Enforce explicit viewport height constraint on modal glass card and height:0 flex-basis on expanded body grid
```

---

## 6. PENDING SECURITY & FUTURE ROADMAP

1. **Firestore Storage Migration (Optional Phase 4):**
   - Transition photograph storage from base64 string attributes in Firestore documents to Firebase Cloud Storage blobs (`/persons/{personId}/photo.jpg`) for optimal document size.
2. **App Check Protection:**
   - Enable Firebase App Check with reCAPTCHA v3 or Play Integrity to prevent unauthorized API requests outside official domain origin.
3. **Multi-User / Multi-Tenant Security Scope:**
   - If multi-user access is enabled in the future, enforce `request.auth.uid == resource.data.createdBy` in Firestore rules.

---

## 7. MULTI-SITE EXPANSION BLUEPRINT (TEMPLATE FOR SISTER SITES)

When creating similar independent personal web applications for other Swamijis, Rishis, or close friends (e.g. *GurudevMitra, RishiMitra, SevaMitra*):

### Architecture Reuse Checklist:
1. **Fork/Clone Repository Pattern:** Clone `janmitra` base HTML/CSS/JS shell.
2. **Isolated Firebase Project:** Provision dedicated Firebase Web Project per site (e.g. `gurudevmitra-1234`).
3. **Custom Visual Palette:** Modify CSS custom properties in `:root`:
   - Primary Accent (`--emerald-primary` $\rightarrow$ `--gold-accent` or `--cyan-accent`)
   - Canvas Theme (`shiva-canvas.js` color parameters)
4. **Geography & Category Customization:** Update `india-geography.js` or official category lists in `index.html` to align with the specific spiritual/service scope of the target site.

---

*This document contains the complete context required to resume development seamlessly at any point in the future.*
