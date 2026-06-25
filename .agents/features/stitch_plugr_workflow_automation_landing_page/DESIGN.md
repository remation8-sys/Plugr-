---
name: Technical Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e6'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ededfb'
  surface-container-high: '#e7e7f5'
  surface-container-highest: '#e1e1ef'
  on-surface: '#191b25'
  on-surface-variant: '#434656'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#f0f0fd'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004dea'
  primary: '#0041c8'
  on-primary: '#ffffff'
  primary-container: '#0055ff'
  on-primary-container: '#e3e6ff'
  inverse-primary: '#b6c4ff'
  secondary: '#5b5d71'
  on-secondary: '#ffffff'
  secondary-container: '#dedef6'
  on-secondary-container: '#606175'
  tertiary: '#972500'
  on-tertiary: '#ffffff'
  tertiary-container: '#c13301'
  on-tertiary-container: '#ffe1d9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b3'
  secondary-fixed: '#e0e1f8'
  secondary-fixed-dim: '#c4c5dc'
  on-secondary-fixed: '#181a2b'
  on-secondary-fixed-variant: '#444558'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb5a0'
  on-tertiary-fixed: '#3b0900'
  on-tertiary-fixed-variant: '#872100'
  background: '#faf8ff'
  on-background: '#191b25'
  surface-variant: '#e1e1ef'
  deep-indigo: '#0d0e1a'
  charcoal-dark: '#121212'
  technical-grid: rgba(0, 85, 255, 0.05)
  success-green: '#00c853'
  error-red: '#ff3d00'
  warning-amber: '#ffab00'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 80px
  section-gap: 120px
---

## Brand & Style

This design system embodies "Engineering-First Modernity," a philosophy that balances high-end marketing aesthetics with the rigors of a developer-centric tool. It is designed for technical decision-makers who value transparency, extensibility, and systematic order.

The visual style is **Corporate / Modern** with a **Technical** overlay. It utilizes a "light-to-dark" narrative where high-level value propositions sit on clean, expansive white surfaces, while deep-dive technical features and infrastructure details transition into high-contrast, dark-mode environments. This duality signals a product that is approachable for teams but possesses the "under-the-hood" power required for enterprise-grade automation.

Key visual motifs include:
- **Modular Construction:** Every element feels like a component in a larger machine.
- **Data Transparency:** Using "technical" textures like grids and dots to suggest a canvas or blueprint.
- **Engineered Accents:** Precise borders and subtle glow effects that mimic terminal interfaces or high-end IDEs.

## Colors

The palette is anchored by a high-energy **Primary Brand Blue (#0055ff)**, signifying action and connectivity. 

### Surface Strategy
- **Light Mode:** Default for storytelling and top-of-funnel content. Uses pure white backgrounds to emphasize clarity and "modern SaaS" cleanliness.
- **Contrast Sections:** Deep indigo and charcoal are used for technical deep-dives (Self-hosting, Security, API blocks). This creates a mental shift for the user from "Product Benefit" to "Technical Reality."
- **Technical Accents:** Use the `technical-grid` color for background patterns (16px or 32px grids) in dark sections to reinforce the "blueprint" aesthetic.

### Semantic Roles
- **Success/Error/Warning:** High-saturation tokens used primarily for status indicators within workflow logs or "passed/failed" unit testing labels.

## Typography

This system uses **Inter** for all primary communication to ensure maximum legibility and a neutral, professional tone. To lean into the "engineering-first" aesthetic, **JetBrains Mono** (or a similar high-quality monospace font) is introduced for technical labels, status indicators, and code snippets.

- **Headlines:** Feature tight tracking and bold weights to command attention against whitespace.
- **Monospace Accents:** Used sparingly for "Overlines" (labels above headings), metadata, and actual code. All caps should be applied to `label-mono` for a "tag" or "chip" appearance.
- **Information Density:** Body copy maintains a generous line height (1.6) to ensure that even text-heavy technical documentation remains readable.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for marketing pages to ensure controlled reading paths, transitioning to a **Fluid Grid** for technical dashboards and node canvases.

### Grid System
- **12-Column Desktop Grid:** 24px gutters. Content typically spans 6 columns for text blocks or 4 columns for feature grids.
- **Vertical Rhythm:** A strict 4px baseline unit. 
- **Information Density:** Technical sections (e.g., "Observability") should utilize tighter vertical padding between list items to reflect the "dense but readable" engineering aesthetic.

### Responsive Behavior
- **Desktop (1440px+):** 80px side margins.
- **Tablet (768px - 1024px):** 40px side margins, grid collapses to 6 columns.
- **Mobile (<768px):** 16px side margins, single-column reflow. Typography scales down (use `headline-lg-mobile`).

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **High-Contrast Outlines** rather than heavy shadows.

- **Flat Surfaces:** Primary interface elements sit flat on the surface with 1px borders.
- **Technical Glow:** In dark-mode sections, cards do not use standard shadows. Instead, they use a subtle, 1px Primary Blue inner-glow or an outer-glow (blur: 20px, opacity: 0.1) that triggers only on hover.
- **Ghost Borders:** Use low-opacity borders (`rgba(0,0,0,0.1)` on light or `white/0.1` on dark) to define card boundaries without creating visual clutter.
- **Node Depth:** On the canvas, nodes use a slight "Ambient Shadow" (offset: 4px, blur: 12px, opacity: 0.05) to distinguish them from the grid background.

## Shapes

The shape language is **Soft** but precise. By utilizing an 8px to 12px radius, the UI avoids the playfulness of "pill" shapes while remaining more modern than hard "sharp" corners.

- **Buttons:** 8px radius (precise and architectural).
- **Cards/Containers:** 12px radius (`rounded-lg`).
- **Input Fields:** 8px radius.
- **Icons:** Technical iconography should use thin strokes (1.5px) with sharp terminals, housed in 32px or 48px square containers with an 8px radius.

## Components

### Buttons
- **Primary:** Solid `#0055ff` background, white text, 8px radius. No shadow.
- **Secondary:** Transparent background, 1px `#0055ff` border.
- **Tertiary (Technical):** Dark grey background with 1px white/0.1 border for use in contrast sections.

### Cards (High-Contrast Style)
- **Standard:** White background, 1px light-grey border.
- **Technical:** Deep indigo background, 1px white/0.1 border. On hover, the border changes to Primary Blue and a subtle 10% blue glow is applied.

### Inputs & Logic Fields
- Fields should look "system-native." Use a 1px border and the Monospace font for input text if it's a technical parameter (e.g., JSON key).

### Technical Iconography
- Icons must be monochromatic (Slate or White) with Primary Blue used only for the most critical focal point of the icon. 
- Style: Line-based, 1.5px stroke width.

### Status Chips
- Small, uppercase `label-mono` text.
- Left-aligned dot indicator (Success/Error/Warning colors) to reinforce the "log" or "terminal" feeling.