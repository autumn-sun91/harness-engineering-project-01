import * as React from 'react';

export interface BadgePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Surface it sits on. */
  tone?: 'light' | 'dark';
}

export declare function BadgePill(props: BadgePillProps): JSX.Element;
