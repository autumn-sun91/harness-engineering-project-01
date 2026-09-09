import React from 'react';
import { Button } from '../buttons/Button.jsx';

export function PricingTierCard({ name, price, cadence, features = [], cta = 'Get started', featured = false, onSelect, style, ...rest }) {
  return (
    <div style={{ background: featured ? 'var(--color-surface-dark)' : 'var(--color-canvas)', color: featured ? 'var(--color-on-dark)' : 'var(--color-ink)', border: featured ? '1px solid transparent' : 'var(--border-hairline)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', ...style }} {...rest}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-title-md-size)', fontWeight: 'var(--type-title-md-weight)' }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-xxs)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--type-display-weight)', fontSize: 'var(--type-display-sm-size)', letterSpacing: 'var(--type-display-sm-ls)', lineHeight: 1 }}>{price}</span>
        {cadence && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-sm-size)', color: featured ? 'var(--color-on-dark-soft)' : 'var(--color-muted)' }}>{cadence}</span>}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', flex: 1 }}>
        {features.map((t) => (
          <li key={t} style={{ display: 'flex', gap: 'var(--space-xs)', fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-md-size)', lineHeight: 'var(--type-body-md-lh)', color: featured ? 'var(--color-on-dark-soft)' : 'var(--color-body)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={featured ? 'var(--color-on-dark)' : 'var(--color-primary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: 3 }} aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>
            {t}
          </li>
        ))}
      </ul>
      <Button variant={featured ? 'primary' : 'secondary-light'} onClick={onSelect} style={{ width: '100%' }}>{cta}</Button>
    </div>
  );
}
