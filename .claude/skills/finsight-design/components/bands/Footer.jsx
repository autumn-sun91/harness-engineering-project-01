import React from 'react';
import { Wordmark } from '../navigation/Wordmark.jsx';

const DEFAULT_COLUMNS = [
  { title: 'Company', links: ['About', 'Careers', 'Newsroom', 'Blog'] },
  { title: 'Individuals', links: ['Buy & sell', 'Wallet', 'Card', 'Earn'] },
  { title: 'Businesses', links: ['Prime', 'Custody', 'Payments', 'Asset hub'] },
  { title: 'Developers', links: ['Docs', 'API status', 'Base', 'Faucet'] },
  { title: 'Support', links: ['Help centre', 'Contact us', 'Fees', 'Security'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Disclosures'] },
];

export function Footer({ columns = DEFAULT_COLUMNS, legal = '© 2026 Finsight. All rights reserved. Finsight is a financial technology company, not a bank.', style, ...rest }) {
  return (
    <footer style={{ background: 'var(--color-canvas)', color: 'var(--color-body)', padding: 'var(--space-xxl) var(--space-lg) var(--space-xl)', borderTop: 'var(--border-hairline)', ...style }} {...rest}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-xl)' }}>
          {columns.map((c) => (
            <div key={c.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-title-sm-size)', fontWeight: 'var(--type-title-sm-weight)', color: 'var(--color-ink)' }}>{c.title}</span>
              {c.links.map((l) => (
                <a key={l} href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-sm-size)', lineHeight: 'var(--type-body-sm-lh)', color: 'var(--color-body)', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'var(--space-xxl)', paddingTop: 'var(--space-lg)', borderTop: 'var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-base)', flexWrap: 'wrap' }}>
          <Wordmark tone="ink" size={18} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-caption-size)', lineHeight: 'var(--type-caption-lh)', color: 'var(--color-muted)' }}>{legal}</span>
        </div>
      </div>
    </footer>
  );
}
