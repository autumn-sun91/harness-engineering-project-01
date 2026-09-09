import * as React from 'react';

/**
 * Editorial feature card for 2-up and 3-up benefit grids.
 * @startingPoint section="Core" subtitle="3-up benefit card grid" viewport="700x260"
 */
export interface FeatureCardProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** Optional node above the text — glyph, mockup, image. */
  media?: React.ReactNode;
  tone?: 'light' | 'dark';
  /** Hairline outline on light surfaces. */
  border?: boolean;
}

export declare function FeatureCard(props: FeatureCardProps): JSX.Element;
