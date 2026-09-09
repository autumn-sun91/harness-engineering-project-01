# finsight.com — marketing site UI kit

Three click-through screens built entirely from the design-system components. Open `index.html`; the pill switcher bottom-centre moves between screens, and the top-nav links for Individuals / Cryptocurrencies / Company also navigate.

| File | Screen | Pattern coverage |
|---|---|---|
| `home.screen.jsx` | Home | `TopNav` on-dark → dark `HeroBand` with a layered `ProductUICard` stack → white 3-up `FeatureCard` grid → soft-grey markets band with `AssetRow` list → `CTABand` → `Footer` |
| `explore.screen.jsx` | Explore / markets | light `HeroBand`, live `SearchPill` filter, pill tab row, 3-up light `ProductUICard` asset cards, full asset table with `PriceCell` |
| `signup.screen.jsx` | Create account | two-step `TextInput` form with disabled-CTA gating, dark mockup panel alongside |

Band rhythm follows the brand rule: white → soft grey → dark, 96px vertical padding per band, 1200px content cap.
