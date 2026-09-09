# Developer platform — UI kit

Two screens covering the pricing and account-management surfaces of the developer product.

| File | Screen | Pattern coverage |
|---|---|---|
| `pricing.screen.jsx` | Pricing | light `HeroBand`, 3-up `PricingTierCard` with clickable featured inversion, soft-grey borderless `FeatureCard` grid, dark usage band with layered `ProductUICard` mockups, `CTABand`, custom-column `Footer` |
| `keys.screen.jsx` | API keys | `SearchPill` filter, hairline table with Mono values, `TextInput` + gated `Button` create form, quota card |

The featured pricing tier is interactive — clicking a tier's CTA moves the dark inversion to it, which is how the brand marks a highlighted choice (no coloured ribbons).
