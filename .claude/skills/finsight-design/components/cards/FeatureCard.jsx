import React from 'react';

export function FeatureCard({ title, children, media, eyebrow, tone = 'light', border = true, style, ...rest }) {
  const dark = tone === 'dark';
  return (
    <article style={{ background: dark ? 'var(--color-surface-dark-elevated)' : 'var(--color-canvas)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', border: border && !dark ? 'var(--border-hairline)' : '1px solid transparent', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', ...style }} {...rest}>
      {media}
      {eyebrow && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-caption-strong-size)', fontWeight: 'var(--type-caption-strong-weight)', letterSpacing: '.04em', textTransform: 'uppercase', color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-muted)' }}>{eyebrow}</span>}
      <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--type-title-md-size)', fontWeight: 'var(--type-title-md-weight)', lineHeight: 'var(--type-title-md-lh)' }}>{title}</h3>
      <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-md-size)', lineHeight: 'var(--type-body-md-lh)', color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-body)' }}>{children}</p>
    </article>
  );
}
