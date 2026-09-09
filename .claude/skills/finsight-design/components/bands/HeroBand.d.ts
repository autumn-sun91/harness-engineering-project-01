import * as React from 'react';

/**
 * Full-bleed hero band. The dark variant with a layered product-UI card stack is the signature pattern.
 * @startingPoint section="Bands" subtitle="Dark full-bleed hero with layered mockups" viewport="1280x620"
 */
export interface HeroBandProps extends React.HTMLAttributes<HTMLElement> {
  tone?: 'dark' | 'light';
  /** Usually a `<BadgePill>`. */
  eyebrow?: React.ReactNode;
  headline: React.ReactNode;
  subhead?: React.ReactNode;
  /** One or two `<Button>`s. */
  actions?: React.ReactNode;
  /** `<ProductUICard>` stack for the right column. */
  mockups?: React.ReactNode;
}

export declare function HeroBand(props: HeroBandProps): JSX.Element;
