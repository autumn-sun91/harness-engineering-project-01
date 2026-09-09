import * as React from 'react';

export interface AssetIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Ticker — first two characters are rendered. */
  symbol?: string;
  /** Diameter in px. 32 in asset rows. */
  size?: number;
  /** Illustrative glyph fill, e.g. `var(--color-accent-yellow)`. Omit for the neutral plate. */
  fill?: string;
}

export declare function AssetIcon(props: AssetIconProps): JSX.Element;
