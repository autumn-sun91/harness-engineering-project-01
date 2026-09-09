import * as React from 'react';

/**
 * Marketing top navigation, 64px tall: wordmark left, horizontal menu, Sign in + Sign up right.
 * @startingPoint section="Navigation" subtitle="64px marketing nav, light or on-dark" viewport="1280x64"
 */
export interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  /** `light` on white pages, `on-dark` over a dark hero band. */
  tone?: 'light' | 'on-dark';
  links?: string[];
  activeLink?: string;
  onNavigate?: (link: string) => void;
}

export declare function TopNav(props: TopNavProps): JSX.Element;
