import React from 'react';

export function AssetIcon({ symbol = '?', size = 32, fill, style, ...rest }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: 'var(--radius-full)', background: fill || 'var(--color-surface-strong)', color: fill ? 'var(--color-on-primary)' : 'var(--color-ink)', fontFamily: 'var(--font-sans)', fontSize: Math.round(size * 0.4), fontWeight: 600, flex: '0 0 auto', ...style }} {...rest}>{symbol.slice(0, 2)}</span>
  );
}
