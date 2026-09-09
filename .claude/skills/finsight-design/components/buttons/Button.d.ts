import * as React from 'react';

/**
 * The pill button. One action colour (Finsight Blue) and a fixed 100px radius.
 * @startingPoint section="Core" subtitle="Pill buttons — primary, secondary, outline, text" viewport="700x180"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Palette. `primary` is the only action colour; the rest are quiet. */
  variant?: 'primary' | 'primary-active' | 'secondary-light' | 'secondary-dark' | 'outline-on-dark' | 'tertiary-text';
  /** `md` = 44px standard CTA, `lg` = 56px hero pill, `sm` = 36px nav pill. */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Render as another element, e.g. `"a"`. */
  as?: 'button' | 'a';
}

export declare function Button(props: ButtonProps): JSX.Element;
