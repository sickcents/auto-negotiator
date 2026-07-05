# Design System Inspired by Mastercard

## 1. Visual Theme & Atmosphere

Mastercard's experience reads like a warm, editorial magazine built from soft stone and signal orange. The canvas is a muted putty-cream (`#F3F0EE`) — not white, not gray, but a color that feels like the paper of a premium annual report. On top of that canvas, everything that matters is shaped like a stadium, a pill, or a perfect circle. The dominant visual gesture is the **oversized radius**: heroes carry 40-point corners, cards go fully pill-shaped, service images are cropped into circular orbits, and buttons either complete the pill or fit snugly at 20 points. There are almost no sharp corners anywhere on the page.

The second gesture is **orbit and trajectory**. Circular image masks don't sit still — they're connected by thin, hand-drawn-feeling orange arcs that span entire viewport widths, implying a constellation of services rather than a list. Each circle has a small attached "satellite" — a white micro-CTA holding an arrow icon — docked onto its perimeter like a moon. This is the most distinctive thing about Mastercard's current design language: the circles feel like they're in motion even though the page is still.

Typography is rendered entirely in **MarkForMC**, Mastercard's proprietary geometric sans. Headlines are set at a medium weight (500) with tight negative letter-spacing (-2%), giving them confidence without shouting. Body copy runs at the same family in a slightly lighter weight (450) — a weight you rarely see on the web, chosen because it reads softer than regular 400 without feeling thin. The whole system — warm cream surfaces, pill shapes, circular portraits, traced-orange orbits, black CTAs — feels simultaneously institutional (a 60-year-old payments network) and editorial (a modern brand magazine), which is exactly the tension Mastercard wants to hold.

**Key Characteristics:**
- Warm cream canvas (`#F3F0EE`) replaces traditional white — every surface is tinted, never sterile
- Extreme border-radius as design language: 40px, 99px, 1000px dominate; anything square is a cookie-banner third-party
- Circular image portraits with attached white satellite-CTAs and traced-orange orbital paths
- Ghost "watermark" headlines (cream-on-cream text at heading scale) layered behind circle portraits
- Black primary CTAs with 20px radius in the body — the cookie-banner orange is kept to consent flows
- Floating pill-shaped navigation that docks below the viewport top with rounded shoulders — **deviation on this app**: the header is a full-width bar flush at the top, not a floating pill; see the App-Specific Header Bar section (#21) for why
- Eyebrow labels with a tiny accent dot + uppercase bold tracking — used as the section-category signal
- Dark warm-black footer (`#141413`) with four-column link layout and large conversational headline

## 2. Color Palette & Roles

### Primary
- **Mastercard Red** (`#EB001B`): The left circle of the Mastercard mark — used only in the brand logo, never as a UI color.
- **Mastercard Yellow** (`#F79E1B`): The right circle of the Mastercard mark — used only in the brand logo, never as a UI color.
- **Ink Black** (`#141413`): The warm near-black used for primary CTAs, headline text on cream, and the footer surface. Slightly warm (the `13` blue value pulls toward the cream) so it never feels jet-black on the warm canvas.

### Secondary & Accent
- **Signal Orange** (`#CF4500`): The burnt/rust CTA orange used on consent actions and eyebrow dots. Deeper than the brand yellow, brighter than ink — it's the page's single aggressive color and must be used sparingly.
- **Light Signal Orange** (`#F37338`): A lighter carroty orange used for carousel active indicators and decorative orbital arcs. Always acts as an attention cue, never as body color.
- **Clay Brown** (`#9A3A0A`): The deep rust used for secondary link-style buttons (e.g., cookie details). Sits between ink and signal orange.

### Surface & Background
- **Canvas Cream** (`#F3F0EE`): The page canvas. Warm, putty-toned, the default body background. All editorial sections sit on this.
- **Lifted Cream** (`#FCFBFA`): One step lighter than canvas — used for nested "raised" sections that want to feel like paper laid on paper.
- **White** (`#FFFFFF`): Reserved for the floating navigation pill, modal cards, secondary button fills, and small satellite-CTA circles attached to image portraits.
- **Soft Bone** (`#F4F4F4`): A cool-gray alternative surface used inside a handful of component subregions.

### Neutrals & Text
- **Ink Black** (`#141413`): Primary headline and body text color.
- **Charcoal** (`#262627`): A slightly softer black used for some text alternates.
- **Slate Gray** (`#696969`): Muted secondary text — eyebrow label alternative, disabled states, "Privacy Choices" bottom-row text.
- **Granite** (`#555555`) and **Graphite** (`#565656`): Deeper gray for inline body accents and link alternates.
- **Dust Taupe** (`#D1CDC7`): Very muted cream-gray used for disabled or "whisper" text (e.g., placeholder-like empty state labels). Low contrast on cream; use only for subdued content.

### Semantic & Accent
- **Link Blue** (`#3860BE`): A deep, slightly dusty blue used for inline links and informational callouts. Saturated enough to read as a link without being neon.
- **Priceless Red + Yellow**: The full-color Mastercard logo mark is the only place the brand's red and yellow appear together; they lock the identity to the page without acting as a UI palette.

### App-Specific: Ops Map Base (#15)
- **Warm Charcoal** (`#221D19`): The Ops Map's backdrop void (`--color-map-base`), shown before/around tiles. Replaced Ink Black (`#141413`) here specifically — a hair lighter and warmer so the full-bleed map reads as a soft dark plate rather than pitch-black. Not used anywhere outside the map.

### Gradient System
Mastercard uses no programmatic gradients in the core UI. The visual impression of "gradient" comes from two places:
- **Circular image portraits** where a warm-orange photo subject (a card, a sunflower, a beverage) fades to the cream canvas at its edge
- **Deep card shadows** on elevated content (`rgba(0,0,0,0.08) 0px 24px 48px`) that create a soft halo beneath pill-shaped media

## 3. Typography Rules

### Font Family
- **Primary**: `MarkForMC` — Mastercard's proprietary geometric sans. Every headline, body paragraph, button, nav link, and footer link on the page.
- **Secondary**: `MarkOffcForMC` — an "Official" cut used in a minority of contexts (legal text, some forms).
- **Fallback stack**: `SofiaSans, Arial, sans-serif` — Sofia Sans is a reasonable open-source stand-in; Arial is the final web-safe fallback.

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| H1 (hero) | 64px | 500 | 64px | -1.28px (-2%) | Set to `1:1` line-height for very tight vertical rhythm on multi-line hero |
| H2 (section) | 36px | 500 | 44px | -0.72px (-2%) | Used in ghost-watermark headline treatments and section titles |
| H3 (card title) | 24px | 500 | 28.8px (1.2) | -0.48px (-2%) | Titles inside service/solution cards |
| H4 (subhead) | 14px | 700 | 18.2px (1.3) | normal | Rarely used in marketing surfaces |
| Eyebrow (H5) | 14px | 700 | 14px | 0.56px (+4%) | Uppercase, paired with a tiny accent dot (e.g., "• SERVICES") |
| Body paragraph | 16px | 450 | 22.4px (1.4) | normal | The half-step 450 weight is MarkForMC's signature — softer than 500, firmer than 400 |
| Nav link / Button label | 16px | 500 | 16px | -0.48px (-3%) | Tight, compact, no text-transform |
| Footer link | 14px | 450 | ~20px | normal | Lighter weight on dark footer for airier density |
| Footer column header | 12–14px | 700 | 14px | 0.56px (+4%) | Uppercase, muted gray, short tracking |

### Principles
- **Weight 450 is load-bearing**. Most brands use 400/500/700; Mastercard uses 450 for body copy, which creates an unusually soft reading tone. Replacing it with 400 flattens the identity.
- **Tight negative tracking on headlines** (-2%) gives display text its editorial density — the words lock together rather than breathe.
- **Uppercase tracking only on the eyebrow scale** (14px / 700 / +4% tracking). Don't use uppercase anywhere else; no shouty section titles.
- **One-font system**. Resist the urge to add a second typeface for contrast. The contrast comes from scale, weight, and letter-spacing, not from a serif or display accent.
- **Line-height ratio drops with size**. H1 is 1:1, H3 is 1.2, body is 1.4. Tight display, comfortable reading.

### Note on Font Substitutes
MarkForMC is proprietary and licensed. When rebuilding a matching aesthetic without access to the original:
- **Sofia Sans** (Google Fonts) is the closest open-source match — it's already in Mastercard's declared fallback stack.
- **Inter** at weights 450/500/700 works as a generic stand-in; expect slightly taller x-height and looser letter shapes.
- **Neue Haas Grotesk** or **Geist** can approximate the geometric feel for commercial projects.
- Whichever substitute is used, preserve the **-2% letter-spacing on headlines** and the **450 body weight** (use `font-weight: 450` with variable fonts, or substitute `font-weight: 400` and tighten the letter-spacing by ~-0.5% to compensate).

## 4. Component Stylings

### Buttons

**Primary — Ink Pill**
- Background: Ink Black (`#141413`)
- Text: Canvas Cream (`#F3F0EE`) — not pure white
- Border: 1.5px solid Ink Black (same as bg, creates crisp edge)
- Radius: 20px
- Padding: 6px 24px
- Font: MarkForMC 16px / weight 500 / letter-spacing -0.32px
- Default: as above; solid warm-black pill on cream canvas
- Active / pressed: subtle inward-shrink or 2px offset (not a hover variant)
- Use for: all marketing CTAs in the page body ("Learn more", "Explore", "Discover")

**Secondary — Outlined Pill**
- Background: White (`#FFFFFF`)
- Text: Ink Black (`#141413`)
- Border: 1.5px solid Ink Black
- Radius: 20px
- Padding: 6px 24px
- Font: MarkForMC 16px / weight 450 / line-height 20.8px
- Default: white-on-cream pill with crisp ink outline
- Active / pressed: subtle compression
- Use for: secondary actions paired with a primary, or standalone utility CTAs

**Consent / Signal — Orange Pill**
- Background: Signal Orange (`#CF4500`)
- Text: White (`#FFFFFF`)
- Border: 0
- Radius: 24px
- Padding: 1px 30px (very tight vertical, wide horizontal)
- Font: MarkForMC 13px / weight 400 / letter-spacing 0.13px
- Default: as above; bright rust pill with white text
- Use for: cookie consent, privacy preference, and other legally-distinct confirmations. **Do not** use this orange for marketing CTAs — it reads as a compliance color.

**Satellite — Circular Micro-CTA**
- Background: White (`#FFFFFF`)
- Icon: Ink Black arrow (`→`) at ~20px
- Border: none
- Radius: 50% (perfect circle)
- Size: ~50–60px diameter
- Shadow: none or very subtle (the portrait's shadow carries the elevation)
- Default: docks onto the bottom-right edge of a circular portrait, protruding partway outside the portrait's circle
- Use for: the primary entry point into service/solution cards; always paired with a circular portrait

**Icon-Only Circle Button (carousel, play/pause)**
- Background: transparent or white
- Icon: 10–20px centered
- Border: 1px solid Ink Black (when on cream) or none (when over media)
- Radius: 50%
- Size: 40px diameter minimum for carousel controls; 80px for hero video play
- Use for: carousel pagination/play-pause, hero video play, search toggle

### Cards & Containers

**Hero Media Frame (Stadium)**
- Background: Dark video or full-bleed imagery (typically black `#000000` or `#2B2B2B` behind video)
- Radius: 40px all corners (creates a stadium shape on wide viewports)
- Width: ~full viewport minus ~48px gutter on each side
- Height: ~60–70% of viewport
- Shadow: none (sits directly on canvas)
- Corners: the extreme 40px radius on a media element is the most iconic Mastercard gesture — do not round less

**Service / Solution Portrait Card**
- Shape: Perfect circle (radius 50%) or ellipse (radius 999px / 1000px)
- Diameter: 260–340px desktop; ~220px mobile
- Image crop: square source, cropped to circle
- Attached element: White satellite circular CTA (see above) docked bottom-right, ~40% outside the portrait
- Eyebrow below: accent dot + uppercase label (e.g., "• SERVICES", "• SOLUTIONS")
- Title below: H3 (24px / weight 500 / -2% tracking), 1–2 lines max
- Decorative orbit: thin ~1px Light Signal Orange curved line spanning from this card outward to the next, implying connection

**Pill Carousel Card**
- Radius: 1000px (full pill) or 40px corners (rounded stadium)
- Width: ~40–60% of viewport
- Height: ~380–420px (portrait-pill orientation)
- Content: full-bleed photography with small overlaid chip labels
- Chip inside: White pill (~ 999px radius), Ink Black text, padding 8px 20px, used for category tags like "Story"
- Large inline CTA inside: Ink Pill button, oversized (padding 16px 40px, radius 40px)

**Ghost Watermark Text Block**
- Font: MarkForMC 72–128px / weight 500 / tight -2% tracking
- Color: Canvas Cream slightly darkened (`#E8E2DA` or similar — cream-on-cream)
- Position: layered behind portrait circles, bleeding off the viewport edge
- Purpose: sets section theme without competing with foreground copy

### Inputs & Forms
Minimal form surface on the marketing page. The search input in the nav header is:
- Initial state: a 48px circular button with a magnifier icon
- Expanded state: horizontal input field, border `1px solid` Ink Black at ~50% opacity, radius 999px, padding 12px 24px, white background

**Country/language selector (footer)**
- Background: Ink Black (same as footer)
- Text: White
- Border: 1px solid `rgba(255,255,255,0.4)`
- Radius: 999px (full pill)
- Icon: downward chevron on the right

### Navigation

**Floating Nav Pill (desktop)**
- Container: white-to-translucent-white pill floating below the very top of the viewport with a ~24px top margin
- Radius: 999px / 1000px (full pill)
- Padding: ~16px 40px internal
- Shadow: very soft (`rgba(0, 0, 0, 0.04) 0px 4px 24px 0px`) — just enough to lift it off the cream canvas
- Content: Mastercard logo left, primary link group center ("For you", "For business", "For the world", "For innovators", "News and trends"), search icon right
- Link spacing: ~48–56px gap between primary links
- Link style: Ink Black, weight 500, 16px, no underline, no pill surround until active

**Mobile Nav**
- The same pill shape but collapsed to: logo + hamburger menu button + search icon only
- Menu opens into a full-screen overlay with the primary links stacked vertically

### Image Treatment

- **Aspect ratios used**: 1:1 (all service portraits — cropped to circle), ~3:4 or ~4:5 (carousel pill cards), 16:9 or wider (hero video frame)
- **Full-bleed vs padded**: Hero is viewport-wide with gutters; service portraits are always centered in their column with generous whitespace around; footer imagery is rare
- **Masking**: Aggressive circular masking is the defining treatment — square source images are cropped to perfect circles of matching diameter. Never use rectangular service imagery.
- **Lazy loading**: Standard `loading="lazy"` with a soft blur-up transition from a cream-tinted placeholder, preserving the warm palette during load

### Decorative Orbital Lines

A signature motif: thin (~1–1.5px) single-weight curved lines in Light Signal Orange (`#F37338`) tracing arcs between circular portraits. These lines:
- Imply connection between service cards without literal arrows
- Span widths from ~200px up to full-viewport arcs
- Feel hand-drawn (subtle irregularity) rather than perfect CSS curves
- Appear only in sections with circular portrait content — never on pill sections, never in the footer

### Footer

- Background: Ink Black (`#141413`)
- Text: White
- Padding: 48px horizontal 100px / bottom 148px (very tall bottom space)
- Structure: large conversational H2 ("We're always here when you need us") left-aligned, then a 4-column link grid below
- Column headers: uppercase, muted, weight 700, letter-spacing +4%
- Link rows: white, weight 450, 14px; entries prefixed with a small icon (support bubble, card, map pin, question mark) for the "NEED HELP?" column
- External link marker: a small upper-right arrow (`↗`) after link text
- Bottom row (below a 1px white-at-opacity divider): copyright + privacy small-print + country-language pill dropdown + four social icons (LinkedIn, Facebook, X, YouTube)

## 5. Layout Principles

### Spacing System
- **Base unit**: 8px (confirmed by dembrandt extraction and computed styles)
- **Scale**: 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 (powers of 8)
- **Section vertical padding**: ~96–128px between major sections on desktop; ~48–64px on mobile
- **Card internal padding**: 32–40px on desktop, ~24px on mobile
- **Nav top margin**: ~24px from viewport top (the pill floats, doesn't touch)

### Grid & Container
- **Max content width**: ~1200–1280px centered, with ~48–100px horizontal gutter
- **Column pattern**: 12-column implied, but practical layouts use 2-up asymmetric (large headline left, supporting text right), 1-up full-bleed (hero, video), or staggered single-portrait placement (service cards sit in varying grid positions creating the "constellation" feel)
- **Footer grid**: 4 equal columns on desktop, collapses to single column accordion on mobile

### Whitespace Philosophy
Mastercard treats whitespace as structure, not absence. A typical service section has:
- A ghost headline occupying the top ~40% of the section (mostly empty cream)
- A single circular portrait positioned ~60% down, asymmetric to left or right
- ~300–500px of blank canvas between the portrait and the next section
This deliberate emptiness tells the eye "slow down, read one thing at a time" — the opposite of dense dashboard UIs.

### Border Radius Scale

| Radius | Use |
|--------|-----|
| 3–6px | Tiny decorative elements, cookie banner micro-chips |
| **8px** | **Explicit exception (`--radius-frame`, #22)** — the Agent Timeline frame (`.console-frame`) only. It's a mostly-rectangular data panel whose own child content (tool cards, email docs) already sits in the 6–20px range; the stadium radius the rest of this scale would suggest read as inconsistent against them. Not a general addition to the scale — everything else still skips straight from 6px to 20px. |
| 20px | Primary and secondary body CTAs (the signature button radius) |
| 24px | Consent/orange pill buttons, modal inner chips |
| 40px | Hero media frames, large section container corners, H2 pill labels |
| 50% | Circular portraits, icon-only buttons, satellite CTAs |
| 99px / 999px / 1000px | Full pill shapes — navigation, carousel cards, footer country selector, primary inline chips |

The scale is unusual: most systems use 4/8/12/16. Mastercard skips those and commits to **either small (≤6), medium-large (20–40), or full-pill (99+)**. The middle ground of 8–12 is absent, which is why the UI feels either "precise and utility" or "soft and editorial" with no in-between — with one named exception on this app (`--radius-frame`, 8px, the Agent Timeline frame only, #22).

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | No shadow | The default — 95% of surfaces sit directly on cream canvas |
| 1 | `rgba(0, 0, 0, 0.04) 0px 4px 24px 0px` | Floating nav pill — barely-there lift |
| 2 | `rgba(0, 0, 0, 0.08) 0px 24px 48px 0px` | Hero media frames, elevated cards — a soft large-radius halo rather than a hard drop |
| 3 | `rgba(0, 0, 0, 0.25) 0px 70px 110px 0px` | Rare; dramatic elevation on a feature tile |

### Shadow Philosophy
Mastercard uses shadows as **atmospheric cushioning**, not directional light. The Level 2 shadow has a 48px spread and only 8% opacity — it barely exists as dark pixels but creates a "the card is breathing above the canvas" feel. There are almost no hard-edged, tight shadows anywhere in the system. Border lines are preferred over shadows for functional delineation (form inputs, footer divider).

### Decorative Depth
- **Orbital arcs** (Light Signal Orange, ~1px): trace connective paths across sections
- **Ghost watermark headlines**: cream-on-cream text gives sections an almost-pressed-paper quality
- **Circle-image fade**: warm-toned photography at the edge of circular portraits dissolves into the canvas, implying soft atmospheric depth

## 7. Do's and Don'ts

### Do
- Use Canvas Cream (`#F3F0EE`) as the default body background — never pure white
- Mask service/feature imagery as perfect circles, not rectangles or rounded rectangles
- Attach a white satellite CTA to the bottom-right of each circular portrait
- Set headlines in MarkForMC weight 500 with -2% letter-spacing
- Use weight 450 (not 400) for body paragraphs
- Keep primary CTAs as Ink Black pills (20px radius) with cream text
- Use Signal Orange only on consent, legal, or compliance actions
- Float the nav as a rounded white pill below the viewport top, not flush at y=0 — **this app's header is the documented exception** (#21): a full-width bar flush at y=0, see the App-Specific Header Bar section
- Build page rhythm from three surface tones: canvas cream → lifted cream → ink footer
- Use thin Light Signal Orange arcs between service cards to imply connection

### Don't
- Don't use pure white as a page background — it breaks the warm editorial tone
- Don't round image frames at 8–16px — Mastercard either uses full-pill, 40px, or full-circle. In-between radii look generic
- Don't use Signal Orange for marketing CTAs — it reads as cookie-consent orange and dilutes the legal color signal
- Don't mix typefaces — no serif accent, no script, no secondary display font
- Don't crowd the nav with more than six top-level links — the pill is meant to feel airy
- Don't drop hard shadows — all elevation should use 48px+ spread and ≤10% opacity
- Don't use uppercase for anything larger than the 14px eyebrow label
- Don't omit the tiny accent dot before eyebrow labels — it's the identity
- Don't place circular portraits on a grid — their magic comes from asymmetric placement

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | ≤ 767px | Nav pill shows logo + menu + search only; primary links hide behind hamburger; service portraits stack single-column centered; hero headline drops from 64px to ~40px; footer columns collapse into a vertical accordion |
| Tablet | 768–1023px | Nav pill shows 2–3 primary links truncated; service portraits arrange 2-up; hero headline ~48px |
| Desktop | ≥ 1024px | Full nav with 5 primary links centered; service portraits asymmetrically placed with decorative orbital lines; hero headline 64px |
| Wide | ≥ 1440px | Content max-width caps at ~1280px; gutters grow symmetrically; orbital lines extend further |

### Touch Targets
All interactive elements comfortably exceed 44×44px. The satellite CTA (circle + arrow) is ~50–60px. The nav pill buttons are ~48px tall. Mobile hamburger and search are 48×48px. No link or button drops below 40px in any breakpoint.

### Collapsing Strategy
- **Nav**: full pill → compact pill with hamburger. Pill shape is preserved across breakpoints — always rounded, always floating.
- **Service grid**: asymmetric constellation → 2-up → 1-up stack. Orbital arcs are removed on mobile (they only work with asymmetric placement).
- **Spacing**: section vertical padding compresses from 128px to 48px on mobile.
- **Content**: two-column hero (headline left / supporting text right) becomes stacked (headline on top, supporting text below).
- **Footer**: 4 columns → 1 column accordion with chevron toggles per section.

### Image Behavior
Circular portraits scale proportionally (maintaining the perfect circle at every size). Hero video frames maintain their 40px radius at every breakpoint, but the frame itself shrinks with the viewport. Lazy loading is standard with a cream-tinted blur-up placeholder, preserving the palette during load.

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: "Ink Black (`#141413`) — the warm near-black used for primary pill buttons and footer"
- Background: "Canvas Cream (`#F3F0EE`) — warm putty body canvas, never pure white"
- Lifted surface: "Lifted Cream (`#FCFBFA`) — one step lighter than canvas for nested sections"
- Heading text: "Ink Black (`#141413`)"
- Body text: "Ink Black (`#141413`) at weight 450"
- Muted text: "Slate Gray (`#696969`)"
- Signal / Consent: "Signal Orange (`#CF4500`) — reserve for cookie consent and legal actions"
- Accent arc: "Light Signal Orange (`#F37338`) — orbital decorative lines only"
- Border / Outline: "Ink Black at 1.5px for pill buttons; 1px at low opacity elsewhere"
- Footer: "Ink Black (`#141413`) with White text"

### Example Component Prompts
- "Create a circular portrait card 300px in diameter, with a square photograph cropped to a perfect circle. Attach a 56px white satellite button with a dark arrow icon at the bottom-right, so it protrudes ~40% outside the portrait. Below the portrait, add an eyebrow label with a Light Signal Orange dot and uppercase 'SERVICES' text in MarkForMC weight 700 at 14px. Below the eyebrow, set a 24px / weight 500 title in Ink Black."
- "Design a primary CTA button: Ink Black (`#141413`) background, Canvas Cream (`#F3F0EE`) text, 20px border-radius, 6px vertical and 24px horizontal padding, MarkForMC font at 16px weight 500 with -2% letter-spacing."
- "Build a floating navigation pill: white background with `rgba(0, 0, 0, 0.04) 0px 4px 24px 0px` shadow, 999px border-radius, ~16px vertical and 40px horizontal internal padding. Position it 24px below the viewport top, centered, with the Mastercard logo at the left, five primary links centered with 48px gap, and a circular 48px search button at the right."
- "Create a hero media frame: 40px border-radius on all corners, full viewport width minus 48px gutters, ~60% viewport height, dark background for video content. Place it directly on the cream canvas with no shadow."
- "Design a footer: Ink Black (`#141413`) background, white text, 4-column link grid with uppercase muted column headers at 14px weight 700 +4% tracking. Include a large conversational H2 above the grid, a 1px white-at-30%-opacity horizontal divider below, and a bottom row with copyright, legal small-print links, a pill-shaped country selector, and four social icons."

### Iteration Guide
When refining existing screens generated with this design system:
1. Focus on ONE component at a time — don't redesign multiple surfaces in parallel
2. Reference specific color names AND hex codes from this document
3. Use natural language ("warm putty cream", "stadium pill", "circular portrait with satellite CTA") alongside technical values
4. Describe the desired "feel" (editorial, soft, institutional) alongside specific measurements
5. When in doubt, reach for one of three radii: 20px (buttons), 40px (hero/stadium), or 999px (pill/nav)
6. Default backgrounds to Canvas Cream (`#F3F0EE`), not white — this single change shifts the entire mood toward Mastercard

## 10. App-Specific: Left Pane Scroll Structure

The left pane (`.transfers-strip` in `public/index.html`) is a fixed-height rail with exactly two stacked regions, each owning its own scroll:

1. **`.transfers-strip__list`** — the transfer list, capped at 40% of the rail height (`max-height: 40%`).
2. **`.transfers-strip__timeline`** — the detail/timeline region (header, Agent Timeline console, Manager Reply / Override controls), taking the remaining space (`flex: 1 1 auto; min-height: 0`).

Rules for anything added to this rail going forward:

- **One scroll container per region, never nested.** Content inside `.transfers-strip__timeline` (e.g. `#agent-timeline`) must not declare its own `overflow-y` / `max-height` — it grows naturally and relies on the parent region as the sole scroll container. A scrollbar nested inside a scrolling ancestor is treated as a bug (#14), not a valid pattern.
- **The boundary between regions is a static border, not a gap.** `.transfers-strip__list` carries `border-bottom: 1px solid var(--color-border)`, matching the system-wide preference for border lines over shadows for functional delineation (Section 6). Because the border lives on the box itself rather than on scrolled content, it stays visible regardless of scroll position in either region.
- **Scrollbars are plain CSS, no dependency.** `scrollbar-width/-color` (Firefox) plus `::-webkit-scrollbar*` (Chromium/Safari) give a thin, ink-toned (`rgba(20, 20, 19, 0.22)`) scrollbar affordance consistent across evergreen browsers. A scrollbar-styling library was considered and rejected — two CSS properties already cover the target browsers, so a dependency would add weight without adding capability.

### Drag-to-resize width (#26)

The rail's width is continuously resizable via a real grab handle, not a two-state toggle — issue #16 shipped a click-to-snap button first, but the right affordance for "let me pick my own width" is a drag handle, not a jump between two presets:

- **`--transfers-strip-width`** (`clamp(340px, 27vw, 420px)`) — the default width until the user drags.
- **`.transfers-strip__resize-handle`** — a 12px invisible hit-area docked to the panel's right edge (`right: -6px`), with a 2px grip line (`::after`) that stays faintly visible at rest (`rgba(20, 20, 19, 0.1)`, #31) so the handle is discoverable without already knowing to hover the exact right-edge pixel range, then strengthens to `rgba(20, 20, 19, 0.22)` on hover/focus/drag.
- Dragging sets an inline `pane.style.width` directly (pointer events on the handle, tracked via `window`-level `pointermove`/`pointerup` so the drag keeps working even if the cursor leaves the thin handle), clamped to `320px`–`min(680px, 50vw)`.
- Arrow-key presses on the focused handle (`role="separator"`, `aria-orientation="vertical"`) step the width by 24px; Home/End jump to the min/max bounds — the drag isn't mouse-only.
- The choice persists in `localStorage` (`an.transfersPaneWidth`, storing the resolved pixel width) and is re-applied on load.
- Below the `1023px` breakpoint the pane is already full-width (`width: auto !important` in the stacked mobile layout, overriding the drag-resize inline style), so the handle is hidden there — resizing has nothing to do.
- The map and side rail are unaffected by the rail's width change (both are independently `position: absolute`), so nothing needs to reflow when the pane resizes.

### Circumstance-only detail controls (#17)

`Manager Reply Injection` (`#manager-reply-block`) and `Regional Director Override` (`#regional-override-block`) are **not** permanent fixtures of the timeline strip — each is a hidden-by-default block (native `hidden` attribute, toggled from `renderTransferDetail` in `public/js/components/transferDetail.js`) that only appears when the selected transfer's status calls for that specific human input:

- Manager Reply Injection shows only when `status === 'awaiting_reply'`.
- Regional Director Override shows only when `status === 'deadlock'`.
- With no transfer selected, or any other status, neither block is shown.

Anything added to the timeline strip that represents a one-off human action tied to a specific transfer state should follow this pattern (hidden fixture + status-driven `hidden` toggle) rather than rendering unconditionally.

## 11. App-Specific: Site Card Gauge Markers (#18)

Each `.site-card__gauge` bar carries two tick marks on the same track — Operating Threshold (static hard floor) and Min Buffer (dynamic soft floor). They're distinguished by both color and position, not color alone:

| Marker | Color | Position | Token |
|--------|-------|----------|-------|
| Operating Threshold (`.site-card__gauge-mark--threshold`) | Link Blue | Above the bar | `--color-link` (`#3860BE`) |
| Min Buffer (`.site-card__gauge-mark--buffer`) | Light Signal Orange | Below the bar | `--color-signal-light` (`#F37338`) |

Both colors are existing tokens repurposed here, not new hex values — `--color-signal` (the darker consent/escalation orange) stays reserved for alert states (`.is-low`) per Section 7's "Do's and Don'ts", so the marker uses the lighter accent tone instead.

Hover/focus on either mark shows a custom dark tooltip (ink background, chip radius, Level-1 shadow) instead of the native `title` attribute — `content: attr(aria-label)` in CSS, so the visible tooltip text and the accessible name are always the same string with nothing to keep in sync. Marks are `tabindex="0"` so the tooltip is keyboard-reachable, not just mouse-hover. Because the gauge now contains focusable descendants, its wrapper uses `role="group"` (not `role="img"`, which shouldn't contain interactive children) with the same summary `aria-label` it always had. The numeric legend below the bar (Op. Threshold / Min Buffer values) is unchanged — the tooltip adds a second way to get the exact number, it doesn't replace the legend.

## 12. App-Specific: Site Card → Map Highlight (#19)

Clicking a Network Status site card highlights that site's marker on the map, using a **Link Blue** treatment kept deliberately distinct from the donor/receiver **Signal Orange** route-selection treatment (Section 4) so the two selection states are never confused:

- The card gets `.site-card--selected` (Link Blue border + soft ring `box-shadow`).
- The marker gets `.map-marker--card-selected` — a Link Blue `outline` (not `box-shadow`, which the donor/receiver roles already use), so a site that's simultaneously a route endpoint and a card selection shows both rings independently rather than one clobbering the other.
- The map pans (not rezooms) to the selected site once, on the click itself (`panToSite` in `public/js/components/mapView.js`) — not on every subsequent poll re-render, which would otherwise recenter the map out from under a user who has since panned elsewhere.
- Clicking the already-selected card again toggles the selection off, clearing both highlights.
- Selection state (`state.selectedSiteId` in `public/js/main.js`) is independent of the S/M/L/XL type filter and of the selected transfer — all three compose without interfering.

## 13. App-Specific: Completed-Transfer Route Indicator (#20)

`ACTIVE_ROUTE_STATUSES` (`public/js/format.js`) deliberately excludes `completed` — nothing is still moving — so completed transfers get their own, separate route treatment when selected, distinct from the active/in-progress one:

| | Active/in-progress route (`.map-route`) | Completed route (`.map-route--completed`) |
|---|---|---|
| Color | Light Signal Orange | Dust Taupe (`--color-text-on-ink-muted`) |
| Motion | Animated ambient dash-flow (`orbit-flow`), plus a courier truck sweeping donor → receiver on a loop when selected | Fully static — no animation of any kind |
| Dash rhythm | `3 5` | `2 6` (a different rhythm, not just "paused", so the two read as different materials even in a still screenshot) |
| Direction cue | The animated courier's motion | One fixed arrowhead (a rotated caret icon) at the arc's midpoint, angled to the curve's local tangent |

`.map-route--completed` is its own class rather than a `.map-route` modifier, since `.map-route` always carries the orbit-flow animation. The two are mutually exclusive per render (`renderMap` in `public/js/components/mapView.js`): a selected transfer is either in `ACTIVE_ROUTE_STATUSES` (animated treatment) or `completed` (static treatment), never both.

## 14. App-Specific: Header Bar, Not a Floating Pill (#21)

**This is a deliberate, documented deviation** from the floating pill-shaped nav pattern in Section 1 and Section 7 — called out there and here so it doesn't read as an inconsistency.

`.nav-pill` spans the full viewport width and docks flush at the top (`top: 0; left: 0; right: 0`) with a bottom border instead of an all-around border + pill radius. Brand content stays left, the live status text moves to the right edge via `justify-content: space-between`. Below `599px` it stacks brand above status (`flex-direction: column`) rather than reverting to a squeezed pill.

The header's rendered height is published into `--nav-height` (`public/js/components/nav.js`, via `ResizeObserver` on the header element with `{ box: "border-box" }` — the default content-box wouldn't fire for a padding/border-only height change) instead of the panels below guessing with a hardcoded offset. `.transfers-strip` and `.side-rail` both read `top: calc(var(--nav-height) + var(--space-3))`, so they clear the header correctly no matter how tall it renders — including if it ever wraps to two lines. `--nav-height` defaults to `64px` in `tokens.css` for the instant before the first measurement lands. Below the `1023px` breakpoint the header (and both panels) switch to static/flow layout, so this mechanism only matters at desktop widths.

## 15. App-Specific: Shared Panel Header Pattern (`.panel-header`, #23, #27)

**One shared pattern, `.panel-header`, for every panel's heading row** — the Transfers list heading, the Transfer Detail heading, the Agent Timeline console frame heading, the Network Status heading, and the Simulate Incident heading. Before #27 each of these five was its own ad-hoc, copy-pasted variant; #23 first established the sticky-heading idea for three of them, #27 extracted the common shape into one class family so a sixth panel doesn't invent a sixth pattern.

**Base class** (`components.css`): `position: sticky; top: 0`, flex row, `var(--space-3)` top / `var(--space-2)` bottom padding, a `border-bottom: 1px solid var(--color-border)` separator, and an opaque `--color-canvas-lifted` background so scrolled content never shows through. Applied either directly on the heading element itself (when a header is just a label — Network Status, Simulate Incident, Transfers list) or on a wrapper `div` (when a header also carries a trailing action — the Copy button, the status pill).

The header background is opaque, not another layer of `.panel`'s own translucent `--color-glass` — a header re-applying the same semi-transparent, blurred glass on top of the panel's already-blurred glass compounds the two layers' opacity, rendering visibly whiter than the rest of the panel below it (a design bug found live, across every panel). `--color-canvas-lifted` is the same Lifted Cream hue at full opacity, which is exactly what its own token comment ("nested/raised panels") describes. `.panel` itself also gained `overflow: hidden` for the same live-found bug's other half: nothing was clipping a sticky header's square corners to the panel's rounded ones, so they visibly overhung past the curve.

**Modifiers**:
- **`.panel-header--split`** — `justify-content: space-between`, for headers with a trailing action element. **Do not** put this on an element that's *also* `.eyebrow`: eyebrow is itself a flex row (accent dot + label), and `space-between` on that same element shoves the dot and the label to opposite ends instead of justifying the header's own two children. Only apply it to a wrapper `div` around an `.eyebrow` child, never to the `.eyebrow` element directly.
- **`.panel-header--on-ink`** — dark variant for headers inside ink-toned surfaces (the Agent Timeline console frame): ink background, `--color-border-on-ink` separator, top corners matched to the frame it caps (`--radius-frame`, #22), and a tighter 4px bottom gap for the console's dense, terminal-like feel. #33 audited this against the rest of the ticket's flat header language and kept it deliberately — see §18's "One consistent ticket surface" for why the console stays visually distinct rather than converting to a flat header.
- **`.panel-header--flush`** — zero horizontal padding, for headers whose immediate scroll container already sits inside an outer `.panel`'s own padding (Transfers list, Transfer Detail, Simulate Incident). Adding the base class's own side padding on top of that would double the inset.
- **`.panel-header--flush-top`** — zero *top* padding, for a `--flush` header that is also the first child of its `.panel`-padded ancestor (Transfers list, Simulate Incident): the ancestor's own top padding and the header's own top padding stack, pushing the header text noticeably lower than Network Status's header (whose ancestor panel carries no padding of its own, per `.floating-panel--network` below) — a mismatch #32 found by diffing all three headers' rendered insets. Transfer Detail's header does **not** get this modifier: it follows the Transfers list within the same outer panel rather than sitting directly against the panel's own top padding, so its own top padding is real spacing, not a stacked duplicate.
- **`.panel-header--static`** — cancels the sticky positioning (`position: static`). Used by Transfer Detail's header, which shares its scroll container (`.transfers-strip__timeline`) with the Agent Timeline console frame's own sticky header — two stickies at the same `top: 0` in one scroll container fight over the same slot, with whichever is later in DOM order visually covering the other. Transfer Detail only needed the shared typography/padding/separator here (a follow-up issue redesigns it to read as a ticket expansion); genuine sticky-ness for a second header in the same scroll region isn't a solvable "just add the class" case. Also used by Network Status's header (#30) — see below.

**The `top: 0` padding-edge gotcha**: sticky's `top: 0` anchors to the *padding edge* of the nearest scrolling ancestor, not its border edge. The same move was applied to `.console-frame` for #27 — it's zero top/side padding now, restored on `.panel-header--on-ink` (top + sides) and `#agent-timeline` (sides), replacing the negative-margin trick #23 originally used there. Where the scroll container has no padding of its own to begin with (`.transfers-strip__list`, `.transfers-strip__timeline`), none of this comes up — the heading reaches the true edge for free, which is exactly the case `.panel-header--flush` covers.

**Network Status (#23, #30)**: this panel used to hit the same padding-edge gotcha — `.floating-panel--network` was both the frosted panel *and* the scroll container in one element, so #23's fix was to zero that element's padding and restore it individually on `.panel-header`, `.site-filter`, and `.site-cards`. #30 removed the underlying problem instead of working around it: the header is no longer part of the scrolling element at all. `.floating-panel--network` is now a non-scrolling flex column holding two children — the header (`.panel-header--static`, since there's no scrolling ancestor left for it to stick to) and `.floating-panel--network__body`, a plain wrapper around `.site-filter` + `.site-cards` that carries `overflow-y: auto` and the region's scrollbar styling. The panel itself keeps `padding: 0`, with `.site-filter` and `.site-cards` still supplying their own horizontal inset as before — that part of the #23 arrangement remains, just decoupled from the sticky-anchor reasoning that originally motivated it.

## 16. App-Specific: Ops Map Tonal Filter (#15)

The Ops Map recolors OSM's fully-saturated tiles to a monotone plate by filtering only the Leaflet tile pane (`.map--ink .leaflet-tile-pane`); markers, route lines, tooltips, and the zoom control live in sibling panes and keep their own color. The recipe is seven named tokens in `public/styles/tokens.css`, composed in one `filter` rule in `components.css`:

| Token | Value | Role |
|-------|-------|------|
| `--map-tile-grayscale` | `1` | Strips all cartographic hue to neutral greys |
| `--map-tile-invert` | `0.9` | Flips luminance (dark land, light roads/labels) — pulled back from a full `1` so the flip isn't a stark negative |
| `--map-tile-brightness` | `0.9` | Sits the plate near Warm Charcoal rather than sinking toward black |
| `--map-tile-contrast` | `0.78` | Softens the inverted edges into a hazier plate |
| `--map-tile-sepia` | `0.45` | Re-warms the greys after grayscale/invert |
| `--map-tile-hue-rotate` | `-8deg` | A gentle rotation that stays on the warm side, not sliding toward cold slate |
| `--map-tile-saturate` | `0.55` | Kept low — still tonal/monotone, not a multi-color map scheme |

This replaced a starker recipe (`invert(1) brightness(0.82) contrast(0.9) sepia(0.35) hue-rotate(-12deg) saturate(0.6)` on `--color-map-base: #141413`) that read as high-contrast dark-ink rather than "comforting." Route lines and markers use Signal Orange / Light Signal Orange (Section 2), which stay legible against this base since they render in unfiltered sibling panes — any future retuning of these tokens should keep that contrast in mind.

## 17. App-Specific: Site Marker Color-Coding (#24)

Site markers on the map are colored by **Site Type**, using the exact same tokens as the Site Card badge and the type filter buttons (Section 2's Site Type badge palette) — a site type reads as the same color everywhere in the app, not a map-only scheme:

| Type | Fill | Border / label | Tokens |
|------|------|-----------------|--------|
| XL | `--color-site-xl` | `--color-site-xl-strong` | `.map-marker--XL` |
| L | `--color-site-l` | `--color-site-l-strong` | `.map-marker--L` |
| M | `--color-site-m` | `--color-site-m-strong` | `.map-marker--M` |
| S | `--color-site-s` | `--color-site-s-strong` | `.map-marker--S` |

These replace the old single `--color-marker` ink-tint every pin used regardless of type. The light pastel fills stay legible against the dark Warm Charcoal map base from #15, the same way the old uniform off-white tint did.

The donor/receiver route-highlight override (#13) still works and is still visually distinct, layered on top rather than replaced:
- **Donor** (`.map-marker--donor`) keeps its Site Type fill/label color as the base "light pin" and adds only a Signal Orange border + ring (`box-shadow`) — the pin now carries two pieces of information (type + "stock is leaving here") instead of one.
- **Receiver** (`.map-marker--receiver`) still fully overrides to a solid Signal Orange fill with white text, unchanged from #13.

Both role rules are declared after the Site Type rules in `components.css`, so on ties (a marker can carry both a type class and a role class at once) the role rule wins for whichever properties it sets — no `!important` needed.

## 18. App-Specific: Transfer Detail as a Ticket Expansion (#29)

Building on the shared `.panel-header` pattern (#27), the Transfer Detail header is designed to read as **the clicked transfer row, expanded** — not a disconnected panel that happens to appear below the list:

- **No flex gap between the list and detail regions.** `.transfers-strip` used to `gap: var(--space-3)` between `.transfers-strip__list` and `.transfers-strip__timeline`, leaving a dead strip of background between them. That's now `gap: 0` — the visual separation comes entirely from `.transfers-strip__list`'s `border-bottom` (#14) plus the detail header's own padding, so the header reads as continuing directly off the divider instead of floating a fixed distance below it.
- **Same wording, larger type.** `transferSummary()` (`public/js/format.js`) is the single source for a transfer's one-line description ("kembangan-court needs 2x printer from bedok-north-ave"); both the list row and the detail header call it, so the detail header is never a differently-phrased restatement of the same transfer.
- **The eyebrow's dot becomes a caret.** `.detail-header__eyebrow` suppresses the standard `.eyebrow::before` dot (`content: none`) and `initDetailHeader()` (`transferDetail.js`) injects the `caret-down` icon in its place — pointing down from the row above, reinforcing "this expanded from there" instead of reading as a generic section label.
- **Instant feedback, not just the ID.** `markTransferSelected(id, transfer)` sets both the eyebrow ID and the summary line synchronously from the already-loaded `state.transfers`, before the async `GET /transfers/:id` resolves — matching the existing "instant feedback on click" behavior the ID-only version already had (#3/#5).
- **Still not sticky.** Per #27, Transfer Detail's header stays `.panel-header--static` — it shares its scroll container with the Agent Timeline console frame's own sticky header, and two stickies at the same `top: 0` would fight over the same slot.

### One consistent ticket surface (#33)

The ticket (`#transfer-detail`) used to stack three visually unrelated header treatments in one scroll container: the ticket's own light `.detail-header`, the Agent Timeline console's dark `.panel-header--on-ink`, and Manager Reply / Regional Director Override titles as bare, unstyled `<h3>`s with none of the shared `.panel-header` treatment. #33 reconciles the parts that were genuinely inconsistent without discarding the two constraints that were deliberate:

- **Manager Reply / Regional Director Override titles now use the shared pattern**: `.eyebrow.panel-header.panel-header--flush.panel-header--static`, the same recipe as `.detail-header` above them — eyebrow dot, uppercase label, border-bottom, `--flush` because `.transfers-strip__timeline` already supplies horizontal inset, `--static` for the same sticky-conflict reason as `.detail-header` below. They read as more sections of the same ticket now, not a fourth ad-hoc heading style.
- **The Agent Timeline console keeps its dark `.panel-header--on-ink` treatment** — this is the one deliberate exception to "one flat, Network-Status-style header everywhere." The console is a live, machine-generated agent log (tool calls, reasoning, timestamps in mono type), and the ink surface is what marks it as *data the ticket is showing you* rather than *part of the ticket's own chrome* — collapsing it to the same light header as the ticket would blur that distinction, not simplify it. What *was* a real inconsistency — the frame's `box-shadow: var(--shadow-2)` — is removed instead: a floating-card shadow made the console read as a second nested card rather than an inset region of the ticket's own scroll surface. Rounded `--radius-frame` corners (#22) and the ink background stay.
- **Only one sticky header per scroll container, unchanged.** The console header remains the sole `position: sticky` element in `.transfers-strip__timeline`; `.detail-header` and both `.detail-block__title`s stay `--static` — adding a second or third sticky element at `top: 0` in the same scroll container is the exact conflict #27 already resolved once.

### Known Gaps
- The live page uses MarkForMC, a proprietary licensed typeface. Sofia Sans is the closest open-source substitute and is listed in Mastercard's own fallback stack.
- Tablet breakpoint specifics (768–1023px) were inferred from desktop and mobile captures; intermediate layouts may vary per section.
- The exact "whisper" cream tone used for ghost-watermark headlines behind circular portraits reads between `#E8E2DA` and `#D1CDC7` in captures; the precise value varies per section.
- Third-party consent orange (`#CF4500`) is Mastercard's documented consent signal and should not be confused with any marketing CTA color.
- The Mastercard logo mark (red `#EB001B` + yellow `#F79E1B`) is a brand asset, not a UI palette entry.
