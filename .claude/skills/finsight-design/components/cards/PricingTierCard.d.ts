import * as React from 'react';

/**
 * Pricing tier. The featured tier inverts to the dark surface instead of taking a coloured ribbon.
 * @startingPoint section="Core" subtitle="Pricing tiers, featured tier inverted dark" viewport="700x420"
 */
export interface PricingTierCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  /** e.g. `"$0"` or `"Custom"`. */
  price: string;
  /** e.g. `"/ month"`. */
  cadence?: string;
  features?: string[];
  cta?: string;
  /** Inverts to the dark surface to mark the highlighted choice. */
  featured?: boolean;
  onSelect?: () => void;
}

export declare function PricingTierCard(props: PricingTierCardProps): JSX.Element;
