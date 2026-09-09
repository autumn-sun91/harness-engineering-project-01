import React from 'react';

export function SearchPill({ placeholder = 'Search assets', value, onChange, width = 280, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', height: 'var(--control-height)', padding: '0 var(--space-md)', background: 'var(--color-surface-strong)', borderRadius: 'var(--radius-pill)', width, ...style }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-sm-size)', color: 'var(--color-ink)' }} {...rest} />
    </div>
  );
}
