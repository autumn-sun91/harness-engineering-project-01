import React from 'react';

/* No logo files were supplied with the brand sources, so the mark is the brand
   name set in Display type. Do not substitute an invented glyph. */
export function Wordmark({ text = 'finsight', tone = 'primary', size = 22, href, style, ...rest }) {
  const color = tone === 'on-dark' ? 'var(--color-on-dark)' : tone === 'ink' ? 'var(--color-ink)' : 'var(--color-primary)';
  const Tag = href ? 'a' : 'span';
  return (
    <Tag href={href} style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1, color, textDecoration: 'none', ...style }} {...rest}>{text}</Tag>
  );
}
