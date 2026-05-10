'use client';

import { useId } from 'react';
import { RiMailLine } from '@remixicon/react';
import { Input } from 'ui-common';

import { type BaseFieldProps } from './base';

export function EmailField({
  id,
  label = 'Email address',
  value,
  onChange,
  placeholder = 'you@example.com',
  disabled,
  autoComplete = 'email',
  autoFocus,
  required = true,
}: BaseFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <RiMailLine
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-9"
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}
