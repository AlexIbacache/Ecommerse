import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-base text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 sm:text-sm',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
