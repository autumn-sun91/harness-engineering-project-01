import * as React from 'react';

/**
 * One row in an asset list: circular glyph, name + ticker, Mono price, signed change.
 * @startingPoint section="Trading" subtitle="Asset list row with price and 24h change" viewport="700x200"
 */
export interface AssetRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  ticker: string;
  /** Pre-formatted price string, e.g. `"$64,204.19"`. */
  price: string;
  /** Signed change, e.g. `"-1.02%"`. */
  change: string;
  /** Illustrative glyph fill. */
  iconFill?: string;
  /** `dark` recolours the row for use inside a dark mockup card. */
  tone?: 'light' | 'dark';
  divider?: boolean;
}

export declare function AssetRow(props: AssetRowProps): JSX.Element;
