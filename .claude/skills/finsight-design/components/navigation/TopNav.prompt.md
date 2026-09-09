The marketing top nav — 64px, wordmark left, menu centre-left, Sign in + Sign up pill right.

```jsx
<TopNav tone="on-dark" activeLink="Individuals" onNavigate={setPage} />
```

- `tone="on-dark"` when the nav sits on `--color-surface-dark`; the Sign up pill switches to the dark secondary.
- Below 768px the real product collapses to a hamburger sheet with Sign up still visible.
