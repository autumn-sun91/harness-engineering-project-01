import * as React from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Caption below the field. */
  hint?: string;
}

export declare function TextInput(props: TextInputProps): JSX.Element;
