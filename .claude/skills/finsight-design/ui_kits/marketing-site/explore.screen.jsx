const { TopNav, HeroBand, Footer, Button, BadgePill, SearchPill, ProductUICard, AssetRow, PriceCell, AssetIcon, CTABand } = window.FinsightDesignSystem_7e1a2b;

const ASSETS = [
  ['Bitcoin','BTC','$64,204.19','+2.41%','var(--color-accent-yellow)'],
  ['Ethereum','ETH','$3,118.40','-0.87%',null],
  ['Solana','SOL','$147.02','+5.16%',null],
  ['USD Coin','USDC','$1.00','+0.01%',null],
  ['Cardano','ADA','$0.4412','-2.08%',null],
  ['Avalanche','AVAX','$27.63','+1.19%',null],
  ['Chainlink','LINK','$14.08','+3.74%',null],
  ['Litecoin','LTC','$71.55','-0.44%',null],
];

function ExploreScreen({ onNavigate }) {
  const [query, setQuery] = React.useState('');
  const [tab, setTab] = React.useState('All assets');
  const rows = ASSETS.filter(a => (a[0] + a[1]).toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ background: 'var(--color-canvas)' }}>
      <TopNav activeLink="Cryptocurrencies" onNavigate={onNavigate} />
      <HeroBand tone="light" eyebrow={<BadgePill>Markets</BadgePill>}
        headline="Explore crypto prices"
        subhead="Quoted mids across 240+ assets, updated continuously."
        style={{ paddingBottom: 'var(--space-xl)' }}
        actions={<SearchPill width={340} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all 240 assets" />} />

      <section style={{ padding: '0 var(--space-lg) var(--space-section)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
            {['All assets','Top gainers','Recently added'].map(t => (
              <Button key={t} size="sm" variant={t === tab ? 'primary' : 'secondary-light'} onClick={() => setTab(t)}>{t}</Button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xxl)' }}>
            {rows.slice(0,3).map(r => (
              <ProductUICard key={r[1]} tone="light" title={r[0]} meta={r[2]} style={{ boxShadow: 'var(--shadow-none)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AssetIcon symbol={r[1]} fill={r[4]} />
                  <PriceCell value={r[3]} />
                </div>
              </ProductUICard>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-lg)', padding: '0 0 var(--space-xs)', borderBottom: 'var(--border-hairline)', fontSize: 'var(--type-body-sm-size)', color: 'var(--color-muted)' }}>
            <span>Asset</span><span style={{ minWidth: 120, textAlign: 'right' }}>Price</span><span style={{ minWidth: 88, textAlign: 'right' }}>24h</span>
          </div>
          {rows.map((r,i) => (
            <AssetRow key={r[1]} name={r[0]} ticker={r[1]} price={r[2]} change={r[3]} iconFill={r[4]} divider={i < rows.length - 1} onClick={() => {}} />
          ))}
          {rows.length === 0 && <p style={{ color: 'var(--color-muted)', padding: 'var(--space-lg) 0' }}>No assets match “{query}”.</p>}
        </div>
      </section>

      <CTABand tone="light" headline="Start with $10" subhead="Buy any listed asset from the app or the web."
        actions={<><Button>Get started</Button><Button variant="secondary-light">See fees</Button></>} />
      <Footer />
    </div>
  );
}

Object.assign(window, { ExploreScreen });
