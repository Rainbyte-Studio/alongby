import React from 'react';
import { Input, InputProps } from './Input';

export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightElement'> {
  currency?: string;
  symbol?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency = 'EUR', symbol = '€', className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        inputMode="decimal"
        leftIcon={<span className="font-sans text-sm font-semibold text-[var(--color-text-secondary)]">{symbol}</span>}
        rightElement={
          <span className="font-sans text-xs font-medium text-[var(--color-text-muted)] select-none pointer-events-none">
            {currency}
          </span>
        }
        className={`tabular-nums ${className}`}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
