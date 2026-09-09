# JanMitra

> **Remembering the people who matter.**

JanMitra is a private personal web application created for MyFriend (a Rishi/Swamiji) to preserve a dignified, structured digital record of important people encountered during his life, travels, and spiritual journey.

---

## 🔒 Private Access & Security Architecture

JanMitra is strictly a private personal space:
- **Private Access Control**: Unauthenticated visitors encounter a private authentication screen. Application views, databases, and person records are completely protected and inaccessible without valid authentication.
- **Firebase Authentication**: Integrated with email/password authentication mapped securely under username `janmitra` with authorized password-reset recovery.
- **Protected Firestore Security Rules**: Enforces `request.auth != null` across all data collections. Private person records are never exposed publicly or embedded statically.

---

## 🛕 Divine Atmosphere & Visual Design

The landing and authentication experience features an atmospheric visual environment inspired by **Lord Shiva**:
- **Cosmic Atmosphere**: Deep indigo and sapphire night sky with drifting celestial stardust.
- **Breathing Sacred Geometry**: Luminous concentric aura, crescent moon (Chandra) motif, and Trinetra/Trishula focal energy that moves in a serene, meditative breathing rhythm.
- **Mobile-First Optimization**: Designed for touchscreens, iPhones, Android phones, tablets, and desktop devices with full support for `prefers-reduced-motion` and adaptive battery management.

---

## 👤 Person-Centric Data Model

JanMitra prioritizes **Person** as the core entity:
- **Person Origin Focus**: State, District, and City/Town fields record the person's own home/origin rather than the transient meeting location.
- **Rich Context**: Preserves names, contacts, photographs, meeting dates, categories, and the spiritual/personal significance of each encounter.

---

## 🚀 Development Status

- **Phase 1**: Initial domain setup and responsive preview page.
- **Phase 2 (Current)**:
  - Private Firebase Authentication system with `janmitra` username mapping.
  - Password recovery reset flow targeting authorized recovery address.
  - Divine Lord Shiva animated canvas background.
  - Protected Dashboard with **ADD PERSON** and **FIND PEOPLE** actions.
  - Mobile & desktop responsive layout.
