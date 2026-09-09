import * as React from 'react';

/**
 * The floating product-UI mockup card — the brand's signature decorative object.
 * @startingPoint section="Core" subtitle="Layered dark product-UI mockup card" viewport="700x300"
 */
export interface ProductUICardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `dark` floats on a dark hero; `light` is the Explore asset-card variant. */
  tone?: 'dark' | 'light';
  title?: string;
  /** Right-aligned numeric readout, rendered in Mono. */
  meta?: string;
  /** Slight tilt in degrees for stacked arrangements. */
  rotate?: number;
  width?: number | string;
}

export declare function ProductUICard(props: ProductUICardProps): JSX.Element;
