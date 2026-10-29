import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        accent: 'border-accent/25 bg-accent/10 text-accent',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
        outline: 'border-border text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
