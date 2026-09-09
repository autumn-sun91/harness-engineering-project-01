import * as React from 'react';

export interface PriceCellProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Formatted change, e.g. `"+2.41%"`. */
  value: string;
  /** Inferred from a leading `-` when omitted. */
  direction?: 'up' | 'down';
  align?: 'left' | 'right';
}

export declare function PriceCell(props: PriceCellProps): JSX.Element;
