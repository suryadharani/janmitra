# JanMitra

> **Remembering the people who matter.**

JanMitra is a private personal web application created for MyFriend (a Rishi/Swamiji) to preserve a dignified, structured digital record of important people encountered during his life, travels, and spiritual journey.

---

## 🔒 Private Access & Security Architecture

JanMitra is strictly a private personal space:
- **Private Access Control**: Unauthenticated visitors encounter a private authentication screen. Application views, databases, and person records are completely protected and inaccessible without valid authentication.
- **Firebase Authentication**: Integrated with email/password authentication mapped securely under username `janmitra` with authorized password-reset recovery.
- **Single-User Firestore Security Policy**: Deployed security rules restrict read and write access on `/persons/{personId}` strictly to the single authorized JanMitra account (`request.auth.uid == "GHsl8zYWUYM9Ebo9kOUHxAEZIBn1"`). All other reads and writes are blocked.

---

## 🇮🇳 India Geography Master Data & Cascading Location

- **LGD Master Data**: Built-in master geography dataset derived from the Government of India Local Government Directory (LGD). Covers all **28 States**, **8 Union Territories**, and **780+ Districts** with zero external API calls or cost dependencies.
- **Cascading Selectors**: State/UT selection dynamically enables and filters District choices. City/Town provides known recorded cities while preserving full manual entry freedom ("Other / Enter manually").
- **Origin Association**: State, District, and City/Town fields strictly represent the person's own home/origin/association.

---

## 🛕 Divine Atmosphere & Visual Design

The landing and authentication experience features an atmospheric visual environment inspired by **Lord Shiva**:
- **Cosmic Atmosphere**: Deep indigo and sapphire night sky with drifting celestial stardust.
- **Breathing Sacred Geometry**: Luminous concentric aura, crescent moon (Chandra) motif, and Trinetra/Trishula focal energy that moves in a serene, meditative breathing rhythm.
- **Mobile-First Optimization**: Designed for touchscreens, iPhones, Android phones, tablets, and desktop devices with full support for `prefers-reduced-motion` and adaptive battery management.

---

## 👤 Person Management & Multi-Category System

JanMitra prioritizes **Person** as the core entity:
- **Multi-Category Assignment**: A single person record supports multiple categories simultaneously (e.g. `["Friends", "Professionals"]`) selected from official categories (*Sadhus*, *Swamijis*, *Peethadhipathis*, *Friends*, *Professionals*, *Job Holders*, *Skilled Women*, *Skilled Men*, *Devotee Sevaks*).
- **Subtle Edit & Delete Controls**: Each card features a clean overflow menu `⋮` with options to edit existing records via `updateDoc()` or permanently remove records via `deleteDoc()` with confirmation.
- **Structured Search & Filtering**: Text search combined with multi-category OR selection and cascading State, District, and City/Town AND filters.

---

## 🖼️ Person Photograph & Expanded Person View (Phase 3.3)

- **Static City/Town Reference Dataset**: Built-in static reference cities mapped by State and District (e.g., Andhra Pradesh $\rightarrow$ NTR $\rightarrow$ Vijayawada) providing suggestions on fresh databases without external API calls while preserving full manual entry capabilities.
- **Client-Side Compressed Photographs**: Photo upload control with client-side `<canvas>` image compression (JPEG/WebP Data URLs, max $360 \times 360$ px, $\sim 15-30\text{ KB}$) keeping stored photos safely within Firestore document limits without external storage buckets or exposed URLs. Fallback to initials avatar when no photo exists.
- **Expanded Person View**: Clicking any person card (or search result) opens a comprehensive full-screen glassmorphism modal presenting all recorded details (photo, full name, contact, date, categories, location, context, notes) with direct action buttons (`Edit Person`, `Delete Person`, `Close`). Card overflow menu `⋮` remains strictly isolated for quick menu actions.

---

## 🚀 Development Status

- **Phase 1**: Initial domain setup and responsive preview page.
- **Phase 2**: Private Firebase Authentication system with `janmitra` username mapping and Lord Shiva divine background.
- **Phase 3**: Connected to production Firebase project (`janmitra-598fe`), single-user security policy, and production data mode.
- **Phase 3.1**: Multi-category support, person-centric terminology, and structured filtering.
- **Phase 3.2**: Integrated India LGD master geography (28 States, 8 UTs, 780+ Districts), cascading location selectors, person editing/deletion, and combined filters.
- **Phase 3.3.1**: Fixed Add/Edit modal vertical scrolling, dynamic viewport sizing (`100dvh`), and body scroll locking.
- **Phase 3.3.2**:
  - Integrated `📞 Call` direct dial action (`tel:`) across Landing cards, Find People results, and Expanded Person View footer for records with valid phone numbers.
  - Implemented client-side phone number normalization (`getTelHref()`) preserving leading `+` while sanitizing formatting characters and removing non-numeric strings safely.
  - Resolved Find People $\rightarrow$ Expanded View modal sequence: clicking a result closes Find People before opening Expanded View, preventing modal stacking while maintaining single-modal scroll lock.



