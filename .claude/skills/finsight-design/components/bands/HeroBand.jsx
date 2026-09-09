import React from 'react';

export function HeroBand({ tone = 'dark', eyebrow, headline, subhead, actions, mockups, style, children, ...rest }) {
  const dark = tone === 'dark';
  return (
    <section style={{ background: dark ? 'var(--color-surface-dark)' : 'var(--color-canvas)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', padding: 'var(--space-section) var(--space-lg)', ...style }} {...rest}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'grid', gridTemplateColumns: mockups ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)', gap: 'var(--space-xxl)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
          {eyebrow}
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--type-display-weight)', fontSize: 'var(--type-display-mega-size)', lineHeight: 'var(--type-display-mega-lh)', letterSpacing: 'var(--type-display-mega-ls)', textWrap: 'pretty' }}>{headline}</h1>
          {subhead && <p style={{ margin: 0, maxWidth: '46ch', fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-md-size)', lineHeight: 'var(--type-body-md-lh)', color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-body)' }}>{subhead}</p>}
          {actions && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>{actions}</div>}
          {children}
        </div>
        {mockups && <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--space-md)' }}>{mockups}</div>}
      </div>
    </section>
  );
}
