---
name: Dev-Centric Interview Engineering System
colors:
  surface: '#1e100b'
  surface-dim: '#1e100b'
  surface-bright: '#48352f'
  surface-container-lowest: '#180b06'
  surface-container-low: '#281813'
  surface-container: '#2c1c16'
  surface-container-high: '#372620'
  surface-container-highest: '#43302a'
  on-surface: '#fadcd3'
  on-surface-variant: '#e5beb2'
  inverse-surface: '#fadcd3'
  inverse-on-surface: '#3e2c26'
  outline: '#ac897e'
  outline-variant: '#5c4038'
  surface-tint: '#ffb59d'
  primary: '#ffb59d'
  on-primary: '#5d1800'
  primary-container: '#ff5712'
  on-primary-container: '#511400'
  inverse-primary: '#ac3400'
  secondary: '#c6c7c2'
  on-secondary: '#2f312e'
  secondary-container: '#484a46'
  on-secondary-container: '#b8b9b4'
  tertiary: '#a8c8ff'
  on-tertiary: '#003061'
  tertiary-container: '#3491ff'
  on-tertiary-container: '#002955'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390b00'
  on-primary-fixed-variant: '#832600'
  secondary-fixed: '#e3e3de'
  secondary-fixed-dim: '#c6c7c2'
  on-secondary-fixed: '#1a1c19'
  on-secondary-fixed-variant: '#464744'
  tertiary-fixed: '#d5e3ff'
  tertiary-fixed-dim: '#a8c8ff'
  on-tertiary-fixed: '#001b3c'
  on-tertiary-fixed-variant: '#004689'
  background: '#1e100b'
  on-background: '#fadcd3'
  surface-variant: '#43302a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  nav-height: 56px
---

## Brand & Style
The design system is built for a high-performance, developer-focused environment. It adopts a **Technical Minimalism** aesthetic, drawing heavy inspiration from modern IDE interfaces. The primary objective is to minimize cognitive load during high-stakes interview preparation by utilizing a "lights-out" color palette that emphasizes content and code.

The personality is professional, precise, and utilitarian. It treats the user as an engineer, not just a candidate. Visual hierarchy is established through structural layering and high-contrast accents rather than decorative flourishes. Surfaces use subtle tonal shifts to indicate depth, creating a focused workspace that feels like a native tool rather than a generic website.

## Colors
The color palette is strictly functional. The **Canvas** color provides the deepest backdrop, used for the main application area. **Surface Base** and **Surface Raised** create a structural hierarchy for panels, sidebars, and navigation, mimicking the layout of a code editor.

The **Primary (Cursor Orange)** is used sparingly for high-priority actions and brand recognition. Semantic colors for success, warning, and error are reserved for feedback loops (e.g., test case results, compiler warnings). Borders play a critical role in this system, acting as the primary separator in place of shadows.

## Typography
This design system utilizes a dual-font approach. **Inter** handles all UI-related communication, chosen for its exceptional legibility and neutral character. **JetBrains Mono** is utilized for code snippets, data labels, and technical metadata, reinforcing the developer-centric feel.

Large display headings use tight letter spacing to maintain a compact, "engineered" look. Smaller labels utilize uppercase monospace styling to denote metadata (e.g., "DIFFICULTY: HARD" or "RUNTIME").

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for dashboard views, often mimicking a 3-pane IDE layout (Navigator, Editor, Inspector). 

- **Desktop:** Uses a 12-column grid or flexible panels with fixed sidebars.
- **Mobile:** Single column layout with hidden sidebars accessible via "Drawer" patterns.
- **Standard Spacing:** A 4px baseline grid ensures alignment. All margins and paddings should be multiples of 4px.

Panels are separated by 1px borders rather than gaps, maximizing the screen real estate for code and documentation.

## Elevation & Depth
This design system eschews traditional soft shadows in favor of **Tonal Layering** and **High-Contrast Outlines**. 

Depth is communicated through the background color of the surface:
1. **Level 0 (Canvas):** The furthest back (Main Page).
2. **Level 1 (Surface Base):** Standard content cards.
3. **Level 2 (Surface Raised):** Navigation and sticky elements.
4. **Level 3 (Surface Elevated):** Popovers, dropdowns, and modals.

1px borders in `border_default` define the edges of every surface. When a component is focused or active, the border color shifts to the `primary_color_hex` to provide clear visual affordance.

## Shapes
The shape language is disciplined and geometric. While the "Rounded" setting (8px) is the standard for cards and primary buttons, secondary inputs and smaller elements use a slightly tighter radius (6px) to maintain a crisp, professional appearance. 

- **Standard (8px):** Cards, Buttons, Modals.
- **Compact (6px):** Inputs, Search bars.
- **Utility (4px):** Badges, Tooltips, Chips.

## Components
Consistent component implementation is vital for the IDE feel:

- **Navigation Bar:** 56px height, `surface_raised` background. Active states use a bottom-border indicator or a left-rail indicator in `primary_color_hex`.
- **Buttons:** 
    - **Primary:** `primary_color_hex` background with white text. 
    - **Secondary:** Transparent background with `border_default` and `text_primary`. 
    - **Ghost:** No background or border until hover.
- **Inputs:** `surface_elevated` background, 1px `border_default`. On focus, the border transitions to `primary_color_hex`.
- **Cards:** `surface_base` background with a 1px `border_default`. No shadows.
- **Badges:** Background color is set to 15% opacity of the text color (e.g., a "Hard" badge uses red text on a faint red tint).
- **Code Editor:** Fixed `code_editor_bg` (#1e1e1e) to differentiate the work area from the UI panels.
- **Animations:** All state changes (hover, focus, transitions) use a fast `300ms` cubic-bezier(0.16, 1, 0.3, 1) to feel snappy and responsive.