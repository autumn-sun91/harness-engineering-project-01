const { TopNav, HeroBand, Footer, Button, BadgePill, PricingTierCard, FeatureCard, CTABand, ProductUICard } = window.FinsightDesignSystem_7e1a2b;

const TIERS = [
  { name: 'Developer', price: '$0', cadence: '/ month', features: ['3 API keys', '10 req/sec', 'Community support', 'Testnet faucet'], cta: 'Start free' },
  { name: 'Growth', price: '$499', cadence: '/ month', features: ['Unlimited API keys', '250 req/sec', 'Priority support', '99.99% SLA'], cta: 'Choose Growth', featured: true },
  { name: 'Enterprise', price: 'Custom', features: ['Dedicated infrastructure', 'Custom rate limits', 'Named solutions engineer', 'Audit support'], cta: 'Contact sales' },
];

function PricingScreen({ onNavigate }) {
  const [selected, setSelected] = React.useState('Growth');
  return (
    <div style={{ background: 'var(--color-canvas)' }}>
      <TopNav activeLink="Developers" onNavigate={onNavigate} />
      <HeroBand tone="light" eyebrow={<BadgePill>Developer platform</BadgePill>}
        headline="Build on regulated rails"
        subhead="One API for balances, quotes and settlement — with the compliance surface already in place."
        actions={<><Button size="lg">Get API keys</Button><Button size="lg" variant="secondary-light">Read the docs</Button></>}
        style={{ paddingBottom: 'var(--space-xl)' }} />

      <section style={{ padding: '0 var(--space-lg) var(--space-section)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--space-lg)' }}>
          {TIERS.map(t => (
            <PricingTierCard key={t.name} {...t} featured={selected === t.name} onSelect={() => setSelected(t.name)} />
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--color-surface-soft)', padding: 'var(--space-section) var(--space-lg)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--space-lg)' }}>
          <FeatureCard eyebrow="Quotes" title="Single quoted price" border={false}>No hidden spread — the quote you fetch is the quote you settle at.</FeatureCard>
          <FeatureCard eyebrow="Webhooks" title="Signed, replayable events" border={false}>Every state change is delivered with an HMAC signature and a 72-hour replay window.</FeatureCard>
          <FeatureCard eyebrow="Sandbox" title="Full testnet parity" border={false}>The sandbox mirrors production, including rate limits and error codes.</FeatureCard>
        </div>
      </section>

      <section style={{ background: 'var(--color-surface-dark)', padding: 'var(--space-section) var(--space-lg)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--space-xxl)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
            <BadgePill tone="dark">Usage</BadgePill>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--type-display-md-size)', lineHeight: 'var(--type-display-md-lh)', letterSpacing: 'var(--type-display-md-ls)', color: 'var(--color-on-dark)' }}>Every call accounted for</h2>
            <p style={{ margin: 0, maxWidth: '38ch', color: 'var(--color-on-dark-soft)' }}>Per-key metering, exportable to your own billing system.</p>
            <Button variant="outline-on-dark">View a sample report</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', alignItems: 'center' }}>
            <ProductUICard rotate={-4} width={200} title="Latency" meta="41ms" />
            <ProductUICard width={340} title="Requests · 30d" meta="12,480,331">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 72, marginTop: 'var(--space-xs)' }}>
                {[30,46,38,54,50,62,58,70,66,74,68,78].map((h,i) => (<span key={i} style={{ flex: 1, height: h, background: 'var(--color-primary)', opacity: .3 + i * 0.05, borderRadius: 'var(--radius-xs)' }} />))}
              </div>
            </ProductUICard>
          </div>
        </div>
      </section>

      <CTABand headline="Ship your first transfer today" subhead="Sandbox keys are instant and free."
        actions={<><Button size="lg">Get API keys</Button><Button size="lg" variant="outline-on-dark">Talk to sales</Button></>} />
      <Footer columns={[
        { title: 'Platform', links: ['Overview', 'Pricing', 'Status', 'Changelog'] },
        { title: 'APIs', links: ['Balances', 'Quotes', 'Transfers', 'Webhooks'] },
        { title: 'Guides', links: ['Quickstart', 'Auth', 'Idempotency', 'Rate limits'] },
        { title: 'SDKs', links: ['Node', 'Python', 'Go', 'Ruby'] },
        { title: 'Support', links: ['Help centre', 'Contact us', 'Security', 'Bug bounty'] },
        { title: 'Legal', links: ['Privacy', 'Terms', 'Disclosures', 'Cookies'] },
      ]} />
    </div>
  );
}

Object.assign(window, { PricingScreen });
