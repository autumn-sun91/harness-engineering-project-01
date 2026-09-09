# finsight — Design System

A quiet, institutional financial brand that happens to trade crypto. Marketing surfaces are white-canvas, editorially spaced and almost monochromatic; a single brand voltage — **finsight Blue `#0052ff`** — carries every primary action, and nothing else competes with it.

## Sources this system was built from

- **A written brand/design specification** supplied in chat (company: *finsight*): full colour inventory with hex values, a 17-step type scale with sizes/weights/line-heights/tracking, spacing and radius scales, a one-tier elevation model, a component inventory with per-component palette and geometry, do's & don'ts, responsive breakpoints, and a known-gaps list. That document is the ground truth for every value in `tokens/`.
- **No codebase, Figma file, repository, screenshots, slide deck or font binaries were attached.** Everything here is derived from the written specification. Where the spec was silent, this readme says so rather than inventing.

Consequences of that, stated plainly:

| Gap | What was done |
|---|---|
| No logo or brand-mark file | The mark is the brand name set in Display type (`Wordmark` component). Nothing was drawn or reconstructed. `assets/` holds no logo. |
| Licensed typefaces not supplied | Inter substitutes for Display and Sans; JetBrains Mono for Mono. Loaded from Google Fonts in `tokens/fonts.css`. **Please send the licensed binaries.** |
| No icon set supplied | Only two glyphs exist in the whole system (search magnifier, checklist tick) and both are drawn inline where the spec requires them. See ICONOGRAPHY. |
| No imagery, illustration or photography supplied | Hero depth comes from layered product-UI mockup cards, exactly as the spec describes — no stock imagery was substituted. |
| In-product trading surfaces (order book, charts, order forms) sit behind a login wall | Out of scope. This system covers marketing surfaces only. |
| Hover states, animation timings and form validation states undocumented in the source | Not invented. Only Default and Active/Pressed are defined. |

## Products represented

1. **finsight.com — the marketing site.** Home (dark hero), Explore/markets (asset lists and prices), account creation. → `ui_kits/marketing-site/`
2. **Developer platform.** Pricing tiers and API-key management. → `ui_kits/developer-platform/`

---

## CONTENT FUNDAMENTALS

**Voice: institutional calm.** The copy sounds like a regulated financial institution that is comfortable being boring about the important parts. It never sounds urgent, never sounds like a trading floor, and never promises returns.

- **Person.** Second person for the reader (*"Take control of your money"*, *"You'll verify your identity before your first trade"*); first-person plural only for obligations and mechanics (*"We sent a verification link"*, *"We'll never share it"*). Never *"I"*. Never *"we believe"* mission-speak.
- **Casing.** Sentence case everywhere — headlines, buttons, nav, form labels, table headers. The single exception is the badge pill, which is uppercase at 12/600 (`INSTITUTIONAL`, `REGULATED`, `MARKETS`). No Title Case Headlines. No ALL-CAPS shouting outside badges.
- **Headline shape.** Three to six words, verb-first or noun-phrase, no punctuation, no colons, no wordplay: *"Take control of your money"*, *"Explore crypto prices"*, *"Build on regulated rails"*, *"Prices, without the noise"*. The comma in that last one is as ornamental as the voice gets.
- **Subhead shape.** One sentence, ~12–22 words, that adds a concrete fact rather than restating the headline — a count, a mechanism, a constraint: *"Quoted mids across 240+ assets, updated continuously."*
- **Body copy** is short declaratives. Specifics over adjectives: *"Monthly reconciliations, cost-basis exports and read-only access for your accountants"*, not *"powerful reporting tools"*. Where a claim invites doubt, the sentence names the control that answers it (*"audited, bankruptcy-remote structures"*).
- **Button copy** is two or three words, verb-first, no terminal punctuation, no exclamation marks: *Get started · Sign up · Talk to sales · Get API keys · See fees · Contact sales*. The tertiary text link is the one place an arrow appears (*"Learn more →"*).
- **Numbers are exact and always formatted.** `$64,204.19`, `+2.41%`, `12,480,331`, `41ms`, `99.99% SLA`, `250 req/sec`. Never *"over $60k"*, never a bare `2.41`. Signs are always shown on changes. Every one of these renders in Mono.
- **Legal and caution copy is present, small and unhedged.** *"finsight is a financial technology company, not a bank."* *"Secrets are shown once. Rotate every 90 days."* *"By continuing you agree to the User Agreement and Privacy Policy."* Caption size, muted grey, never hidden behind a disclosure toggle.
- **No emoji. Anywhere.** Not in copy, not in cards, not in empty states. The brand has no emoji register.
- **No exclamation marks, no rhetorical questions, no "Oops!" error voice.** Empty and error states are flat statements of fact: *"No assets match "sol"."*, *"Your balances appear here once you fund the account."*
- **Words the brand avoids:** revolutionary, seamless, effortless, unlock, supercharge, crypto-native slang (*ape, moon, HODL, degen*), and anything implying advice or guaranteed return.

---

## VISUAL FOUNDATIONS

**Colour.** Monochrome by default: white canvas, near-black ink `#0a0b0d`, cool grey body text `#5b616e`. One action colour — `--color-primary` `#0052ff` — and the rule is scarcity: **one or two blue moments per band**, spent on the primary CTA, the wordmark, or an inline brand link. Pressed state darkens to `#003ecc`; disabled fades to the flat tint `#a8b8cc` (not an opacity). `--color-accent-yellow` `#f4b000` exists only inside asset-glyph illustrations and is never an action colour. Trading green `#05b169` and red `#cf202f` are **text colours only** — never a button, never a filled chip, never a row highlight. There is no secondary brand colour and no gradient anywhere in the system.

**Type.** Display for hero headlines, Sans for absolutely everything else, Mono for every number — and the three never mix inside one line. The defining choice is **Display at weight 400**, 80px down to 36px, with negative tracking (-2px at 80px, easing to -0.5px at 36px). Bolding a display headline changes the brand voice and is prohibited. Body sits at 16/400/1.5 with zero tracking; emphasis is 700 at the same size; titles are 18/600 and 16/600. Nav is 14/500, buttons 16/600, badges 12/600 uppercase.

**Spacing and layout.** 4px base unit; the live scale is 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · **96**. Every major editorial band takes 96px of vertical padding — that generous rhythm is closer to a financial newspaper than a dashboard. Content caps at 1200px centred; hero mockups and dark bands run full-bleed to the viewport edge. Cards sit 24px apart and are padded 32px inside. Grids are 3-up for benefits, 2-up for hero splits, 6 columns in the footer. Density is reserved for logged-in surfaces; marketing stays airy. Nothing is sticky or fixed except the top nav in-product.

**Backgrounds.** No photography, no patterns, no textures, no gradients, no noise or grain. The page floor rotates three modes and only three: white `#ffffff`, soft grey `#f7f7f7`, and full-bleed near-black `#0a0b0d`. Never more than two background colours in play at once within a page section. Every dark band must carry a layered product-UI card stack — a bare dark band is off-brand.

**Depth and shadow.** One shadow tier: `0 4px 12px rgba(0,0,0,.04)`. That is the entire elevation vocabulary, and it exists mainly to lift the floating mockup cards off the dark canvas. 80% of surfaces are flat; the rest take a 1px `#dee1e6` hairline. **Do not add shadow tiers, inner shadows, glows or coloured shadows.** There are no protection gradients — dark text never sits on imagery, so none are needed. Legibility on dark comes from a solid `#0a0b0d` floor, not a scrim.

**Borders.** Exactly one border weight — 1px — in one of two greys (`#dee1e6` default, `#eef0f3` soft). The only 2px border in the system is the focus ring on a text input, which thickens to 2px in Finsight Blue. No dashed borders, no double borders, no coloured left-border accent stripes.

**Corner radii.** Nothing is square. Interactive things are pills (100px). Containers are 24px. Mid cards 16px, inputs 12px, compact rows 8px, inline tags 4px. Asset glyphs and avatars are full circles. `--radius-none` is declared and deliberately unused.

**Cards.** White fill, 24px radius, 32px padding, 1px hairline, no shadow at rest. On a dark band the same card becomes `#16181c` with no border. The featured pricing tier does not get a ribbon or a coloured outline — it **inverts to the dark surface**. That inversion is how the brand signals "this one", throughout.

**Transparency and blur.** Effectively absent. No frosted glass, no backdrop blur, no translucent overlays, no alpha-muted text (full-opacity ink on every ground, which is also what keeps contrast above 4.5:1). The only alpha in the system is the 4% shadow and the faint divider inside dark mockup cards.

**Imagery mood.** No supplied imagery. If photography is ever introduced, the surrounding system implies cool, desaturated, high-key editorial portraiture with generous negative space — not warm, not grainy, not lifestyle-stocky. Treat that as a hypothesis until the brand supplies real assets.

**Motion.** Undocumented in the source and therefore unspecified here. If motion is needed, keep it in the same register as the type: short, linear-ish, opacity and small translate only. No bounces, no springs, no parallax, no counting-number animations on prices.

**States.** The source documents Default and Active/Pressed only. Pressed on the primary pill is the darker blue `#003ecc` — a colour change, never a scale-down or a shadow change. Disabled is the flat faded-blue tint with `cursor: not-allowed`. Focus is the 2px blue input border. **Hover is deliberately undefined** — if you need one, darken to the pressed colour rather than inventing an opacity fade, and note that you extended the system.

---

## ICONOGRAPHY

**There is essentially no icon system in this brand, and that is a finding, not a gap in the research.** The supplied specification names an icon font (`FinsightIcons`) but ships no binary, lists no icon inventory, and the entire documented component set requires exactly two glyphs:

1. a **search magnifier** inside `SearchPill`, and
2. a **checklist tick** inside `PricingTierCard`'s feature list.

Both are drawn inline as minimal 2px-stroke, round-cap, currentColor-inheriting SVG at 16–18px, sized to the text beside them. No icon library was pulled in from a CDN — importing Lucide or Heroicons for two glyphs would introduce a stroke and corner language the brand hasn't asked for.

Other rules the sources support:

- **Asset glyphs are not icons.** A ticker sits inside a 32px full-circle plate (`AssetIcon`) — neutral `#eef0f3` fill by default, or the illustrative accent yellow for Bitcoin-class marks. Real asset marks should replace the typographic fallback when the brand supplies them.
- **Nav affordances** in the source are limited to a search icon and a globe (locale). The globe is not implemented here because no asset or spec detail exists for it.
- **Emoji are never used.** Not decoratively, not in empty states, not in copy.
- **Unicode characters as icons:** only the arrow in the tertiary text link (`Learn more →`). Nothing else — no bullets-as-glyphs, no box-drawing, no ▲▼ on price changes (direction is carried by colour and the `+`/`-` sign in Mono).
- **`assets/` is intentionally empty of logos and marks.** Nothing was drawn, approximated or generated. When real assets arrive, drop them in and point `Wordmark` at the SVG.

---

## Index

| Path | What it is |
|---|---|
| `styles.css` | Global entry — `@import` list only. Consumers link this one file. |
| `tokens/fonts.css` | Font families + the Google Fonts substitution import |
| `tokens/colors.css` | Base palette + semantic aliases |
| `tokens/typography.css` | 17-step size/weight/line-height/tracking scale |
| `tokens/spacing.css` | 4px scale, container, control heights |
| `tokens/shape.css` | Radius scale, hairline border shorthand |
| `tokens/elevation.css` | The single shadow tier |
| `tokens/base.css` | Body reset and link colours |
| `guidelines/*.html` | 18 foundation specimen cards (Colors · Type · Spacing · Shape · Brand) |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent-Skills front matter for use in Claude Code |

### Components

Grouped by concern under `components/`. Each has a `.jsx`, a `.d.ts` props contract, a `.prompt.md`, and one `@dsCard` HTML per directory.

- **`navigation/`** — `Wordmark`, `TopNav`
- **`buttons/`** — `Button` (primary · primary-active · secondary-light · secondary-dark · outline-on-dark · tertiary-text; sm/md/lg)
- **`forms/`** — `TextInput`, `SearchPill`
- **`badges/`** — `BadgePill`
- **`trading/`** — `AssetIcon`, `PriceCell`, `AssetRow`
- **`cards/`** — `FeatureCard`, `ProductUICard`, `PricingTierCard`
- **`bands/`** — `HeroBand`, `CTABand`, `Footer`

That inventory maps 1:1 onto the families the source specification defines. **Intentional additions**, both listed for honesty:

- `Wordmark` — the spec assumes a logo asset that wasn't supplied; this renders the brand name in Display type so nothing downstream has to improvise a mark.
- `PriceCell` — the spec defines `price-up-cell` and `price-down-cell` as separate entries; they are one component with a `direction` prop, since the only difference is the colour token.

Component variants the spec lists as separate entries are implemented as props rather than separate components (`button-*` → `Button variant`, `hero-band-dark|light` → `HeroBand tone`, `top-nav-light|on-dark` → `TopNav tone`, `pricing-tier-featured` → `PricingTierCard featured`, `product-ui-card-dark|light` → `ProductUICard tone`, `footer-link`/`legal-band` → parts of `Footer`).

### UI kits

- **`ui_kits/marketing-site/`** — `index.html` (click-through), `home.screen.jsx`, `explore.screen.jsx`, `signup.screen.jsx`, `README.md`
- **`ui_kits/developer-platform/`** — `index.html` (click-through), `pricing.screen.jsx`, `keys.screen.jsx`, `README.md`

No slide template was supplied, so no sample slides were created.
