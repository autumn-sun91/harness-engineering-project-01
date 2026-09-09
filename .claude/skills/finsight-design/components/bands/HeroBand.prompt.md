The page opener. 96px vertical padding, 80px Display headline at weight 400.

```jsx
<HeroBand
  eyebrow={<BadgePill tone="dark">Institutional</BadgePill>}
  headline="Take control of your money"
  subhead="Buy, sell and hold with an institution built for scrutiny."
  actions={<><Button size="lg">Get started</Button><Button size="lg" variant="outline-on-dark">Talk to sales</Button></>}
  mockups={<ProductUICard title="Portfolio" meta="$128,402.55" width={380} />} />
```

- Always pair `tone="dark"` with a mockup stack — a bare dark hero is off-brand.
- Headline steps 80 → 64 → 52 → 44 → 36px down the breakpoints.
