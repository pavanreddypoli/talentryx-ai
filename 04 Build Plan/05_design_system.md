# Design System — Extracted from Landing Page

Source: `app/page.tsx` (commit `36c184f`)
Status: **Approved — ready for implementation (with modifications from review)**

---

## 1. Visual Primitives Extracted

### 1.1 Color Palette

| Token name (proposed) | Raw value | Usage in page.tsx |
|---|---|---|
| `brand-navy` | `#0a0e27` | Nav bg, hero bg, footer bg, CTA text, footer |
| `brand-navy-mid` | `#1e1b4b` | Hover state on dark CTA (`hover:bg-[#1e1b4b]`), CTA gradient via |
| `brand-navy-deep` | `#312e81` | CTA block gradient end |
| `brand-canvas` | `#fafaf7` | Page body bg, "How it works" section, outer CTA section |
| `brand-amber` | `#f59e0b` (amber-400) | Primary CTA fill, logo gradient, score ring gradient start |
| `brand-amber-light` | `#fcd34d` (amber-300) | Heading `<em>` italic, hover state on primary CTA, score ring accent |
| `brand-amber-dark` | `#d97706` (amber-600) | "Potential" badge text |

Semantic overlay colors (used as Tailwind opacity modifiers, not separate tokens):
- `white/5`, `white/10`, `white/20`, `white/70` — text and borders on dark backgrounds
- `black/40` — card shadow modifier
- `slate-200` — card borders on light
- `slate-600` — body text secondary on light
- `white/[0.04]`, `white/[0.06]` — glass card fill on dark

Score-tier colors (already in Tailwind, no custom tokens needed):
- Emerald-600 / emerald-50 / emerald-100 — strong match
- Amber-600 / amber-50 / amber-200 — potential
- Rose-600 / rose-50 / rose-200 — low match

### 1.2 Typography

| Role | Font family | Tailwind class | Weights used |
|---|---|---|---|
| Display / headings | Fraunces (Google Font, serif) | `font-display` (proposed) | 400, 500, 600, 700; normal + italic |
| Body / UI | Geist Sans | `font-sans` (existing) | 400, 500, 600, 700 |
| Mono / code | Geist Mono | `font-mono` (existing) | 400 |

Heading size ramp:
- H1 hero: `text-5xl md:text-6xl lg:text-7xl` · `leading-[1.05]` · `tracking-tight` · `font-medium`
- H2 section: `text-4xl md:text-5xl` or `text-3xl md:text-4xl` · same leading/tracking
- H3 card: `text-lg font-semibold` or `text-base font-semibold`

Body: `text-base leading-relaxed` (hero body), `text-sm leading-relaxed` (card body)
Labels: `text-xs font-semibold tracking-wider uppercase` (section eyebrows)
Micro/data: `text-[10px]`–`text-[13px]` (mock cards, badges)

### 1.3 Spacing Scale

| Context | Value |
|---|---|
| Page container | `mx-auto max-w-7xl px-6` |
| Standard section | `py-20` |
| Hero section | `py-20 lg:py-28` |
| Card internal (large) | `p-7` |
| Card internal (standard) | `p-6` |
| Card internal (compact) | `px-5 py-3` or `px-5 py-4` |
| Grid gaps (features) | `gap-5` (tight) · `gap-8` (medium) · `gap-12 lg:gap-16` (section) |
| Stack spacing | `space-y-3` (buttons) · `space-y-5` (card stacks) |
| Button gap (icon+label) | `gap-1.5` (sm) · `gap-2` (default) |
| Section heading bottom | `mb-3` (eyebrow to h2) · `mb-5` (h2 to body) |

### 1.4 Border Radius

| Size | Tailwind | Used for |
|---|---|---|
| `rounded-full` | pill | All CTA buttons, badges, pills, social icon rings |
| `rounded-3xl` | 24px | Final CTA block |
| `rounded-2xl` | 16px | Feature cards, mock panels, hero glow |
| `rounded-xl` | 12px | Feature icon containers |
| `rounded-lg` | 8px | Candidate row hover areas, boost suggestion rows |
| `rounded-md` | 6px | Inline badges (score boost suggestions) |

The page uses **no `rounded-sm` or `rounded-none`**. The dominant shapes are `rounded-full` (interactions) and `rounded-2xl` (containers).

### 1.5 Shadows

| Name (proposed) | Raw Tailwind / value | Used for |
|---|---|---|
| `shadow-card` | `shadow-2xl shadow-black/40` | Mock dashboard panels |
| `shadow-cta-sm` | `shadow-[0_4px_24px_rgba(251,191,36,0.35)]` | Nav "Get started" button |
| `shadow-cta` | `shadow-[0_8px_32px_rgba(251,191,36,0.3)]` | Hero/section primary CTAs |
| `shadow-cta-lg` | `shadow-[0_8px_32px_rgba(251,191,36,0.4)]` | Final CTA button |
| `shadow-cta-hover` | `shadow-[0_12px_40px_rgba(251,191,36,0.45-0.55)]` | CTA hover states |
| `shadow-logo` | `shadow-[0_0_20px_rgba(251,191,36,0.4)]` | Logo mark glow |
| `shadow-feature` | `shadow-lg shadow-slate-200/50` | Feature card hover on light bg |
| `shadow-icon` | `shadow-lg` or `shadow-md` | Feature icon gradient squares |

### 1.6 Button Styles

Three distinct button shapes appear on the page. None are rendered via `<Button>` from `components/ui/button.tsx` — they are inline Tailwind in page.tsx.

| Variant | Shape | Fill | Text | When used |
|---|---|---|---|---|
| `primary` | `rounded-full px-7 py-3.5` | `bg-amber-400 hover:bg-amber-300` | `text-[#0a0e27] font-semibold text-sm` | Main CTAs on dark bg |
| `primary-lg` | `rounded-full px-7 py-4` | same | `font-bold` | Final CTA block |
| `primary-sm` | `rounded-full px-5 py-2` | same | `font-semibold text-sm` | Nav "Get started" |
| `ghost` | `rounded-full px-7 py-3.5` | `bg-white/5 border border-white/20 hover:bg-white/10` | `text-white font-semibold text-sm` | Secondary CTA on dark bg |
| `dark` | `rounded-full px-6 py-3` | `bg-[#0a0e27] hover:bg-[#1e1b4b]` | `text-white font-semibold text-sm` | CTA on light bg |

All three use `inline-flex items-center justify-center gap-2` and include an arrow icon with `group-hover:translate-x-0.5` for motion.

### 1.7 Card Styles

| Variant | Used for |
|---|---|
| `light` | White bg, `border-slate-200`, `rounded-2xl`, `hover:shadow-lg` — How-it-works steps |
| `light-gradient` | `from-white to-slate-50/50`, same border/radius — Recruiter feature grid |
| `glass-dark` | `bg-white/[0.04] border-white/10 backdrop-blur-sm rounded-2xl` — Job seeker feature grid |
| `mock-panel` | `bg-white shadow-2xl shadow-black/40 rounded-2xl overflow-hidden` — Hero illustrations |

### 1.8 Animation Patterns

| Name | Keyframes | Duration / easing | Used for |
|---|---|---|---|
| `fade-up` | `opacity 0→1`, `translateY 16px→0` | `0.8s cubic-bezier(0.16,1,0.3,1)` | All hero/section content, staggered via `animationDelay` |
| `float` | `translateY 0 → -8px → 0` | `6s ease-in-out infinite` | Floating "Two AIs / one platform" badge |
| `pulse-soft` | `opacity 1 → 0.6 → 1` | `2s ease-in-out infinite` | Subtle element emphasis |
| `shimmer` | `backgroundPosition -200%→200%` | (keyframe defined, not applied to anything yet) | Future skeleton/loading states |
| `animate-ping` | Tailwind built-in | `1s cubic-bezier(0,0,0.2,1) infinite` | Live status dots (nav badge, hero card) |
| Score counter | JS `setInterval`, 30 frames at 30ms | `~900ms total` | Animated score numbers in hero |
| Score ring | SVG `strokeDashoffset` CSS transition | `0.6s ease-out` | Circular score ring fill |

Stagger pattern: `0ms, 100ms, 200ms, 300ms, 400ms, 500ms` for sequential hero elements; `700ms, 820ms, 940ms` for candidate rows.

---

## 2. Where to Centralize — Recommendation

### 2.1 `tailwind.config.ts` — color tokens + custom font + animation utilities

**Why here:** Tailwind processes these at build time into utility classes. You get `bg-brand-navy`, `text-brand-amber`, `font-display`, `animate-fade-up` as first-class utilities usable anywhere in JSX without className gymnastics.

**What goes here:**

```ts
theme: {
  extend: {
    colors: {
      brand: {
        navy:    '#0a0e27',
        'navy-mid':  '#1e1b4b',
        'navy-deep': '#312e81',
        canvas:  '#fafaf7',
        amber:   '#f59e0b',  // = amber-400
        'amber-light': '#fcd34d',  // = amber-300
      },
    },
    fontFamily: {
      display: ['Fraunces', 'serif'],
    },
    keyframes: {
      fadeUp: {
        from: { opacity: '0', transform: 'translateY(16px)' },
        to:   { opacity: '1', transform: 'translateY(0)' },
      },
      float: {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%':      { transform: 'translateY(-8px)' },
      },
      pulseSoft: {
        '0%, 100%': { opacity: '1' },
        '50%':      { opacity: '0.6' },
      },
      shimmer: {
        '0%':   { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    },
    animation: {
      'fade-up':    'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
      'float':      'float 6s ease-in-out infinite',
      'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      'shimmer':    'shimmer 1.5s linear infinite',
    },
    boxShadow: {
      'cta-sm':    '0 4px 24px rgba(251,191,36,0.35)',
      'cta':       '0 8px 32px rgba(251,191,36,0.30)',
      'cta-lg':    '0 8px 32px rgba(251,191,36,0.40)',
      'cta-hover': '0 12px 40px rgba(251,191,36,0.50)',
      'logo':      '0 0 20px rgba(251,191,36,0.40)',
      'card':      '0 25px 50px rgba(0,0,0,0.40)',
    },
  },
}
```

**Why not `globals.css` for these:** Color tokens as CSS variables are fine at runtime but don't generate utility classes automatically in Tailwind v4's setup. Keeping them in `tailwind.config.ts` lets you write `bg-brand-navy` and have IDE autocomplete.

### 2.2 `app/globals.css` — complex backgrounds + grain overlay

**Why here:** The radial gradient mesh and grain overlay background patterns are too complex for Tailwind utilities. They also need to be usable as CSS class names.

**What goes here:**

```css
/* Reusable mesh backgrounds */
.bg-hero-mesh { background-image: radial-gradient(...navy palette...); }
.bg-seekers-mesh { background-image: radial-gradient(...amber/violet...); }

/* Grain overlay — used on 3 sections */
.grain-overlay {
  background-image: url("data:image/svg+xml,...");
  mix-blend-mode: overlay;
}
```

Move the inline `<style>` block currently in `page.tsx` into `globals.css`. It's global by nature (keyframes and class names), not scoped to the page.

**Out of scope (review modification):** Do NOT change `--primary` or `--radius` in `:root`. `--primary` (currently OKLCH dark navy) is consumed by every shadcn component's `default` variant — changing it would silently repaint every Button, Badge, and Input across the dashboard. The new `brand-primary` / `brand-ghost` / `brand-dark` variants in `button.tsx` are sufficient for landing page work without touching the shared token. `--radius` (currently `0.625rem`) is similarly global; `card.tsx` will be updated explicitly instead.

### 2.3 `components/ui/` — button and card variants

**Why here:** The component library is what all pages and dashboard views will use. If `Button` doesn't have a `primary` variant that matches the landing, every developer building a new page has to re-implement the amber pill from scratch. Centralizing in CVA variants means a single source of truth.

**What goes here:**

- `button.tsx` — add `brand-primary`, `brand-ghost`, `brand-dark` variants; change the base from `rounded-md` to the variant-appropriate radius
- `card.tsx` — add `light-gradient` and `glass-dark` variants via a `variant` prop

---

## 3. Component Inventory

### 3.1 Components that need style updates

**`components/ui/button.tsx`** — needs new variants
- Base shape: `rounded-md` — landing never uses this for interactive buttons
- `default` variant: `bg-primary` maps to dark navy, not the amber primary action; this is confusing
- Missing: amber pill primary, glass ghost on dark, dark navy pill
- Update: add `brand-primary` (amber fill, rounded-full), `brand-ghost` (glass, rounded-full), `brand-dark` (navy, rounded-full) variants. Do not remove existing variants — they're used in the dashboard

**`components/ui/card.tsx`** — needs radius and variant update
- `rounded-xl` → should be `rounded-2xl` to match landing (all cards and panels)
- `shadow-sm` is too subtle — landing uses `shadow-lg hover:shadow-xl` progression
- Missing: glass-dark variant for job-seeker dark-background sections
- Update: bump base radius to `rounded-2xl`, add optional `variant="glass-dark"` and `variant="light-gradient"` props
- **⚠ Global impact:** The base `rounded-xl → rounded-2xl` change is NOT landing-page-specific — it affects every existing `<Card>` across the entire app (dashboard, history page, any other consumers). Audit all Card usages before and after this step and verify the dashboard renders correctly.

**`components/ui/dialog.tsx`** — minor radius update
- `DialogContent` uses `rounded-lg` — should be `rounded-2xl` for visual consistency with card language
- Single-line change in the `DialogContent` className

**`components/ui/alert.tsx`** — needs a brand variant
- Current: only `default` and `destructive`
- Missing: an amber/warning variant matching the landing's `bg-amber-50 border-amber-200` pattern
- Update: add `brand` variant to `alertVariants`

### 3.2 Components already aligned with landing page style

**`components/ui/input.tsx`** — aligned
- `rounded-md border border-input` is correct for form fields (landing doesn't put inputs on marketing pages)
- `h-9` standard height is fine

**`components/ui/textarea.tsx`** — aligned
- `rounded-md border border-input` matches the dashboard's JD textarea
- `field-sizing-content` for auto-height is a good fit

**`components/ui/skeleton.tsx`** — aligned
- `animate-pulse rounded-md bg-accent` — neutral, works for loading states anywhere
- Adding `shimmer` animation later would make it richer (already defined in proposed keyframes)

**`components/ui/table.tsx`** — aligned
- `hover:bg-muted/50` maps to `hover:bg-slate-50` — consistent with the landing's candidate row hover
- `text-sm` base is correct

**`components/ui/separator.tsx`** — aligned
- `bg-border` → `border-slate-200` equivalent; neutral and correct

---

## 4. Recommended File Structure

```
tailwind.config.ts          ← brand color tokens, font-display, animation utilities, shadow tokens
app/globals.css             ← mesh bg classes, grain-overlay (NO --primary or --radius changes)
components/ui/button.tsx    ← add brand-primary, brand-ghost, brand-dark variants
components/ui/card.tsx      ← bump to rounded-2xl [global], add glass-dark + light-gradient variants
components/ui/dialog.tsx    ← rounded-lg → rounded-2xl in DialogContent
components/ui/alert.tsx     ← add brand amber variant
```

No new files needed. No changes to any API route or layout.

---

## 5. Implementation Order (for follow-up task)

1. `tailwind.config.ts` — tokens first; everything else depends on them
2. `app/globals.css` — add mesh background classes and grain-overlay class (NO `--primary` or `--radius` changes)
3a. `app/page.tsx` — move inline `<style>` block verbatim into `globals.css`; no class name changes in JSX (mechanical move only, landing page must render identically)
3b. `app/page.tsx` — replace hardcoded values with new tokens (`bg-[#0a0e27]` → `bg-brand-navy`, `shadow-[0_8px_32px_rgba...]` → `shadow-cta`, etc.)
4. `components/ui/button.tsx` — add variants
5. `components/ui/card.tsx` — add variants + radius bump (⚠ verify dashboard after this commit)
6. `components/ui/dialog.tsx` — radius bump
7. `components/ui/alert.tsx` — brand variant
8. Visual smoke test: landing page, login, dashboard — confirm nothing regressed

Each step is its own commit. Browser-verify landing page after steps 1, 3a, 3b, and 5 at minimum.

Total estimated diff: ~120 lines across 7 files. All changes are additive (new variants, new tokens) except the `<style>` block move (step 3a) and two one-line radius changes (steps 5, 6).
