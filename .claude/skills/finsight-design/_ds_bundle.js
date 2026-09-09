/* @ds-bundle: {"format":4,"namespace":"FinsightDesignSystem_7e1a2b","components":[{"name":"BadgePill","sourcePath":"components/badges/BadgePill.jsx"},{"name":"CTABand","sourcePath":"components/bands/CTABand.jsx"},{"name":"Footer","sourcePath":"components/bands/Footer.jsx"},{"name":"HeroBand","sourcePath":"components/bands/HeroBand.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"FeatureCard","sourcePath":"components/cards/FeatureCard.jsx"},{"name":"PricingTierCard","sourcePath":"components/cards/PricingTierCard.jsx"},{"name":"ProductUICard","sourcePath":"components/cards/ProductUICard.jsx"},{"name":"SearchPill","sourcePath":"components/forms/SearchPill.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"TopNav","sourcePath":"components/navigation/TopNav.jsx"},{"name":"Wordmark","sourcePath":"components/navigation/Wordmark.jsx"},{"name":"AssetIcon","sourcePath":"components/trading/AssetIcon.jsx"},{"name":"AssetRow","sourcePath":"components/trading/AssetRow.jsx"},{"name":"PriceCell","sourcePath":"components/trading/PriceCell.jsx"}],"sourceHashes":{"components/badges/BadgePill.jsx":"e1f963637774","components/bands/CTABand.jsx":"d4a1c021e9c2","components/bands/Footer.jsx":"0a3668f779bf","components/bands/HeroBand.jsx":"54fd75aa5daf","components/buttons/Button.jsx":"583418316b84","components/cards/FeatureCard.jsx":"5f064d837b5e","components/cards/PricingTierCard.jsx":"bbdf923d37bc","components/cards/ProductUICard.jsx":"2c923a35ca9e","components/forms/SearchPill.jsx":"fea3d637e41c","components/forms/TextInput.jsx":"6ee59b0209a7","components/navigation/TopNav.jsx":"80a2cb94a064","components/navigation/Wordmark.jsx":"9d7066640c60","components/trading/AssetIcon.jsx":"25ab2290a4a0","components/trading/AssetRow.jsx":"35897e0e377e","components/trading/PriceCell.jsx":"62523ed4fcbb","ui_kits/developer-platform/keys.screen.jsx":"0334c8de2da1","ui_kits/developer-platform/pricing.screen.jsx":"a0689d89eb29","ui_kits/marketing-site/explore.screen.jsx":"35e7c48cb7a6","ui_kits/marketing-site/home.screen.jsx":"a651c17e8e10","ui_kits/marketing-site/signup.screen.jsx":"6412690e3176"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FinsightDesignSystem_7e1a2b = window.FinsightDesignSystem_7e1a2b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/badges/BadgePill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function BadgePill({
  children,
  tone = 'light',
  style,
  ...rest
}) {
  const tones = {
    light: {
      background: 'var(--color-surface-strong)',
      color: 'var(--color-ink)'
    },
    dark: {
      background: 'var(--color-surface-dark-elevated)',
      color: 'var(--color-on-dark)'
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: 24,
      padding: '0 var(--space-sm)',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-caption-strong-size)',
      fontWeight: 'var(--type-caption-strong-weight)',
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { BadgePill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/BadgePill.jsx", error: String((e && e.message) || e) }); }

// components/bands/CTABand.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function CTABand({
  tone = 'dark',
  headline,
  subhead,
  actions,
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: dark ? 'var(--color-surface-dark)' : 'var(--color-surface-soft)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      padding: 'var(--space-section) var(--space-lg)',
      textAlign: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--type-display-weight)',
      fontSize: 'var(--type-display-md-size)',
      lineHeight: 'var(--type-display-md-lh)',
      letterSpacing: 'var(--type-display-md-ls)'
    }
  }, headline), subhead && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-md-size)',
      lineHeight: 'var(--type-body-md-lh)',
      color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-body)'
    }
  }, subhead), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 'var(--space-sm)'
    }
  }, actions)));
}
Object.assign(__ds_scope, { CTABand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bands/CTABand.jsx", error: String((e && e.message) || e) }); }

// components/bands/HeroBand.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function HeroBand({
  tone = 'dark',
  eyebrow,
  headline,
  subhead,
  actions,
  mockups,
  style,
  children,
  ...rest
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: dark ? 'var(--color-surface-dark)' : 'var(--color-canvas)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      padding: 'var(--space-section) var(--space-lg)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: mockups ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
      gap: 'var(--space-xxl)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      alignItems: 'flex-start'
    }
  }, eyebrow, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--type-display-weight)',
      fontSize: 'var(--type-display-mega-size)',
      lineHeight: 'var(--type-display-mega-lh)',
      letterSpacing: 'var(--type-display-mega-ls)',
      textWrap: 'pretty'
    }
  }, headline), subhead && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: '46ch',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-md-size)',
      lineHeight: 'var(--type-body-md-lh)',
      color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-body)'
    }
  }, subhead), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-sm)'
    }
  }, actions), children), mockups && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 'var(--space-md)'
    }
  }, mockups)));
}
Object.assign(__ds_scope, { HeroBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bands/HeroBand.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VARIANTS = {
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    border: '1px solid transparent'
  },
  'primary-active': {
    background: 'var(--color-primary-active)',
    color: 'var(--color-on-primary)',
    border: '1px solid transparent'
  },
  'secondary-light': {
    background: 'var(--color-surface-strong)',
    color: 'var(--color-ink)',
    border: '1px solid transparent'
  },
  'secondary-dark': {
    background: 'var(--color-surface-dark-elevated)',
    color: 'var(--color-on-dark)',
    border: '1px solid transparent'
  },
  'outline-on-dark': {
    background: 'transparent',
    color: 'var(--color-on-dark)',
    border: '1px solid var(--color-on-dark)'
  },
  'tertiary-text': {
    background: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid transparent',
    padding: 0
  }
};
const SIZES = {
  sm: {
    height: 36,
    padding: '0 var(--space-base)'
  },
  md: {
    height: 'var(--control-height)',
    padding: '0 var(--space-md)'
  },
  lg: {
    height: 'var(--control-height-lg)',
    padding: '0 var(--space-xl)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  as = 'button',
  children,
  style,
  ...rest
}) {
  const Tag = as;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const off = disabled && variant.startsWith('primary');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === 'button' ? disabled : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-button-size)',
      fontWeight: 'var(--type-button-weight)',
      lineHeight: 'var(--type-button-lh)',
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      ...v,
      ...(variant === 'tertiary-text' ? {
        height: 'auto'
      } : s),
      ...(off ? {
        background: 'var(--color-primary-disabled)'
      } : null),
      ...(disabled && !off ? {
        color: 'var(--color-muted-soft)'
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/cards/FeatureCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function FeatureCard({
  title,
  children,
  media,
  eyebrow,
  tone = 'light',
  border = true,
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("article", _extends({
    style: {
      background: dark ? 'var(--color-surface-dark-elevated)' : 'var(--color-canvas)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      border: border && !dark ? 'var(--border-hairline)' : '1px solid transparent',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      ...style
    }
  }, rest), media, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-caption-strong-size)',
      fontWeight: 'var(--type-caption-strong-weight)',
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-muted)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-title-md-size)',
      fontWeight: 'var(--type-title-md-weight)',
      lineHeight: 'var(--type-title-md-lh)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-md-size)',
      lineHeight: 'var(--type-body-md-lh)',
      color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-body)'
    }
  }, children));
}
Object.assign(__ds_scope, { FeatureCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/FeatureCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PricingTierCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function PricingTierCard({
  name,
  price,
  cadence,
  features = [],
  cta = 'Get started',
  featured = false,
  onSelect,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: featured ? 'var(--color-surface-dark)' : 'var(--color-canvas)',
      color: featured ? 'var(--color-on-dark)' : 'var(--color-ink)',
      border: featured ? '1px solid transparent' : 'var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-title-md-size)',
      fontWeight: 'var(--type-title-md-weight)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-xxs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--type-display-weight)',
      fontSize: 'var(--type-display-sm-size)',
      letterSpacing: 'var(--type-display-sm-ls)',
      lineHeight: 1
    }
  }, price), cadence && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-sm-size)',
      color: featured ? 'var(--color-on-dark-soft)' : 'var(--color-muted)'
    }
  }, cadence)), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      flex: 1
    }
  }, features.map(t => /*#__PURE__*/React.createElement("li", {
    key: t,
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-md-size)',
      lineHeight: 'var(--type-body-md-lh)',
      color: featured ? 'var(--color-on-dark-soft)' : 'var(--color-body)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: featured ? 'var(--color-on-dark)' : 'var(--color-primary)',
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flex: '0 0 auto',
      marginTop: 3
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m5 13 4 4L19 7"
  })), t))), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: featured ? 'primary' : 'secondary-light',
    onClick: onSelect,
    style: {
      width: '100%'
    }
  }, cta));
}
Object.assign(__ds_scope, { PricingTierCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PricingTierCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/ProductUICard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProductUICard({
  tone = 'dark',
  title,
  meta,
  children,
  rotate = 0,
  width,
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: dark ? 'var(--color-surface-dark-elevated)' : 'var(--color-canvas)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      border: dark ? '1px solid transparent' : 'var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)',
      width,
      maxWidth: '100%',
      minWidth: 0,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      boxShadow: 'var(--shadow-soft)',
      ...style
    }
  }, rest), (title || meta) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 'var(--space-base)',
      marginBottom: 'var(--space-md)'
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-title-md-size)',
      fontWeight: 'var(--type-title-md-weight)'
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--type-number-size)',
      fontWeight: 'var(--type-number-weight)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, meta)), children);
}
Object.assign(__ds_scope, { ProductUICard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ProductUICard.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SearchPill({
  placeholder = 'Search assets',
  value,
  onChange,
  width = 280,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      height: 'var(--control-height)',
      padding: '0 var(--space-md)',
      background: 'var(--color-surface-strong)',
      borderRadius: 'var(--radius-pill)',
      width,
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--color-muted)",
    strokeWidth: "2",
    strokeLinecap: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5"
  })), /*#__PURE__*/React.createElement("input", _extends({
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-sm-size)',
      color: 'var(--color-ink)'
    }
  }, rest)));
}
Object.assign(__ds_scope, { SearchPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchPill.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-title-sm-size)',
      fontWeight: 'var(--type-title-sm-weight)',
      color: 'var(--color-ink)'
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      height: 'var(--input-height)',
      padding: '14px var(--space-base)',
      background: 'var(--color-canvas)',
      color: 'var(--color-ink)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-md-size)',
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      border: focused ? '2px solid var(--color-primary)' : '1px solid var(--color-hairline)',
      padding: focused ? '13px 15px' : '14px 16px'
    }
  }, rest)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--type-caption-size)',
      color: 'var(--color-muted)'
    }
  }, hint));
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* No logo files were supplied with the brand sources, so the mark is the brand
   name set in Display type. Do not substitute an invented glyph. */
function Wordmark({
  text = 'finsight',
  tone = 'primary',
  size = 22,
  href,
  style,
  ...rest
}) {
  const color = tone === 'on-dark' ? 'var(--color-on-dark)' : tone === 'ink' ? 'var(--color-ink)' : 'var(--color-primary)';
  const Tag = href ? 'a' : 'span';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: size,
      letterSpacing: '-0.03em',
      lineHeight: 1,
      color,
      textDecoration: 'none',
      ...style
    }
  }, rest), text);
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/bands/Footer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULT_COLUMNS = [{
  title: 'Company',
  links: ['About', 'Careers', 'Newsroom', 'Blog']
}, {
  title: 'Individuals',
  links: ['Buy & sell', 'Wallet', 'Card', 'Earn']
}, {
  title: 'Businesses',
  links: ['Prime', 'Custody', 'Payments', 'Asset hub']
}, {
  title: 'Developers',
  links: ['Docs', 'API status', 'Base', 'Faucet']
}, {
  title: 'Support',
  links: ['Help centre', 'Contact us', 'Fees', 'Security']
}, {
  title: 'Legal',
  links: ['Privacy', 'Terms', 'Cookies', 'Disclosures']
}];
function Footer({
  columns = DEFAULT_COLUMNS,
  legal = '© 2026 Finsight. All rights reserved. Finsight is a financial technology company, not a bank.',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({
    style: {
      background: 'var(--color-canvas)',
      color: 'var(--color-body)',
      padding: 'var(--space-xxl) var(--space-lg) var(--space-xl)',
      borderTop: 'var(--border-hairline)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
      gap: 'var(--space-xl)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-title-sm-size)',
      fontWeight: 'var(--type-title-sm-weight)',
      color: 'var(--color-ink)'
    }
  }, c.title), c.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-sm-size)',
      lineHeight: 'var(--type-body-sm-lh)',
      color: 'var(--color-body)',
      textDecoration: 'none'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-xxl)',
      paddingTop: 'var(--space-lg)',
      borderTop: 'var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-base)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    tone: "ink",
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-caption-size)',
      lineHeight: 'var(--type-caption-lh)',
      color: 'var(--color-muted)'
    }
  }, legal))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bands/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULT_LINKS = ['Cryptocurrencies', 'Individuals', 'Businesses', 'Institutions', 'Developers', 'Company'];
function TopNav({
  tone = 'light',
  links = DEFAULT_LINKS,
  activeLink,
  onNavigate,
  style,
  ...rest
}) {
  const dark = tone === 'on-dark';
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      height: 'var(--nav-height)',
      background: dark ? 'var(--color-surface-dark)' : 'var(--color-canvas)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      display: 'flex',
      alignItems: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--space-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    tone: dark ? 'on-dark' : 'primary',
    size: 20
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)',
      flex: 1
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate && onNavigate(l);
    },
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-nav-size)',
      fontWeight: 'var(--type-nav-weight)',
      lineHeight: 'var(--type-nav-lh)',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      color: l === activeLink ? 'var(--color-primary)' : dark ? 'var(--color-on-dark)' : 'var(--color-ink)'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 'var(--type-nav-size)',
      fontWeight: 'var(--type-nav-weight)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: dark ? 'secondary-dark' : 'primary',
    size: "sm"
  }, "Sign up"))));
}
Object.assign(__ds_scope, { TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNav.jsx", error: String((e && e.message) || e) }); }

// components/trading/AssetIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AssetIcon({
  symbol = '?',
  size = 32,
  fill,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: 'var(--radius-full)',
      background: fill || 'var(--color-surface-strong)',
      color: fill ? 'var(--color-on-primary)' : 'var(--color-ink)',
      fontFamily: 'var(--font-sans)',
      fontSize: Math.round(size * 0.4),
      fontWeight: 600,
      flex: '0 0 auto',
      ...style
    }
  }, rest), symbol.slice(0, 2));
}
Object.assign(__ds_scope, { AssetIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/trading/AssetIcon.jsx", error: String((e && e.message) || e) }); }

// components/trading/PriceCell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function PriceCell({
  value,
  direction,
  align = 'right',
  style,
  ...rest
}) {
  const dir = direction || (String(value).trim().startsWith('-') ? 'down' : 'up');
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--type-number-size)',
      fontWeight: 'var(--type-number-weight)',
      lineHeight: 'var(--type-number-lh)',
      color: dir === 'down' ? 'var(--color-semantic-down)' : 'var(--color-semantic-up)',
      textAlign: align,
      fontVariantNumeric: 'tabular-nums',
      ...style
    }
  }, rest), value);
}
Object.assign(__ds_scope, { PriceCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/trading/PriceCell.jsx", error: String((e && e.message) || e) }); }

// components/trading/AssetRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AssetRow({
  name,
  ticker,
  price,
  change,
  iconFill,
  divider = true,
  tone = 'light',
  onClick,
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) auto auto',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      padding: 'var(--space-xs) 0',
      minHeight: 48,
      borderBottom: divider ? dark ? '1px solid rgba(255,255,255,.08)' : 'var(--border-hairline)' : 'none',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.AssetIcon, {
    symbol: ticker,
    fill: iconFill
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-title-md-size)',
      fontWeight: 'var(--type-title-md-weight)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-body-sm-size)',
      color: dark ? 'var(--color-on-dark-soft)' : 'var(--color-muted)'
    }
  }, ticker))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--type-number-size)',
      fontWeight: 'var(--type-number-weight)',
      color: dark ? 'var(--color-on-dark)' : 'var(--color-ink)',
      fontVariantNumeric: 'tabular-nums',
      textAlign: 'right',
      whiteSpace: 'nowrap'
    }
  }, price), /*#__PURE__*/React.createElement(__ds_scope.PriceCell, {
    value: change,
    style: {
      minWidth: 76,
      whiteSpace: 'nowrap'
    }
  }));
}
Object.assign(__ds_scope, { AssetRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/trading/AssetRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/developer-platform/keys.screen.jsx
try { (() => {
const {
  TopNav,
  Footer,
  Button,
  BadgePill,
  TextInput,
  SearchPill,
  PricingTierCard,
  FeatureCard,
  ProductUICard
} = window.FinsightDesignSystem_7e1a2b;
function KeysScreen({
  onNavigate
}) {
  const [keys, setKeys] = React.useState([{
    label: 'production-web',
    scope: 'Read + trade',
    created: '2026-02-11'
  }, {
    label: 'sandbox-ci',
    scope: 'Read only',
    created: '2026-01-04'
  }]);
  const [label, setLabel] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const shown = keys.filter(k => k.label.includes(filter));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-canvas)'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    activeLink: "Developers",
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--space-xxl) var(--space-lg) var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 'var(--space-lg)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement(BadgePill, null, "Sandbox"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'var(--type-display-md-size)',
      lineHeight: 'var(--type-display-md-lh)',
      letterSpacing: 'var(--type-display-md-ls)',
      color: 'var(--color-ink)'
    }
  }, "API keys")), /*#__PURE__*/React.createElement(SearchPill, {
    placeholder: "Filter keys",
    value: filter,
    onChange: e => setFilter(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)',
      gap: 'var(--space-lg)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 'var(--space-lg)',
      paddingBottom: 'var(--space-xs)',
      borderBottom: 'var(--border-hairline)',
      fontSize: 'var(--type-body-sm-size)',
      color: 'var(--color-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Label"), /*#__PURE__*/React.createElement("span", null, "Scope"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 110,
      textAlign: 'right'
    }
  }, "Created")), shown.map(k => /*#__PURE__*/React.createElement("div", {
    key: k.label,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 'var(--space-lg)',
      alignItems: 'center',
      minHeight: 56,
      borderBottom: 'var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--type-body-sm-size)',
      color: 'var(--color-ink)'
    }
  }, k.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--type-body-sm-size)',
      color: 'var(--color-body)'
    }
  }, k.scope), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--type-body-sm-size)',
      color: 'var(--color-muted)',
      minWidth: 110,
      textAlign: 'right'
    }
  }, k.created))), shown.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-muted)',
      marginTop: 'var(--space-lg)'
    }
  }, "No keys match that filter.")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--type-title-md-size)',
      fontWeight: 600,
      color: 'var(--color-ink)'
    }
  }, "Create a key"), /*#__PURE__*/React.createElement(TextInput, {
    label: "Label",
    placeholder: "production-web",
    value: label,
    onChange: e => setLabel(e.target.value)
  }), /*#__PURE__*/React.createElement(Button, {
    disabled: !label,
    onClick: () => {
      setKeys([{
        label,
        scope: 'Read only',
        created: '2026-09-07'
      }, ...keys]);
      setLabel('');
    }
  }, "Create key"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--type-caption-size)',
      color: 'var(--color-muted)'
    }
  }, "Secrets are shown once. Rotate every 90 days."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Plan",
    title: "Growth \xB7 250 req/sec"
  }, "You are using 38% of your monthly quota."), /*#__PURE__*/React.createElement(ProductUICard, {
    tone: "light",
    title: "Quota \xB7 September",
    meta: "4,712,004",
    style: {
      boxShadow: 'var(--shadow-none)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--color-surface-strong)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '38%',
      height: '100%',
      background: 'var(--color-primary)'
    }
  })))))), /*#__PURE__*/React.createElement(Footer, null));
}
Object.assign(window, {
  KeysScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/developer-platform/keys.screen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/developer-platform/pricing.screen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  TopNav,
  HeroBand,
  Footer,
  Button,
  BadgePill,
  PricingTierCard,
  FeatureCard,
  CTABand,
  ProductUICard
} = window.FinsightDesignSystem_7e1a2b;
const TIERS = [{
  name: 'Developer',
  price: '$0',
  cadence: '/ month',
  features: ['3 API keys', '10 req/sec', 'Community support', 'Testnet faucet'],
  cta: 'Start free'
}, {
  name: 'Growth',
  price: '$499',
  cadence: '/ month',
  features: ['Unlimited API keys', '250 req/sec', 'Priority support', '99.99% SLA'],
  cta: 'Choose Growth',
  featured: true
}, {
  name: 'Enterprise',
  price: 'Custom',
  features: ['Dedicated infrastructure', 'Custom rate limits', 'Named solutions engineer', 'Audit support'],
  cta: 'Contact sales'
}];
function PricingScreen({
  onNavigate
}) {
  const [selected, setSelected] = React.useState('Growth');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-canvas)'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    activeLink: "Developers",
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(HeroBand, {
    tone: "light",
    eyebrow: /*#__PURE__*/React.createElement(BadgePill, null, "Developer platform"),
    headline: "Build on regulated rails",
    subhead: "One API for balances, quotes and settlement \u2014 with the compliance surface already in place.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "lg"
    }, "Get API keys"), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "secondary-light"
    }, "Read the docs")),
    style: {
      paddingBottom: 'var(--space-xl)'
    }
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '0 var(--space-lg) var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 'var(--space-lg)'
    }
  }, TIERS.map(t => /*#__PURE__*/React.createElement(PricingTierCard, _extends({
    key: t.name
  }, t, {
    featured: selected === t.name,
    onSelect: () => setSelected(t.name)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--color-surface-soft)',
      padding: 'var(--space-section) var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Quotes",
    title: "Single quoted price",
    border: false
  }, "No hidden spread \u2014 the quote you fetch is the quote you settle at."), /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Webhooks",
    title: "Signed, replayable events",
    border: false
  }, "Every state change is delivered with an HMAC signature and a 72-hour replay window."), /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Sandbox",
    title: "Full testnet parity",
    border: false
  }, "The sandbox mirrors production, including rate limits and error codes."))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--color-surface-dark)',
      padding: 'var(--space-section) var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: 'var(--space-xxl)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(BadgePill, {
    tone: "dark"
  }, "Usage"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'var(--type-display-md-size)',
      lineHeight: 'var(--type-display-md-lh)',
      letterSpacing: 'var(--type-display-md-ls)',
      color: 'var(--color-on-dark)'
    }
  }, "Every call accounted for"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: '38ch',
      color: 'var(--color-on-dark-soft)'
    }
  }, "Per-key metering, exportable to your own billing system."), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-on-dark"
  }, "View a sample report")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-md)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(ProductUICard, {
    rotate: -4,
    width: 200,
    title: "Latency",
    meta: "41ms"
  }), /*#__PURE__*/React.createElement(ProductUICard, {
    width: 340,
    title: "Requests \xB7 30d",
    meta: "12,480,331"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 4,
      height: 72,
      marginTop: 'var(--space-xs)'
    }
  }, [30, 46, 38, 54, 50, 62, 58, 70, 66, 74, 68, 78].map((h, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: h,
      background: 'var(--color-primary)',
      opacity: .3 + i * 0.05,
      borderRadius: 'var(--radius-xs)'
    }
  }))))))), /*#__PURE__*/React.createElement(CTABand, {
    headline: "Ship your first transfer today",
    subhead: "Sandbox keys are instant and free.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "lg"
    }, "Get API keys"), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "outline-on-dark"
    }, "Talk to sales"))
  }), /*#__PURE__*/React.createElement(Footer, {
    columns: [{
      title: 'Platform',
      links: ['Overview', 'Pricing', 'Status', 'Changelog']
    }, {
      title: 'APIs',
      links: ['Balances', 'Quotes', 'Transfers', 'Webhooks']
    }, {
      title: 'Guides',
      links: ['Quickstart', 'Auth', 'Idempotency', 'Rate limits']
    }, {
      title: 'SDKs',
      links: ['Node', 'Python', 'Go', 'Ruby']
    }, {
      title: 'Support',
      links: ['Help centre', 'Contact us', 'Security', 'Bug bounty']
    }, {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Disclosures', 'Cookies']
    }]
  }));
}
Object.assign(window, {
  PricingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/developer-platform/pricing.screen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/explore.screen.jsx
try { (() => {
const {
  TopNav,
  HeroBand,
  Footer,
  Button,
  BadgePill,
  SearchPill,
  ProductUICard,
  AssetRow,
  PriceCell,
  AssetIcon,
  CTABand
} = window.FinsightDesignSystem_7e1a2b;
const ASSETS = [['Bitcoin', 'BTC', '$64,204.19', '+2.41%', 'var(--color-accent-yellow)'], ['Ethereum', 'ETH', '$3,118.40', '-0.87%', null], ['Solana', 'SOL', '$147.02', '+5.16%', null], ['USD Coin', 'USDC', '$1.00', '+0.01%', null], ['Cardano', 'ADA', '$0.4412', '-2.08%', null], ['Avalanche', 'AVAX', '$27.63', '+1.19%', null], ['Chainlink', 'LINK', '$14.08', '+3.74%', null], ['Litecoin', 'LTC', '$71.55', '-0.44%', null]];
function ExploreScreen({
  onNavigate
}) {
  const [query, setQuery] = React.useState('');
  const [tab, setTab] = React.useState('All assets');
  const rows = ASSETS.filter(a => (a[0] + a[1]).toLowerCase().includes(query.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-canvas)'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    activeLink: "Cryptocurrencies",
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(HeroBand, {
    tone: "light",
    eyebrow: /*#__PURE__*/React.createElement(BadgePill, null, "Markets"),
    headline: "Explore crypto prices",
    subhead: "Quoted mids across 240+ assets, updated continuously.",
    style: {
      paddingBottom: 'var(--space-xl)'
    },
    actions: /*#__PURE__*/React.createElement(SearchPill, {
      width: 340,
      value: query,
      onChange: e => setQuery(e.target.value),
      placeholder: "Search all 240 assets"
    })
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '0 var(--space-lg) var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      marginBottom: 'var(--space-lg)'
    }
  }, ['All assets', 'Top gainers', 'Recently added'].map(t => /*#__PURE__*/React.createElement(Button, {
    key: t,
    size: "sm",
    variant: t === tab ? 'primary' : 'secondary-light',
    onClick: () => setTab(t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 'var(--space-lg)',
      marginBottom: 'var(--space-xxl)'
    }
  }, rows.slice(0, 3).map(r => /*#__PURE__*/React.createElement(ProductUICard, {
    key: r[1],
    tone: "light",
    title: r[0],
    meta: r[2],
    style: {
      boxShadow: 'var(--shadow-none)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(AssetIcon, {
    symbol: r[1],
    fill: r[4]
  }), /*#__PURE__*/React.createElement(PriceCell, {
    value: r[3]
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 'var(--space-lg)',
      padding: '0 0 var(--space-xs)',
      borderBottom: 'var(--border-hairline)',
      fontSize: 'var(--type-body-sm-size)',
      color: 'var(--color-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Asset"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 120,
      textAlign: 'right'
    }
  }, "Price"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 88,
      textAlign: 'right'
    }
  }, "24h")), rows.map((r, i) => /*#__PURE__*/React.createElement(AssetRow, {
    key: r[1],
    name: r[0],
    ticker: r[1],
    price: r[2],
    change: r[3],
    iconFill: r[4],
    divider: i < rows.length - 1,
    onClick: () => {}
  })), rows.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-muted)',
      padding: 'var(--space-lg) 0'
    }
  }, "No assets match \u201C", query, "\u201D."))), /*#__PURE__*/React.createElement(CTABand, {
    tone: "light",
    headline: "Start with $10",
    subhead: "Buy any listed asset from the app or the web.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, null, "Get started"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary-light"
    }, "See fees"))
  }), /*#__PURE__*/React.createElement(Footer, null));
}
Object.assign(window, {
  ExploreScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/explore.screen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/home.screen.jsx
try { (() => {
const {
  TopNav,
  HeroBand,
  CTABand,
  Footer,
  Button,
  BadgePill,
  FeatureCard,
  ProductUICard,
  AssetRow
} = window.FinsightDesignSystem_7e1a2b;
function HomeScreen({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-canvas)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-surface-dark)'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    tone: "on-dark",
    activeLink: "Individuals",
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(HeroBand, {
    eyebrow: /*#__PURE__*/React.createElement(BadgePill, {
      tone: "dark"
    }, "Regulated"),
    headline: /*#__PURE__*/React.createElement(React.Fragment, null, "Take control of your money"),
    subhead: "Buy, sell and hold 240+ assets with an institution built for scrutiny. Custody, reporting and controls that stand up to an audit.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "lg"
    }, "Get started"), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "outline-on-dark"
    }, "Talk to sales")),
    mockups: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ProductUICard, {
      rotate: -5,
      width: 210,
      title: "BTC / USD",
      meta: "+2.41%"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height: 64
      }
    }, [38, 44, 30, 52, 48, 60, 56, 64, 58, 70].map((h, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        flex: 1,
        height: h,
        background: 'var(--color-primary)',
        opacity: .25 + i * 0.07,
        borderRadius: 'var(--radius-xs)'
      }
    })))), /*#__PURE__*/React.createElement(ProductUICard, {
      title: "Portfolio",
      meta: "$128,402.55",
      width: 360
    }, [['Bitcoin', 'BTC', '$64,204.19', '+2.41%', 'var(--color-accent-yellow)'], ['Ethereum', 'ETH', '$3,118.40', '-0.87%', null], ['Solana', 'SOL', '$147.02', '+5.16%', null]].map((r, i, a) => /*#__PURE__*/React.createElement(AssetRow, {
      key: r[1],
      name: r[0],
      ticker: r[1],
      price: r[2],
      change: r[3],
      iconFill: r[4],
      divider: i < a.length - 1,
      tone: "dark"
    }))))
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--space-section) var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xxl)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      maxWidth: '18ch',
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'var(--type-display-lg-size)',
      lineHeight: 'var(--type-display-lg-lh)',
      letterSpacing: 'var(--type-display-lg-ls)',
      color: 'var(--color-ink)'
    }
  }, "An institution first, an exchange second"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Custody",
    title: "Segregated cold storage",
    media: /*#__PURE__*/React.createElement(AssetIconPlate, null)
  }, "Assets held in audited, bankruptcy-remote structures with insurance on the hot wallet float."), /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Reporting",
    title: "Audit-ready statements"
  }, "Monthly reconciliations, cost-basis exports and read-only access for your accountants."), /*#__PURE__*/React.createElement(FeatureCard, {
    eyebrow: "Execution",
    title: "Deep, quoted liquidity"
  }, "Smart order routing across venues with a single quoted price and no hidden spread.")))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--color-surface-soft)',
      padding: 'var(--space-section) var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)',
      gap: 'var(--space-xxl)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(BadgePill, null, "Markets"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'var(--type-display-md-size)',
      lineHeight: 'var(--type-display-md-lh)',
      letterSpacing: 'var(--type-display-md-ls)',
      color: 'var(--color-ink)'
    }
  }, "Prices, without the noise"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: '40ch',
      color: 'var(--color-body)'
    }
  }, "Every listed asset with a quoted mid, 24-hour change and the disclosures that go with it."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary-light",
    onClick: () => onNavigate && onNavigate('Cryptocurrencies')
  }, "Explore all assets")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-canvas)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)'
    }
  }, [['Bitcoin', 'BTC', '$64,204.19', '+2.41%', 'var(--color-accent-yellow)'], ['Ethereum', 'ETH', '$3,118.40', '-0.87%', null], ['Solana', 'SOL', '$147.02', '+5.16%', null], ['USD Coin', 'USDC', '$1.00', '+0.01%', null]].map((r, i, a) => /*#__PURE__*/React.createElement(AssetRow, {
    key: r[1],
    name: r[0],
    ticker: r[1],
    price: r[2],
    change: r[3],
    iconFill: r[4],
    divider: i < a.length - 1
  }))))), /*#__PURE__*/React.createElement(CTABand, {
    headline: "Take control of your money",
    subhead: "Open an account in minutes. No minimum balance.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "lg"
    }, "Get started"), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "outline-on-dark",
      onClick: () => onNavigate && onNavigate('Developers')
    }, "Read the docs"))
  }), /*#__PURE__*/React.createElement(Footer, null));
}
function AssetIconPlate({
  label = '◆'
}) {
  const {
    AssetIcon
  } = window.FinsightDesignSystem_7e1a2b;
  return /*#__PURE__*/React.createElement(AssetIcon, {
    symbol: label,
    size: 48,
    fill: label === '◆' ? 'var(--color-accent-yellow)' : undefined
  });
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/home.screen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/signup.screen.jsx
try { (() => {
const {
  TopNav,
  Footer,
  Button,
  BadgePill,
  TextInput,
  ProductUICard,
  AssetRow
} = window.FinsightDesignSystem_7e1a2b;
function SignupScreen({
  onNavigate
}) {
  const [step, setStep] = React.useState(0);
  const [email, setEmail] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-canvas)',
      minHeight: '100%'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--space-section) var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: 'var(--space-section)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      alignItems: 'flex-start',
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement(BadgePill, null, "Step ", step + 1, " of 2"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'var(--type-display-lg-size)',
      lineHeight: 'var(--type-display-lg-lh)',
      letterSpacing: 'var(--type-display-lg-ls)',
      color: 'var(--color-ink)'
    }
  }, step === 0 ? 'Create your account' : 'Check your email'), step === 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--color-body)'
    }
  }, "It takes about two minutes. You'll verify your identity before your first trade."), /*#__PURE__*/React.createElement(TextInput, {
    label: "Email address",
    type: "email",
    placeholder: "you@company.com",
    value: email,
    onChange: e => setEmail(e.target.value),
    style: {
      width: '100%'
    }
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Password",
    type: "password",
    placeholder: "At least 12 characters",
    hint: "Use a passphrase you don't use elsewhere.",
    style: {
      width: '100%'
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    disabled: !email.includes('@'),
    onClick: () => setStep(1)
  }, "Create account"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--type-caption-size)',
      color: 'var(--color-muted)'
    }
  }, "By continuing you agree to the User Agreement and Privacy Policy.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--color-body)'
    }
  }, "We sent a verification link to ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--color-ink)'
    }
  }, email), ". It expires in 30 minutes."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "Open email app"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary-light",
    onClick: () => setStep(0)
  }, "Use another email")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-surface-dark)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xxl)',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(ProductUICard, {
    title: "Portfolio",
    meta: "$0.00",
    width: 340
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 var(--space-md)',
      color: 'var(--color-on-dark-soft)',
      fontSize: 'var(--type-body-sm-size)'
    }
  }, "Your balances appear here once you fund the account."), [['Bitcoin', 'BTC', '$64,204.19', '+2.41%', 'var(--color-accent-yellow)'], ['Ethereum', 'ETH', '$3,118.40', '-0.87%', null]].map((r, i, a) => /*#__PURE__*/React.createElement(AssetRow, {
    key: r[1],
    name: r[0],
    ticker: r[1],
    price: r[2],
    change: r[3],
    iconFill: r[4],
    divider: i < a.length - 1,
    tone: "dark"
  })))))), /*#__PURE__*/React.createElement(Footer, null));
}
Object.assign(window, {
  SignupScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/signup.screen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BadgePill = __ds_scope.BadgePill;

__ds_ns.CTABand = __ds_scope.CTABand;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.HeroBand = __ds_scope.HeroBand;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.FeatureCard = __ds_scope.FeatureCard;

__ds_ns.PricingTierCard = __ds_scope.PricingTierCard;

__ds_ns.ProductUICard = __ds_scope.ProductUICard;

__ds_ns.SearchPill = __ds_scope.SearchPill;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.TopNav = __ds_scope.TopNav;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.AssetIcon = __ds_scope.AssetIcon;

__ds_ns.AssetRow = __ds_scope.AssetRow;

__ds_ns.PriceCell = __ds_scope.PriceCell;

})();
