import React from 'react';

export function TextInput({ label, hint, value, onChange, placeholder, type = 'text', style, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', ...style }}>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--type-title-sm-size)', fontWeight: 'var(--type-title-sm-weight)', color: 'var(--color-ink)' }}>{label}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          height: 'var(--input-height)', padding: '14px var(--space-base)', background: 'var(--color-canvas)', color: 'var(--color-ink)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--type-body-md-size)', borderRadius: 'var(--radius-md)', outline: 'none',
          border: focused ? '2px solid var(--color-primary)' : '1px solid var(--color-hairline)',
          padding: focused ? '13px 15px' : '14px 16px',
        }} {...rest} />
      {hint && <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-muted)' }}>{hint}</span>}
    </label>
  );
}
