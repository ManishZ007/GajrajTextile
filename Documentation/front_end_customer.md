# Gajraj Paithani — Customer Frontend

A modern e-commerce storefront for **Gajraj Paithani**, a traditional Indian Paithani saree brand.
Built with Next.js App Router, React 19, and TypeScript.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Components](#components)
- [Providers & Utilities](#providers--utilities)
- [3D Graphics](#3d-graphics)
- [Styling Conventions](#styling-conventions)
- [Data & Content](#data--content)
- [Environment Setup](#environment-setup)
- [Development](#development)

---

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 16.1.3 (App Router)         |
| UI Library  | React 19                            |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS 4 (PostCSS)            |
| Animations  | Framer Motion 12                    |
| Icons       | Lucide React                        |
| Auth        | NextAuth.js 5 (beta) — JWT strategy |
| 3D Graphics | React Three Fiber + Drei + Rapier   |
| Fonts       | Custom local font (`against.otf`)   |
| Linting     | ESLint (Next.js core-web-vitals)    |
| Formatting  | Prettier                            |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout, global metadata
│   ├── page.tsx                    # Landing page
│   ├── globals.css                 # Global styles, font-face, scrollbar hide
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── register/page.tsx       # Registration page
│   └── api/
│       └── auth/[...nextauth]/
│           └── route.ts            # NextAuth API route handler
│
├── auth.ts                         # NextAuth configuration & token logic
│
├── lib/
│   └── api.ts                      # Authenticated fetch utility
│
├── components/
│   ├── Navbar/
│   │   └── LandingNavbar.tsx       # Main navigation header
│   ├── Buttons/
│   │   └── Search.tsx              # Search icon button
│   └── 3d/
│       ├── LightScene.tsx          # R3F Canvas with lights + controls
│       ├── Scane.tsx               # Minimal R3F Canvas wrapper
│       └── LiquidGlassProvider/
│           └── Search.tsx          # Liquid glass 3D search element
│
├── provider/
│   ├── fonts.ts                    # Logo font export (LogoFont)
│   ├── Menu/
│   │   └── Menubar.tsx             # Navigation menu (desktop + mobile)
│   ├── Search/
│   │   └── LiveSearch.tsx          # Live search with debounce
│   └── types/
│       ├── menuProvider.ts         # Menu items data
│       ├── searchProvider.ts       # Search suggestions data
│       └── next-auth.d.ts          # NextAuth type extensions
│
└── Support/
    └── Menu.tsx                    # MenuButton component (hamburger toggle)

public/
├── fonts/
│   └── against.otf                 # Custom display font
└── images/
    ├── Web texture 1.png
    ├── Web texture 2.png
    └── Web texture 3.png
```

---

## Authentication

Authentication is handled by **NextAuth.js v5** using a **JWT session strategy**.

### Supported Providers

- **Credentials** — email + password
- **Google OAuth**
- **Facebook OAuth**

### Token Strategy

- On sign-in, an `accessToken` and `refreshToken` are stored in the JWT.
- `accessTokenExpires` is tracked to automatically refresh tokens before expiry.
- The JWT callback handles refresh logic on every session check.

### Session Shape

```typescript
session.accessToken; // Bearer token for API calls
session.error; // "RefreshAccessTokenError" if refresh fails
```

### Type Extensions (`next-auth.d.ts`)

NextAuth `User`, `Session`, and `JWT` interfaces are extended to include:

- `accessToken`
- `refreshToken`
- `accessTokenExpires`

### Auth Pages

| Route       | Description                                            |
| ----------- | ------------------------------------------------------ |
| `/login`    | Email/password + OAuth sign-in                         |
| `/register` | New account creation, auto signs in after registration |

---

## Components

### `LandingNavbar`

**Path:** `src/components/Navbar/LandingNavbar.tsx`

Fixed top navigation bar. Manages which panel is open via `activePanel` state.

```
activePanel: "search" | "menu" | null
```

- **Logo** — displays brand name in custom font
- **Hamburger toggle** — opens/closes the menu panel
- **Search toggle** — opens/closes the search panel
- Only one panel can be open at a time
- Scroll listener adjusts appearance on scroll
- Uses `AnimatePresence` for smooth panel transitions

### `Search` Button

**Path:** `src/components/Buttons/Search.tsx`

Simple icon button using Lucide's `Search` icon. Used inside the navbar to trigger the search panel.

### `MenuButton` (Support)

**Path:** `src/Support/Menu.tsx`

Standalone animated hamburger button component. Accepts an optional callback prop. Currently not in active use — the navbar manages its own toggle internally.

---

## Providers & Utilities

### `Menubar`

**Path:** `src/provider/Menu/Menubar.tsx`

Full navigation menu rendered inside the navbar panel.

- **Desktop**: Hovering a menu item highlights it with an animated pill underline. Items with `categories` show a dropdown.
- **Mobile**: Accordion-style expandable list. Tapping an item expands its sub-categories.
- Animated with Framer Motion (`AnimatePresence`, `motion.div`).
- Data source: `ITEMS` from `menuProvider.ts`.

### `LiveSearch`

**Path:** `src/provider/Search/LiveSearch.tsx`

Debounced live search input.

- **Debounce:** 300ms after last keystroke
- **Max results:** 3 suggestions shown at once
- **Navigation:** Selecting a result uses Next.js router to navigate
- **Loading state:** Spinner shown during debounce delay
- **Animations:** Dropdown fades in/out with Framer Motion
- Data source: `SUGGESTIONS` from `searchProvider.ts`

### `apiFetch`

**Path:** `src/lib/api.ts`

Wrapper around `fetch` that automatically:

1. Retrieves the current session
2. Checks if the refresh token has expired
3. Injects `Authorization: Bearer <token>` header
4. Sets `Content-Type: application/json`
5. Throws on non-OK responses

Use this for all authenticated API calls.

```typescript
const data = await apiFetch("/some/protected/endpoint", { method: "GET" });
```

### `LogoFont`

**Path:** `src/provider/fonts.ts`

Loads the custom `against.otf` font via `next/font/local`.  
CSS variable class: `LogoFont`  
Used on the brand name in the navbar.

---

## 3D Graphics

The project uses **React Three Fiber** for WebGL-based 3D rendering. Components are set up but not yet placed on the main landing page.

### `LightScene`

**Path:** `src/components/3d/LightScene.tsx`

Reusable R3F `<Canvas>` wrapper with:

- Ambient light (intensity: 0.5)
- Directional light (position: `[10, 10, 5]`)
- `OrbitControls` from Drei
- Accepts optional `className` prop

### `Scane`

**Path:** `src/components/3d/Scane.tsx`

Minimal R3F `<Canvas>` wrapper with only `OrbitControls`. Use when you want to manage your own lighting.

### `LiquidGlassProvider/Search`

**Path:** `src/components/3d/LiquidGlassProvider/Search.tsx`

A 3D decorative search element with a liquid glass effect using:

- `MeshTransmissionMaterial` (transmission: 0.9, roughness: 0.1)
- Chromatic aberration post-processing
- Plane geometry: `[2, 0.8, 0.1]`

---

## Styling Conventions

### Glassmorphism

The core visual language of the UI. Applied consistently across panels and overlays:

```css
background: rgba(0, 0, 0, 0.05);
backdrop-filter: blur(20px) saturate(180%);
```

### Globals (`globals.css`)

- Tailwind CSS v4 import
- `@font-face` for `against.otf` (display font for brand name)
- Webkit scrollbar hidden globally
- `overflow-x: hidden` on body

### Tailwind Config

- Tailwind CSS 4 is configured via PostCSS (`postcss.config.mjs`)
- No separate `tailwind.config.js` needed

### Animations

All transitions use **Framer Motion**. Key patterns:

- `AnimatePresence` for mount/unmount transitions
- `motion.div` with `initial`, `animate`, `exit` props
- Spring-based layout animations on the menu pill highlight

---

## Data & Content

### Menu Categories (`menuProvider.ts`)

| Label        | Sub-categories                              |
| ------------ | ------------------------------------------- |
| Double Padar | —                                           |
| Tissue Padar | —                                           |
| Fancy Padar  | —                                           |
| Muniya       | Single Muniya, Double Muniya, Triple Muniya |
| Brocket      | All Over Brocket, Border Work               |
| All Over     | —                                           |
| Duppata      | —                                           |

### Search Suggestions (`searchProvider.ts`)

Static suggestions shown in the live search dropdown:

| Label           | Route            |
| --------------- | ---------------- |
| Login           | /login           |
| Register        | /register        |
| Forgot Password | /forgot-password |
| Home            | /                |
| About Us        | /about           |
| Contact         | /contact         |
| Paithani Sarees | /products        |

---

## Environment Setup

Create a `.env.local` file in the project root with the following keys.  
**Never commit this file to version control.**

```
NEXT_PUBLIC_AUTH_SECRET=        # NextAuth secret (generate with: openssl rand -base64 32)

GOOGLE_CLIENT_ID=               # Google OAuth App client ID
GOOGLE_CLIENT_SECRET=           # Google OAuth App client secret

FACEBOOK_CLIENT_ID=             # Facebook App ID
FACEBOOK_CLIENT_SECRET=         # Facebook App secret
```

> Google OAuth is currently active. Facebook credentials need to be filled in to enable Facebook sign-in.

---

## Development

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.  
`next.config.ts` also allows connections from your local network IP for testing on mobile devices.

### Build for production

```bash
npm run build
npm start
```

### Lint & Format

```bash
npm run lint                  # ESLint
npx prettier . --write        # Prettier
```

---

## Notes

- **Three.js** is explicitly transpiled in `next.config.ts` to avoid ESM/CJS module issues.
- **NextAuth v5** is still in beta — check the changelog before upgrading.
- `Support/Menu.tsx` is a legacy hamburger component, kept for reference but not actively used.
- Texture images in `public/images/` are available but not yet placed on any page.
- All 3D components are ready to drop into any page without additional setup.
