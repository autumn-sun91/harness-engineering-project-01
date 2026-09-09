import * as React from 'react';

export interface SearchPillProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  /** Pill width — number (px) or CSS length. */
  width?: number | string;
}

export declare function SearchPill(props: SearchPillProps): JSX.Element;
