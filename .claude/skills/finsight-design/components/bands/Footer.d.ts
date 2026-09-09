import * as React from 'react';

/**
 * Closing white footer: 6-column link list plus a legal band.
 * @startingPoint section="Bands" subtitle="6-column white footer with legal strip" viewport="1280x420"
 */
export interface FooterColumn { title: string; links: string[] }

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  /** Defaults to the six marketing columns. */
  columns?: FooterColumn[];
  /** Legal-band copy at `--type-caption-size` in muted grey. */
  legal?: string;
}

export declare function Footer(props: FooterProps): JSX.Element;
