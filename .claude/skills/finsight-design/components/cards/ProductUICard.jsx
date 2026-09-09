import React from 'react';

export function ProductUICard({ tone = 'dark', title, meta, children, rotate = 0, width, style, ...rest }) {
  const dark = tone === 'dark';
  return (
    <div style={{ background: dark ? 'var(--color-surface-dark-elevated)' : 'var(--color-canvas)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', border: dark ? '1px solid transparent' : 'var(--border-hairline)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)', width, maxWidth: '100%', minWidth: 0, transform: rotate ? `rotate(${rotate}deg)` : undefined, boxShadow: 'var(--shadow-soft)', ...style }} {...rest}>
      {(title || meta) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-base)', marginBottom: 'var(--space-md)' }}>
          {title && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-title-md-size)', fontWeight: 'var(--type-title-md-weight)' }}>{title}</span>}
          {meta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-number-size)', fontWeight: 'var(--type-number-weight)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>{meta}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
