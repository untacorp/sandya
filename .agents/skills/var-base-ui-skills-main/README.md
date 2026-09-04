# Var-UI Base Design System

Agentic Design Guidelines (v1.0.0).

> [!NOTE]
> Var-UI Base is an opinionated, production-grade design system engineered by Vargen Studio. It guides AI coding assistants to generate authentic, crisp, high-contrast web interfaces while eliminating AI visual clichés.

---


## Directory Architecture

```text
skills/var-ui-base/
├── SKILL.md                          # Main skill entrypoint & scope router
├── README.md                         # Repository documentation
└── references/                       # Modular reference guides
    ├── anti-patterns.md              # 14 UI Slop anti-patterns & solutions
    ├── typography.md                 # Typography pairing matrices & scales
    ├── layout-and-spacing.md         # Asymmetric grids & mobile responsiveness
    ├── color-system.md               # 60-30-10 color rule & crisp palettes
    ├── component-states.md           # 8 interactive component states & previews
    ├── microinteractions.md          # Transition tokens & motion easing
    ├── asset-integration.md          # Unsplash CDN parameters & SVG icon standards
    └── validation-checklist.md       # 15-point audit checklist & pre-emit scoring
```

---

## Anti-Pattern Reference Summary

| # | AI Visual Cliché | Var-UI Standard Solution | Reference Module |
|---|---|---|---|
| 1 | Unicode Emojis in UI | Prohibited. Use SVG line icons or plain typography. | [`anti-patterns.md`](references/anti-patterns.md) |
| 2 | Badges Above Headlines | Prohibited. H1 and H2 headings stand directly at section tops. | [`anti-patterns.md`](references/anti-patterns.md) |
| 3 | Dull / Dingy Cream Canvas | Prohibited. Use Crisp Clean White (`#FFFFFF`) or Crisp Slate (`#F8FAFC`). | [`color-system.md`](references/color-system.md) |
| 4 | Neon Text Gradients | Use solid curated colors with high contrast. | [`color-system.md`](references/color-system.md) |
| 5 | Overused Inter & Generic Monospace | Use paired faces with character (Outfit, Plus Jakarta Sans, Geist, Newsreader). | [`typography.md`](references/typography.md) |
| 6 | Forced ALL CAPS | Use natural Sentence case or Title case. | [`typography.md`](references/typography.md) |
| 7 | Extreme Rounded Corners (`3xl`) | Use refined radii (`4px` – `8px`) or sharp `0px`. | [`layout-and-spacing.md`](references/layout-and-spacing.md) |
| 8 | Fabricated Metrics | Use authentic narrative, real services, and verifiable case studies. | [`anti-patterns.md`](references/anti-patterns.md) |
| 9 | Pulsing Status Dots | Remove non-interactive decorative blips. | [`anti-patterns.md`](references/anti-patterns.md) |
| 10 | Dark Mode as Automatic Default | Evaluate Crisp Light Mode with sharp slate contrast. | [`color-system.md`](references/color-system.md) |
| 11 | Radial Blur & Glowing Orbs | Use 1.5px solid hairline borders and balanced whitespace. | [`layout-and-spacing.md`](references/layout-and-spacing.md) |
| 12 | Random Glassmorphism | Use clean solid surface colors. | [`color-system.md`](references/color-system.md) |
| 13 | Empty Image Placeholders | Use high-resolution Unsplash CDN photography with aspect ratios. | [`asset-integration.md`](references/asset-integration.md) |
| 14 | Excessive Decorative Noise | Preserve clean visual hierarchy and whitespace rhythm. | [`layout-and-spacing.md`](references/layout-and-spacing.md) |

---

## Code Refactoring Examples

### Headline & Badge Alignment

```diff
- <!-- Prohibited: Badge pill floating directly above H1 -->
- <div class="badge-pill">SPECIAL RELEASE 2.0</div>
- <h1 class="headline-title">Next Generation Platform</h1>

+ <!-- Var-UI Standard: H1 stands clean and direct at section top -->
+ <h1 class="headline-title">Next Generation Platform</h1>
+ <p class="headline-subtext">Engineered for high-volume data operations.</p>
```

---

## Pre-Emit Self-Critique Stamp

AI Agents stamp this self-critique comment at the top of generated style blocks before delivering code:

```css
/* Var-UI Base · pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: page | component: <Component-Name>
 * theme: Crisp Cobalt & Clean White | typography: Outfit + Plus Jakarta Sans
 * status: PASSED (15/15 slop checks verified)
 */
```

---

## Installation & Usage

> [!TIP]
> Copy the `var-ui-base` directory into your project's `.agents/skills/` directory for automatic discovery by compatible AI agents.

```bash
.agents/
└── skills/
    └── var-ui-base/
        ├── SKILL.md
        └── references/
```

To invoke during turn-based prompts:

> "Build a landing page following the var-ui-base skill guidelines."

---

## License

Released under the MIT License by Vargen Studio.
