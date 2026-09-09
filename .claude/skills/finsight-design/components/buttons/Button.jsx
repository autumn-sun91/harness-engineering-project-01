import React from 'react';

const VARIANTS = {
  primary: { background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: '1px solid transparent' },
  'primary-active': { background: 'var(--color-primary-active)', color: 'var(--color-on-primary)', border: '1px solid transparent' },
  'secondary-light': { background: 'var(--color-surface-strong)', color: 'var(--color-ink)', border: '1px solid transparent' },
  'secondary-dark': { background: 'var(--color-surface-dark-elevated)', color: 'var(--color-on-dark)', border: '1px solid transparent' },
  'outline-on-dark': { background: 'transparent', color: 'var(--color-on-dark)', border: '1px solid var(--color-on-dark)' },
  'tertiary-text': { background: 'transparent', color: 'var(--color-primary)', border: '1px solid transparent', padding: 0 },
};

const SIZES = {
  sm: { height: 36, padding: '0 var(--space-base)' },
  md: { height: 'var(--control-height)', padding: '0 var(--space-md)' },
  lg: { height: 'var(--control-height-lg)', padding: '0 var(--space-xl)' },
};

export function Button({ variant = 'primary', size = 'md', disabled = false, as = 'button', children, style, ...rest }) {
  const Tag = as;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const off = disabled && variant.startsWith('primary');
  return (
    <Tag disabled={Tag === 'button' ? disabled : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)',
        fontFamily: 'var(--font-sans)', fontSize: 'var(--type-button-size)', fontWeight: 'var(--type-button-weight)', lineHeight: 'var(--type-button-lh)',
        borderRadius: 'var(--radius-pill)', cursor: disabled ? 'not-allowed' : 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
        ...v, ...(variant === 'tertiary-text' ? { height: 'auto' } : s),
        ...(off ? { background: 'var(--color-primary-disabled)' } : null),
        ...(disabled && !off ? { color: 'var(--color-muted-soft)' } : null),
        ...style,
      }} {...rest}>{children}</Tag>
  );
}
