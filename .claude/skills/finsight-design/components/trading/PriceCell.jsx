import React from 'react';

export function PriceCell({ value, direction, align = 'right', style, ...rest }) {
  const dir = direction || (String(value).trim().startsWith('-') ? 'down' : 'up');
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-number-size)', fontWeight: 'var(--type-number-weight)', lineHeight: 'var(--type-number-lh)', color: dir === 'down' ? 'var(--color-semantic-down)' : 'var(--color-semantic-up)', textAlign: align, fontVariantNumeric: 'tabular-nums', ...style }} {...rest}>{value}</span>
  );
}
