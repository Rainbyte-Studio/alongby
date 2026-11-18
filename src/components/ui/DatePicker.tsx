import React from 'react';
import { Calendar } from 'lucide-react';
import { Input, InputProps } from './Input';

export type DatePickerProps = Omit<InputProps, 'type' | 'leftIcon'>;

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        leftIcon={<Calendar className="w-4 h-4" />}
        className={`tabular-nums ${className}`}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';
