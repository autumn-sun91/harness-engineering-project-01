import React from 'react';
import { Wordmark } from './Wordmark.jsx';
import { Button } from '../buttons/Button.jsx';

const DEFAULT_LINKS = ['Cryptocurrencies', 'Individuals', 'Businesses', 'Institutions', 'Developers', 'Company'];

export function TopNav({ tone = 'light', links = DEFAULT_LINKS, activeLink, onNavigate, style, ...rest }) {
  const dark = tone === 'on-dark';
  return (
    <header style={{ height: 'var(--nav-height)', background: dark ? 'var(--color-surface-dark)' : 'var(--color-canvas)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', display: 'flex', alignItems: 'center', ...style }} {...rest}>
      <div style={{ width: '100%', maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
        <Wordmark tone={dark ? 'on-dark' : 'primary'} size={20} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flex: 1 }}>
          {links.map((l) => (
            <a key={l} href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate(l); }}
               style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-nav-size)', fontWeight: 'var(--type-nav-weight)', lineHeight: 'var(--type-nav-lh)', textDecoration: 'none', whiteSpace: 'nowrap', color: l === activeLink ? 'var(--color-primary)' : (dark ? 'var(--color-on-dark)' : 'var(--color-ink)') }}>{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <a href="#" style={{ fontSize: 'var(--type-nav-size)', fontWeight: 'var(--type-nav-weight)', color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Sign in</a>
          <Button variant={dark ? 'secondary-dark' : 'primary'} size="sm">Sign up</Button>
        </div>
      </div>
    </header>
  );
}
