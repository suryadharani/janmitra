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

## 🛕 Divine Atmosphere & Visual Design

The landing and authentication experience features an atmospheric visual environment inspired by **Lord Shiva**:
- **Cosmic Atmosphere**: Deep indigo and sapphire night sky with drifting celestial stardust.
- **Breathing Sacred Geometry**: Luminous concentric aura, crescent moon (Chandra) motif, and Trinetra/Trishula focal energy that moves in a serene, meditative breathing rhythm.
- **Mobile-First Optimization**: Designed for touchscreens, iPhones, Android phones, tablets, and desktop devices with full support for `prefers-reduced-motion` and adaptive battery management.

---

## 👤 Person-Centric Data Model & Multi-Category System

JanMitra prioritizes **Person** as the core entity:
- **Person Origin Focus**: State, District, and City/Town fields record the person's own home/origin association rather than transient meeting locations.
- **Multi-Category Assignment**: A single person record supports multiple categories simultaneously (e.g. `["Friends", "Professionals"]`) selected from official categories (*Sadhus*, *Swamijis*, *Peethadhipathis*, *Friends*, *Professionals*, *Job Holders*, *Skilled Women*, *Skilled Men*, *Devotee Sevaks*).
- **Structured Search & Filtering**: Includes text search combined with structured Category, State, District, and City/Town filters.

---

## 🚀 Development Status

- **Phase 1**: Initial domain setup and responsive preview page.
- **Phase 2**: Private Firebase Authentication system with `janmitra` username mapping and Lord Shiva divine background.
- **Phase 3**:
  - Connected to production Firebase project (`janmitra-598fe`).
  - Firebase Email/Password authentication system.
  - Production Firestore person records collection (`/persons`).
  - Single-user Firestore security rules (`request.auth.uid == "GHsl8zYWUYM9Ebo9kOUHxAEZIBn1"`).
  - Production data mode with zero demo/sample records.
- **Phase 3.1**:
  - Multi-select category selection support per person record.
  - Person-centric terminology refinement (e.g., *Date of Documentation / First Contact*, *Context & Significance*).
  - Structured combined filters (Category, State, District, City/Town) in Find People interface.
