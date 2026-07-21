---
name: Heritage & Horizon
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadd'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#3f484c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#6f787d'
  outline-variant: '#bec8cd'
  surface-tint: '#006781'
  primary: '#005a71'
  on-primary: '#ffffff'
  primary-container: '#0e7490'
  on-primary-container: '#d3f1ff'
  inverse-primary: '#81d1f0'
  secondary: '#934b1b'
  on-secondary: '#ffffff'
  secondary-container: '#ffa26b'
  on-secondary-container: '#783605'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cea62b'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b9eaff'
  primary-fixed-dim: '#81d1f0'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#004d62'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68d'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#753403'
  tertiary-fixed: '#ffe08e'
  tertiary-fixed-dim: '#ecc246'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  price-display:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  section-padding: 80px
---

## Brand & Style

The design system is engineered to evoke the tactile quality of a high-end travel monograph while maintaining the frictionless utility of a modern booking engine. It targets a sophisticated global traveler seeking "quiet luxury"—authenticity over artifice.

The aesthetic fuses **Modern Editorialism** with **Soft Minimalism**. It prioritizes high-contrast serif typography for storytelling and a vast sense of "breathing room" (white space) to signal exclusivity. The interface utilizes organic textures and a warm, sun-drenched palette to differentiate itself from the clinical, cold blue aesthetics of mass-market competitors. The visual narrative transitions from light, airy discovery phases to a "Cinematic Ultra-Luxury" mode for high-ticket itineraries.

## Colors

The palette is anchored in the "Silk Road Sand" (#FAF7F1), providing a warm, parchment-like foundation that is softer on the eyes than pure white. 

- **Primary (Tilework Teal):** Used for primary actions, progress indicators, and core branding elements.
- **Secondary (Terracotta):** Used for highlights, limited-time offers, and interactive "adventure" cues.
- **Tertiary (Muted Gold):** Reserved for "Elite" status indicators and ultra-luxury itinerary markers.
- **Surface Tiers:** Use #F4EFE6 for subtle card backgrounds or section nesting on the primary ivory surface.
- **Ultra-Luxury Mode:** For premium tiers, the system flips to a "Cinematic Dark" mode using a near-black charcoal background with gold accents and increased tracking in typography.

## Typography

This design system utilizes a high-contrast typographic pairing to balance tradition and technology. 

- **Headlines:** Use **Playfair Display**. It provides the editorial authority required for a boutique agency. For "Ultra-Luxury" pages, increase the letter spacing on smaller serif headers to 0.05em.
- **Body & UI:** Use **Inter**. It ensures maximum legibility across the multilingual requirements of the Silk Road (Cyrillic, Latin, and CJK scripts). 
- **The "Price String":** Prices should be rendered in a semi-bold weight of Inter, with the secondary currency (e.g., UZS) rendered in a slightly smaller, medium-gray sub-label to maintain hierarchy.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** grid. The content resides in a 1280px max-width container for desktop to maintain the editorial "columnar" feel of a magazine.

- **Vertical Rhythm:** Sections are separated by generous 80px to 120px padding blocks to emphasize luxury and prevent visual clutter.
- **Grid:** A 12-column grid is used for desktop. For mobile, a single-column layout with 16px side margins is standard.
- **Information Density:** Low. Every element must "breathe." Avoid packing more than three destination cards per row on desktop.

## Elevation & Depth

Depth is communicated through **Ambient Shadows** and **Tonal Layering** rather than harsh borders.

- **Surface Depth:** Use soft, multi-layered shadows (0px 4px 20px rgba(0,0,0,0.04)) for cards to create a "lifted" paper effect.
- **Interactive Depth:** On hover, cards should transition to a higher elevation (0px 12px 32px rgba(0,0,0,0.08)) and scale slightly (1.02x).
- **Glassmorphism:** Navigation bars use a 70% opacity blur of the background color (#FAF7F1) to maintain context while scrolling through image-heavy travelogues.

## Shapes

The shape language is "Organic Geometric." While the structural containers (sections) are rectangular, all interactive elements are softened.

- **Core Elements:** Cards and input fields use a 12px-16px radius to appear approachable and modern.
- **Buttons:** Exclusively **Pill-Shaped (Full Radius)**. This distinct shape differentiates "Actions" from "Information Containers."
- **Media:** Images should utilize the same 12px radius as cards to maintain a cohesive, soft-edged visual flow.

## Components

- **Pill Buttons:** Primary buttons use Teal-Emerald background with white text. Secondary buttons use a transparent background with a 1px Gold or Teal border.
- **Destination Cards:** Feature a large-scale hero image (16:9 or 4:5 ratio) with a subtle gradient overlay at the bottom to ensure white typography (title/price) remains legible.
- **Sticky Header:** A transparent-to-frosted-ivory transition upon scroll. Mega-menus use a 4-column layout: 3 for navigation links and 1 for a "Featured Itinerary" image.
- **Price Chips:** Displayed as "from **$1,240** ≈ 15,600,000 UZS". The local currency is treated as a secondary metadata point.
- **Itinerary Timeline:** A vertical line component using the Muted Gold color, with Soft-Rounded icons representing travel milestones (flights, hotels, cultural visits).
- **Inputs:** Large, 16px padded fields with a subtle #F4EFE6 fill and no border until focused. Focus state uses a 1px Teal outline.