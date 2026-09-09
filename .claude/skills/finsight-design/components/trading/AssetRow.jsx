import React from 'react';
import { AssetIcon } from './AssetIcon.jsx';
import { PriceCell } from './PriceCell.jsx';

export function AssetRow({ name, ticker, price, change, iconFill, divider = true, tone = 'light', onClick, style, ...rest }) {
  const dark = tone === 'dark';
  return (
    <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0', minHeight: 48, borderBottom: divider ? (dark ? '1px solid rgba(255,255,255,.08)' : 'var(--border-hairline)') : 'none', cursor: onClick ? 'pointer' : 'default', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
        <AssetIcon symbol={ticker} fill={iconFill} />
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-title-md-size)', fontWeight: 'var(--type-title-md-weight)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-sm-size)', color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-muted)' }}>{ticker}</span>
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--type-number-size)', fontWeight: 'var(--type-number-weight)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap' }}>{price}</span>
      <PriceCell value={change} style={{ minWidth: 76, whiteSpace: 'nowrap' }} />
    </div>
  );
}
