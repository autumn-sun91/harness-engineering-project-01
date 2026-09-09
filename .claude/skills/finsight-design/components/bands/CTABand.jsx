import React from 'react';

export function CTABand({ tone = 'dark', headline, subhead, actions, style, ...rest }) {
  const dark = tone === 'dark';
  return (
    <section style={{ background: dark ? 'var(--color-surface-dark)' : 'var(--color-surface-soft)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', padding: 'var(--space-section) var(--space-lg)', textAlign: 'center', ...style }} {...rest}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--type-display-weight)', fontSize: 'var(--type-display-md-size)', lineHeight: 'var(--type-display-md-lh)', letterSpacing: 'var(--type-display-md-ls)' }}>{headline}</h2>
        {subhead && <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-md-size)', lineHeight: 'var(--type-body-md-lh)', color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-body)' }}>{subhead}</p>}
        {actions && <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-sm)' }}>{actions}</div>}
      </div>
    </section>
  );
}
