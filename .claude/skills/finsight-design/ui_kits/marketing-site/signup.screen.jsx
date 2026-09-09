const { TopNav, Footer, Button, BadgePill, TextInput, ProductUICard, AssetRow } = window.FinsightDesignSystem_7e1a2b;

function SignupScreen({ onNavigate }) {
  const [step, setStep] = React.useState(0);
  const [email, setEmail] = React.useState('');
  return (
    <div style={{ background: 'var(--color-canvas)', minHeight: '100%' }}>
      <TopNav onNavigate={onNavigate} />
      <section style={{ padding: 'var(--space-section) var(--space-lg)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--space-section)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', alignItems: 'flex-start', maxWidth: 420 }}>
            <BadgePill>Step {step + 1} of 2</BadgePill>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--type-display-lg-size)', lineHeight: 'var(--type-display-lg-lh)', letterSpacing: 'var(--type-display-lg-ls)', color: 'var(--color-ink)' }}>
              {step === 0 ? 'Create your account' : 'Check your email'}
            </h1>
            {step === 0 ? (
              <>
                <p style={{ margin: 0, color: 'var(--color-body)' }}>It takes about two minutes. You'll verify your identity before your first trade.</p>
                <TextInput label="Email address" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
                <TextInput label="Password" type="password" placeholder="At least 12 characters" hint="Use a passphrase you don't use elsewhere." style={{ width: '100%' }} />
                <Button size="lg" disabled={!email.includes('@')} onClick={() => setStep(1)}>Create account</Button>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-muted)' }}>By continuing you agree to the User Agreement and Privacy Policy.</span>
              </>
            ) : (
              <>
                <p style={{ margin: 0, color: 'var(--color-body)' }}>We sent a verification link to <strong style={{ color: 'var(--color-ink)' }}>{email}</strong>. It expires in 30 minutes.</p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <Button size="lg">Open email app</Button>
                  <Button size="lg" variant="secondary-light" onClick={() => setStep(0)}>Use another email</Button>
                </div>
              </>
            )}
          </div>
          <div style={{ background: 'var(--color-surface-dark)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xxl)', display: 'flex', justifyContent: 'center' }}>
            <ProductUICard title="Portfolio" meta="$0.00" width={340}>
              <p style={{ margin: '0 0 var(--space-md)', color: 'var(--color-on-dark-soft)', fontSize: 'var(--type-body-sm-size)' }}>Your balances appear here once you fund the account.</p>
              {[['Bitcoin','BTC','$64,204.19','+2.41%','var(--color-accent-yellow)'],['Ethereum','ETH','$3,118.40','-0.87%',null]].map((r,i,a) => (
                <AssetRow key={r[1]} name={r[0]} ticker={r[1]} price={r[2]} change={r[3]} iconFill={r[4]} divider={i < a.length - 1} tone="dark" />
              ))}
            </ProductUICard>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

Object.assign(window, { SignupScreen });
