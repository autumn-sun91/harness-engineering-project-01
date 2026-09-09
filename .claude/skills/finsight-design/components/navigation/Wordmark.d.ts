import * as React from 'react';

export interface WordmarkProps extends React.HTMLAttributes<HTMLElement> {
  /** Brand name. Defaults to "finsight". */
  text?: string;
  /** Colour of the mark. */
  tone?: 'primary' | 'ink' | 'on-dark';
  /** Font size in px. */
  size?: number;
  href?: string;
}

export declare function Wordmark(props: WordmarkProps): JSX.Element;
