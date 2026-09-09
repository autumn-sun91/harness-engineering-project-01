import * as React from 'react';

export interface CTABandProps extends React.HTMLAttributes<HTMLElement> {
  tone?: 'dark' | 'light';
  headline: React.ReactNode;
  subhead?: React.ReactNode;
  actions?: React.ReactNode;
}

export declare function CTABand(props: CTABandProps): JSX.Element;
