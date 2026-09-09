const { TopNav, Footer, Button, BadgePill, TextInput, SearchPill, PricingTierCard, FeatureCard, ProductUICard } = window.FinsightDesignSystem_7e1a2b;

function KeysScreen({ onNavigate }) {
  const [keys, setKeys] = React.useState([
    { label: 'production-web', scope: 'Read + trade', created: '2026-02-11' },
    { label: 'sandbox-ci', scope: 'Read only', created: '2026-01-04' },
  ]);
  const [label, setLabel] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const shown = keys.filter(k => k.label.includes(filter));
  return (
    <div style={{ background: 'var(--color-canvas)' }}>
      <TopNav activeLink="Developers" onNavigate={onNavigate} />
      <section style={{ padding: 'var(--space-xxl) var(--space-lg) var(--space-section)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <BadgePill>Sandbox</BadgePill>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--type-display-md-size)', lineHeight: 'var(--type-display-md-lh)', letterSpacing: 'var(--type-display-md-ls)', color: 'var(--color-ink)' }}>API keys</h1>
            </div>
            <SearchPill placeholder="Filter keys" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 'var(--space-lg)', alignItems: 'start' }}>
            <div style={{ border: 'var(--border-hairline)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-lg)', paddingBottom: 'var(--space-xs)', borderBottom: 'var(--border-hairline)', fontSize: 'var(--type-body-sm-size)', color: 'var(--color-muted)' }}>
                <span>Label</span><span>Scope</span><span style={{ minWidth: 110, textAlign: 'right' }}>Created</span>
              </div>
              {shown.map(k => (
                <div key={k.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-lg)', alignItems: 'center', minHeight: 56, borderBottom: 'var(--border-hairline)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-body-sm-size)', color: 'var(--color-ink)' }}>{k.label}</span>
                  <span style={{ fontSize: 'var(--type-body-sm-size)', color: 'var(--color-body)' }}>{k.scope}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-body-sm-size)', color: 'var(--color-muted)', minWidth: 110, textAlign: 'right' }}>{k.created}</span>
                </div>
              ))}
              {shown.length === 0 && <p style={{ color: 'var(--color-muted)', marginTop: 'var(--space-lg)' }}>No keys match that filter.</p>}
            </div>

            <div style={{ border: 'var(--border-hairline)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <span style={{ fontSize: 'var(--type-title-md-size)', fontWeight: 600, color: 'var(--color-ink)' }}>Create a key</span>
              <TextInput label="Label" placeholder="production-web" value={label} onChange={(e) => setLabel(e.target.value)} />
              <Button disabled={!label} onClick={() => { setKeys([{ label, scope: 'Read only', created: '2026-09-07' }, ...keys]); setLabel(''); }}>Create key</Button>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-muted)' }}>Secrets are shown once. Rotate every 90 days.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 'var(--space-lg)' }}>
            <FeatureCard eyebrow="Plan" title="Growth · 250 req/sec">You are using 38% of your monthly quota.</FeatureCard>
            <ProductUICard tone="light" title="Quota · September" meta="4,712,004" style={{ boxShadow: 'var(--shadow-none)' }}>
              <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-strong)', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', background: 'var(--color-primary)' }} />
              </div>
            </ProductUICard>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

Object.assign(window, { KeysScreen });
