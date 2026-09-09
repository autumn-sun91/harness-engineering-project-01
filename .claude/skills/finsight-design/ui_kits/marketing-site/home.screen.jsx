const { TopNav, HeroBand, CTABand, Footer, Button, BadgePill, FeatureCard, ProductUICard, AssetRow } = window.FinsightDesignSystem_7e1a2b;

function HomeScreen({ onNavigate }) {
  return (
    <div style={{ background: 'var(--color-canvas)' }}>
      <div style={{ background: 'var(--color-surface-dark)' }}>
        <TopNav tone="on-dark" activeLink="Individuals" onNavigate={onNavigate} />
        <HeroBand
          eyebrow={<BadgePill tone="dark">Regulated</BadgePill>}
          headline={<>Take control of your money</>}
          subhead="Buy, sell and hold 240+ assets with an institution built for scrutiny. Custody, reporting and controls that stand up to an audit."
          actions={<><Button size="lg">Get started</Button><Button size="lg" variant="outline-on-dark">Talk to sales</Button></>}
          mockups={<>
            <ProductUICard rotate={-5} width={210} title="BTC / USD" meta="+2.41%">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
                {[38,44,30,52,48,60,56,64,58,70].map((h,i)=>(<span key={i} style={{ flex: 1, height: h, background: 'var(--color-primary)', opacity: .25 + i*0.07, borderRadius: 'var(--radius-xs)' }} />))}
              </div>
            </ProductUICard>
            <ProductUICard title="Portfolio" meta="$128,402.55" width={360}>
              {[['Bitcoin','BTC','$64,204.19','+2.41%','var(--color-accent-yellow)'],['Ethereum','ETH','$3,118.40','-0.87%',null],['Solana','SOL','$147.02','+5.16%',null]].map((r,i,a)=>(
                <AssetRow key={r[1]} name={r[0]} ticker={r[1]} price={r[2]} change={r[3]} iconFill={r[4]} divider={i < a.length - 1} tone="dark" />
              ))}
            </ProductUICard>
          </>}
        />
      </div>

      <section style={{ padding: 'var(--space-section) var(--space-lg)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xxl)' }}>
          <h2 style={{ margin: 0, maxWidth: '18ch', fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--type-display-lg-size)', lineHeight: 'var(--type-display-lg-lh)', letterSpacing: 'var(--type-display-lg-ls)', color: 'var(--color-ink)' }}>An institution first, an exchange second</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--space-lg)' }}>
            <FeatureCard eyebrow="Custody" title="Segregated cold storage" media={<AssetIconPlate />}>Assets held in audited, bankruptcy-remote structures with insurance on the hot wallet float.</FeatureCard>
            <FeatureCard eyebrow="Reporting" title="Audit-ready statements">Monthly reconciliations, cost-basis exports and read-only access for your accountants.</FeatureCard>
            <FeatureCard eyebrow="Execution" title="Deep, quoted liquidity">Smart order routing across venues with a single quoted price and no hidden spread.</FeatureCard>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--color-surface-soft)', padding: 'var(--space-section) var(--space-lg)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)', gap: 'var(--space-xxl)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
            <BadgePill>Markets</BadgePill>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--type-display-md-size)', lineHeight: 'var(--type-display-md-lh)', letterSpacing: 'var(--type-display-md-ls)', color: 'var(--color-ink)' }}>Prices, without the noise</h2>
            <p style={{ margin: 0, maxWidth: '40ch', color: 'var(--color-body)' }}>Every listed asset with a quoted mid, 24-hour change and the disclosures that go with it.</p>
            <Button variant="secondary-light" onClick={() => onNavigate && onNavigate('Cryptocurrencies')}>Explore all assets</Button>
          </div>
          <div style={{ background: 'var(--color-canvas)', border: 'var(--border-hairline)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)' }}>
            {[['Bitcoin','BTC','$64,204.19','+2.41%','var(--color-accent-yellow)'],['Ethereum','ETH','$3,118.40','-0.87%',null],['Solana','SOL','$147.02','+5.16%',null],['USD Coin','USDC','$1.00','+0.01%',null]].map((r,i,a)=>(
              <AssetRow key={r[1]} name={r[0]} ticker={r[1]} price={r[2]} change={r[3]} iconFill={r[4]} divider={i<a.length-1} />
            ))}
          </div>
        </div>
      </section>

      <CTABand headline="Take control of your money" subhead="Open an account in minutes. No minimum balance."
        actions={<><Button size="lg">Get started</Button><Button size="lg" variant="outline-on-dark" onClick={() => onNavigate && onNavigate('Developers')}>Read the docs</Button></>} />
      <Footer />
    </div>
  );
}

function AssetIconPlate({ label = '◆' }) {
  const { AssetIcon } = window.FinsightDesignSystem_7e1a2b;
  return <AssetIcon symbol={label} size={48} fill={label === '◆' ? 'var(--color-accent-yellow)' : undefined} />;
}

Object.assign(window, { HomeScreen });
