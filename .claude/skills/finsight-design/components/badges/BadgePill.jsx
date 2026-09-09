import React from 'react';

export function BadgePill({ children, tone = 'light', style, ...rest }) {
  const tones = {
    light: { background: 'var(--color-surface-strong)', color: 'var(--color-ink)' },
    dark: { background: 'var(--color-surface-dark-elevated)', color: 'var(--color-on-dark)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 var(--space-sm)', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontSize: 'var(--type-caption-strong-size)', fontWeight: 'var(--type-caption-strong-weight)', letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', ...tones[tone], ...style }} {...rest}>{children}</span>
  );
}
