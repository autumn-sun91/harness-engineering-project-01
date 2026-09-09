The layered dashboard mockup. Pair every dark hero with a stack of 2–3 of these, one slightly rotated.

```jsx
<ProductUICard title="Portfolio" meta="$128,402.55" width={380}>
  <AssetRow name="Bitcoin" ticker="BTC" price="$64,204.19" change="+2.41%" tone="dark" />
</ProductUICard>
<ProductUICard rotate={-4} width={260} title="BTC / USD" meta="+2.41%" />
```

- Collapses to a single card on mobile.
- One shadow tier only (`--shadow-soft`); don't stack shadows to fake depth.
