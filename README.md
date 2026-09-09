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

## 🚀 Development Status

- **Phase 1**: Initial domain setup and responsive preview page.
- **Phase 2**: Private Firebase Authentication system with `janmitra` username mapping and Lord Shiva divine background.
- **Phase 3**: Connected to production Firebase project (`janmitra-598fe`), single-user security policy, and production data mode.
- **Phase 3.1**: Multi-category support, person-centric terminology, and structured filtering.
- **Phase 3.2**:
  - Integrated India LGD master geography dataset (28 States, 8 UTs, 780+ Districts).
  - Cascading State $\rightarrow$ District $\rightarrow$ City/Town selector with custom manual entry.
  - Person editing (`updateDoc`) and deletion with confirmation (`deleteDoc`) via card menu `⋮`.
  - Multi-category OR filter combined with cascading location AND filters in Find People view.
